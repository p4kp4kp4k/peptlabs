/**
 * mp-webhook/index.ts
 * ═══════════════════
 * Receives MercadoPago Order webhook notifications.
 * Configure in MP dashboard: https://<project>.supabase.co/functions/v1/mp-webhook
 * Topic: Order (Mercado Pago)
 *
 * Validates x-signature header using HMAC SHA-256 for authenticity.
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Validates the x-signature header from MercadoPago.
 * Template: id:[data.id];request-id:[x-request-id];ts:[ts];
 * HMAC SHA-256 with the webhook secret as key.
 */
async function validateSignature(
  req: Request,
  dataId: string,
): Promise<boolean> {
  const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.warn("MERCADOPAGO_WEBHOOK_SECRET not set — skipping signature validation");
    return true; // Allow if not configured (graceful degradation)
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature) {
    console.warn("Missing x-signature header");
    return false;
  }

  // Parse x-signature: "ts=...,v1=..."
  const parts: Record<string, string> = {};
  for (const part of xSignature.split(",")) {
    const [key, ...valueParts] = part.trim().split("=");
    parts[key] = valueParts.join("=");
  }

  const ts = parts["ts"];
  const v1 = parts["v1"];

  if (!ts || !v1) {
    console.warn("Invalid x-signature format");
    return false;
  }

  // Build the manifest template
  // Template: id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
  let manifest = "";
  if (dataId) {
    manifest += `id:${dataId};`;
  }
  if (xRequestId) {
    manifest += `request-id:${xRequestId};`;
  }
  manifest += `ts:${ts};`;

  // Compute HMAC SHA-256
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(manifest),
  );

  // Convert to hex
  const computed = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computed !== v1) {
    console.error("Signature mismatch! Possible spoofed notification.");
    return false;
  }

  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // MP sends GET for validation
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

    // Validate x-signature
    const isValid = await validateSignature(req, String(data.id));
    if (!isValid) {
      console.error("Invalid webhook signature — rejecting notification");
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN not configured");
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch full order from MP API
    const orderId = data.id;
    const orderResponse = await fetch(
      `https://api.mercadopago.com/v1/orders/${orderId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!orderResponse.ok) {
      console.error("Failed to fetch order:", orderResponse.status);
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const order = await orderResponse.json();
    console.log(
      "Order fetched:",
      JSON.stringify({ id: order.id, status: order.status }),
    );

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
      const { data: existingOrder } = await adminClient
        .from("orders")
        .select("id")
        .eq("mp_order_id", orderId)
        .maybeSingle();

      const paymentStatus =
        order.status === "processed"
          ? "approved"
          : order.status === "cancelled"
            ? "cancelled"
            : order.status === "expired"
              ? "rejected"
              : "pending";

      if (existingOrder) {
        await adminClient
          .from("orders")
          .update({
            payment_status: paymentStatus,
            metadata: {
              mp_status: order.status,
              mp_status_detail: order.status_detail,
              payments: order.transactions?.payments,
            },
          })
          .eq("id", existingOrder.id);
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
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
});
