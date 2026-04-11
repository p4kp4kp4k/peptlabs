/**
 * create-mp-checkout/index.ts
 * ═══════════════════════════
 * Creates a MercadoPago order via Orders API (/v1/orders) for transparent checkout.
 * Supports PIX (bank_transfer) and credit card payments.
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      return jsonResponse({ error: "MercadoPago not configured" }, 500);
    }

    const body = await req.json();
    const { productId, variantId, quantity, paymentMethod, cardToken, installments, payerEmail } = body;

    if (!productId || !quantity || quantity < 1 || !paymentMethod) {
      return jsonResponse({ error: "Missing required fields: productId, quantity, paymentMethod" }, 400);
    }

    // Fetch product
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: product, error: productError } = await adminClient
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("is_active", true)
      .single();

    if (productError || !product) {
      return jsonResponse({ error: "Product not found" }, 404);
    }

    let unitPrice = Number(product.base_price);
    let variantName = "";

    if (variantId) {
      const { data: variant } = await adminClient
        .from("product_variants")
        .select("*")
        .eq("id", variantId)
        .eq("product_id", productId)
        .single();

      if (variant) {
        if (variant.stock < quantity) {
          return jsonResponse({ error: "Estoque insuficiente" }, 400);
        }
        unitPrice = Number(variant.price) || unitPrice;
        variantName = variant.color_name || "";
      }
    }

    const totalAmount = (unitPrice * quantity).toFixed(2);
    const email = payerEmail || user.email || "";
    const idempotencyKey = crypto.randomUUID();

    // Build order payload per MercadoPago Orders API v1 docs
    // Build webhook notification URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const notificationUrl = `${supabaseUrl}/functions/v1/mp-webhook`;

    const orderPayload: Record<string, unknown> = {
      type: "online",
      processing_mode: "automatic",
      total_amount: totalAmount,
      external_reference: JSON.stringify({
        userId: user.id,
        productId,
        variantId: variantId || null,
        quantity,
        paymentMethod,
      }),
      notification_url: notificationUrl,
      payer: {
        email,
      },
      transactions: {
        payments: [] as Record<string, unknown>[],
      },
      description: `${product.name}${variantName ? ` - ${variantName}` : ""} x${quantity}`,
    };

    const payments = (orderPayload.transactions as Record<string, unknown>).payments as Record<string, unknown>[];

    if (paymentMethod === "pix") {
      payments.push({
        amount: totalAmount,
        payment_method: {
          id: "pix",
          type: "bank_transfer",
        },
      });
    } else if (paymentMethod === "credit_card") {
      if (!cardToken) {
        return jsonResponse({ error: "Card token required for credit card payment" }, 400);
      }
      payments.push({
        amount: totalAmount,
        payment_method: {
          id: "master",
          type: "credit_card",
          token: cardToken,
          installments: installments || 1,
          statement_descriptor: "PeptLabs",
        },
      });
    } else {
      return jsonResponse({ error: "Invalid payment method. Use 'pix' or 'credit_card'" }, 400);
    }

    // Create order via MercadoPago Orders API
    console.log("Creating order:", JSON.stringify(orderPayload));

    const mpResponse = await fetch("https://api.mercadopago.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(orderPayload),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("MercadoPago Orders API error:", JSON.stringify(mpData));
      return jsonResponse({
        error: "Payment processing failed",
        details: mpData.message || mpData.error || "Unknown error",
        mpStatus: mpResponse.status,
      }, 400);
    }

    console.log("Order created:", JSON.stringify(mpData));

    // Create order record in DB
    await adminClient.from("orders").insert({
      user_id: user.id,
      product_id: productId,
      variant_id: variantId || null,
      quantity,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      payment_status: mpData.status === "processed" ? "approved" : "pending",
      mp_order_id: mpData.id,
      metadata: { status: mpData.status },
    });

    // Log billing event
    await adminClient.from("billing_events").insert({
      user_id: user.id,
      event_type: "store_order_created",
      provider: "mercadopago",
      payload: {
        orderId: mpData.id,
        productId,
        variantId,
        quantity,
        totalAmount,
        paymentMethod,
        status: mpData.status,
      },
    });

    // Extract payment from response
    // Response structure: mpData.transactions.payments[0]
    const payment = mpData.transactions?.payments?.[0];
    const responseData: Record<string, unknown> = {
      orderId: mpData.id,
      status: mpData.status,
      statusDetail: mpData.status_detail,
      paymentStatus: payment?.status,
    };

    // For PIX, return QR code data from payment_method
    if (paymentMethod === "pix" && payment) {
      const pm = payment.payment_method;
      if (pm) {
        responseData.pix = {
          qrCode: pm.qr_code,
          qrCodeBase64: pm.qr_code_base64,
          ticketUrl: pm.ticket_url,
        };
      }
    }

    // For card, return approval status
    if (paymentMethod === "credit_card" && payment) {
      responseData.card = {
        status: payment.status,
        statusDetail: payment.status_detail,
        authorizationCode: payment.authorization_code,
      };
    }

    return jsonResponse(responseData);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("create-mp-checkout error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
