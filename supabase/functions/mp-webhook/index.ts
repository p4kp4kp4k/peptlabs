/**
 * mp-webhook/index.ts
 * ═══════════════════
 * Receives MercadoPago Order webhook notifications.
 * Configure in MP dashboard: https://<project>.supabase.co/functions/v1/mp-webhook
 * Topic: Order (Mercado Pago)
 * 
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/notifications
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // MP sends GET for validation and POST for notifications
  if (req.method === "GET") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("MP Webhook received:", JSON.stringify(body));

    const { action, type, data } = body;

    // Only process order notifications
    if (type !== "order" || !data?.id) {
      console.log("Ignoring non-order notification:", type);
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN not configured");
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch full order from MP API
    const orderId = data.id;
    const orderResponse = await fetch(
      `https://api.mercadopago.com/v1/orders/${orderId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!orderResponse.ok) {
      console.error("Failed to fetch order:", orderResponse.status);
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const order = await orderResponse.json();
    console.log("Order fetched:", JSON.stringify({ id: order.id, status: order.status }));

    // Parse external_reference to get userId, productId, etc.
    let refData: Record<string, string> = {};
    try {
      refData = JSON.parse(order.external_reference || "{}");
    } catch {
      console.warn("Could not parse external_reference");
    }

    // Log webhook event
    await adminClient.from("webhook_events").insert({
      provider: "mercadopago",
      event_type: action || `order.${order.status}`,
      provider_event_id: orderId,
      payload: {
        orderId: order.id,
        status: order.status,
        statusDetail: order.status_detail,
        totalAmount: order.total_amount,
        payments: order.transactions?.payments?.map((p: any) => ({
          id: p.id,
          status: p.status,
          statusDetail: p.status_detail,
          amount: p.amount,
        })),
        externalReference: refData,
      },
      processed: true,
      processed_at: new Date().toISOString(),
    });

    // Upsert order record
    if (refData.userId) {
      // Check if order already exists for this mp_order_id
      const { data: existingOrder } = await adminClient
        .from("orders")
        .select("id")
        .eq("mp_order_id", orderId)
        .maybeSingle();

      const paymentStatus = order.status === "processed" ? "approved" :
        order.status === "cancelled" ? "cancelled" :
        order.status === "expired" ? "rejected" : "pending";

      if (existingOrder) {
        await adminClient.from("orders").update({
          payment_status: paymentStatus,
          metadata: {
            mp_status: order.status,
            mp_status_detail: order.status_detail,
            payments: order.transactions?.payments,
          },
        }).eq("id", existingOrder.id);
      } else {
        await adminClient.from("orders").insert({
          user_id: refData.userId,
          product_id: refData.productId || null,
          variant_id: refData.variantId || null,
          quantity: parseInt(refData.quantity || "1", 10),
          total_amount: order.total_amount || 0,
          payment_method: refData.paymentMethod || "pix",
          payment_status: paymentStatus,
          mp_order_id: orderId,
          metadata: {
            mp_status: order.status,
            mp_status_detail: order.status_detail,
          },
        });
      }

      // Log billing event
      await adminClient.from("billing_events").insert({
        user_id: refData.userId,
        event_type: `store_order_${order.status}`,
        provider: "mercadopago",
        payload: {
          orderId: order.id,
          status: order.status,
          productId: refData.productId,
          variantId: refData.variantId,
          quantity: refData.quantity,
        },
      });
    }

    // Return 200 to acknowledge (MP retries if not 200/201 within 22s)
    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("mp-webhook error:", err);
    // Still return 200 to prevent infinite retries
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
});
