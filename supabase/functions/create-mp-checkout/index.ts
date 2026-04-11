/**
 * create-mp-checkout/index.ts
 * ═══════════════════════════
 * Creates a MercadoPago checkout preference for product purchase.
 * Supports PIX and credit card payments.
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    // Get MercadoPago access token
    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      return jsonResponse(
        { error: "MercadoPago not configured" },
        500
      );
    }

    // Parse request body
    const body = await req.json();
    const { productId, variantId, quantity, successUrl, cancelUrl } = body;

    if (!productId || !quantity || quantity < 1) {
      return jsonResponse({ error: "Invalid request: productId and quantity required" }, 400);
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

    // Fetch variant if specified
    let variantName = "";
    let unitPrice = Number(product.base_price);

    if (variantId) {
      const { data: variant, error: variantError } = await adminClient
        .from("product_variants")
        .select("*")
        .eq("id", variantId)
        .eq("product_id", productId)
        .single();

      if (variantError || !variant) {
        return jsonResponse({ error: "Variant not found" }, 404);
      }

      if (variant.stock < quantity) {
        return jsonResponse({ error: "Insufficient stock" }, 400);
      }

      unitPrice = Number(variant.price) || unitPrice;
      variantName = variant.color_name ? ` - ${variant.color_name}` : "";
    }

    const origin = req.headers.get("origin") || "https://peptlabs.lovable.app";

    // Create MercadoPago preference
    const preference = {
      items: [
        {
          title: `${product.name}${variantName}`,
          quantity: Number(quantity),
          unit_price: unitPrice,
          currency_id: "BRL",
        },
      ],
      payer: {
        email: user.email || "",
      },
      payment_methods: {
        excluded_payment_types: [],
        installments: 12,
      },
      back_urls: {
        success: successUrl || `${origin}/app/store?payment=success`,
        failure: `${origin}/app/store?payment=failure`,
        pending: `${origin}/app/store?payment=pending`,
      },
      auto_return: "approved",
      external_reference: JSON.stringify({
        userId: user.id,
        productId,
        variantId: variantId || null,
        quantity,
      }),
      statement_descriptor: "PeptiLab",
    };

    const mpResponse = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(preference),
      }
    );

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("MercadoPago error:", mpData);
      return jsonResponse(
        { error: "Failed to create checkout", details: mpData.message },
        500
      );
    }

    // Log billing event
    await adminClient.from("billing_events").insert({
      user_id: user.id,
      event_type: "store_checkout_created",
      provider: "mercadopago",
      payload: {
        productId,
        variantId,
        quantity,
        unitPrice,
        total: unitPrice * quantity,
        preferenceId: mpData.id,
      },
    });

    return jsonResponse({
      checkoutUrl: mpData.init_point,
      sandboxUrl: mpData.sandbox_init_point,
      preferenceId: mpData.id,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("create-mp-checkout error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
