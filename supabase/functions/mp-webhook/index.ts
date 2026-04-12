import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/* ── Valid status transitions (prevents regressions) ── */
const VALID_NEXT: Record<string, string[]> = {
  pending: ["approved", "cancelled", "rejected"],
  approved: ["refunded", "charged_back"],
  cancelled: [],
  rejected: [],
  refunded: [],
  charged_back: [],
};

function isTransitionValid(from: string, to: string): boolean {
  if (from === to) return false; // no-op
  const allowed = VALID_NEXT[from];
  return allowed ? allowed.includes(to) : true; // unknown → allow
}

/* ── HMAC signature validation ── */
async function validateSignature(req: Request, dataId: string): Promise<boolean> {
  const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.warn("MERCADOPAGO_WEBHOOK_SECRET not set — skipping signature validation");
    return true;
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  if (!xSignature) {
    console.warn("Missing x-signature header");
    return false;
  }

  const parts: Record<string, string> = {};
  for (const part of xSignature.split(",")) {
    const [key, ...valueParts] = part.trim().split("=");
    parts[key] = valueParts.join("=");
  }

  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) {
    console.warn("Invalid x-signature format");
    return false;
  }

  let manifest = "";
  if (dataId) manifest += `id:${dataId};`;
  if (xRequestId) manifest += `request-id:${xRequestId};`;
  manifest += `ts:${ts};`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));
  const computed = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  if (computed !== v1) {
    console.error("Signature mismatch — possible spoofed notification");
    return false;
  }
  return true;
}

/* ── Map MP order status to internal status ── */
function mapOrderStatus(mpStatus: string): string {
  switch (mpStatus) {
    case "processed":
      return "approved";
    case "cancelled":
      return "cancelled";
    case "expired":
      return "rejected";
    case "refunded":
      return "refunded";
    case "charged_back":
    case "chargedback":
      return "charged_back";
    default:
      return "pending";
  }
}

/* ── Stock deduction (atomic + idempotent + oversell-safe) ── */
async function decrementStock(
  adminClient: ReturnType<typeof createClient>,
  order: { variant_id: string | null; quantity: number; metadata: Record<string, unknown> | null },
): Promise<"ok" | "already" | "insufficient" | "error"> {
  if (!order.variant_id) return "ok"; // no variant → nothing to decrement
  const meta = (order.metadata ?? {}) as Record<string, unknown>;
  if (meta.stock_decremented === true) return "already";

  const { data, error } = await adminClient.rpc("decrement_stock_safe", {
    p_variant_id: order.variant_id,
    p_quantity: order.quantity,
  });

  if (error) {
    console.error("decrement_stock_safe error:", error.message);
    return "error";
  }

  /* data === -1 means insufficient stock */
  if (data === -1) {
    console.warn(`Insufficient stock for variant ${order.variant_id} (requested ${order.quantity})`);
    return "insufficient";
  }

  return "ok";
}

/* ── Main handler ── */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method === "GET") return new Response("ok", { status: 200, headers: corsHeaders });

  try {
    const body = await req.json();
    console.log("MP Webhook received:", JSON.stringify(body));

    const { action, type, data } = body;
    if (type !== "order" || !data?.id) {
      console.log("Ignoring non-order notification:", type);
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    /* ── Idempotency check ── */
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const mpOrderId = String(data.id);
    const eventKey = `${action || "order"}:${mpOrderId}`;
    const { data: existingEvent } = await adminClient
      .from("webhook_events")
      .select("id")
      .eq("provider", "mercadopago")
      .eq("provider_event_id", eventKey)
      .eq("processed", true)
      .maybeSingle();

    if (existingEvent) {
      console.log("Duplicate webhook — already processed:", eventKey);
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const isValid = await validateSignature(req, String(data.id));
    if (!isValid) {
      console.error("Invalid webhook signature — rejecting");
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    const accessToken = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!accessToken) {
      console.error("MERCADOPAGO_ACCESS_TOKEN not configured");
      return new Response("ok", { status: 200, headers: corsHeaders });
    }


    const orderId = mpOrderId;
    const orderResponse = await fetch(`https://api.mercadopago.com/v1/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!orderResponse.ok) {
      console.error("Failed to fetch order:", orderResponse.status);
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const order = await orderResponse.json();
    console.log("Order fetched:", JSON.stringify({ id: order.id, status: order.status }));

    const rawExternalReference =
      typeof order.external_reference === "string" ? order.external_reference.trim() : "";

    let legacyRefData: Record<string, string> = {};
    if (rawExternalReference.startsWith("{")) {
      try {
        legacyRefData = JSON.parse(rawExternalReference);
      } catch {
        console.warn("Could not parse legacy external_reference JSON");
      }
    }

    const localOrderId =
      rawExternalReference && !rawExternalReference.startsWith("{") ? rawExternalReference : null;

    // Log in webhook_events
    await adminClient.from("webhook_events").insert({
      provider: "mercadopago",
      event_type: action || `order.${order.status}`,
      provider_event_id: eventKey,
      payload: {
        orderId: order.id,
        status: order.status,
        statusDetail: order.status_detail,
        totalAmount: order.total_amount,
        externalReference: rawExternalReference || null,
        payments: order.transactions?.payments?.map((p: any) => ({
          id: p.id,
          status: p.status,
          statusDetail: p.status_detail,
          amount: p.amount,
        })),
      },
      processed: true,
      processed_at: new Date().toISOString(),
    });

    const paymentStatus = mapOrderStatus(order.status);

    /* ── Find existing local order ── */
    type LocalOrder = {
      id: string;
      user_id: string;
      product_id: string | null;
      variant_id: string | null;
      quantity: number;
      payment_method: string;
      payment_status: string;
      metadata: Record<string, unknown> | null;
    };

    const orderFields = "id, user_id, product_id, variant_id, quantity, payment_method, payment_status, metadata";

    let existingOrder: LocalOrder | null = null;

    const byMpOrder = await adminClient
      .from("orders")
      .select(orderFields)
      .eq("mp_order_id", orderId)
      .maybeSingle();
    existingOrder = byMpOrder.data as LocalOrder | null;

    if (!existingOrder && localOrderId) {
      const byLocalId = await adminClient
        .from("orders")
        .select(orderFields)
        .eq("id", localOrderId)
        .maybeSingle();
      existingOrder = byLocalId.data as LocalOrder | null;
    }

    if (existingOrder) {
      /* ── State transition validation ── */
      const currentStatus = existingOrder.payment_status || "pending";
      if (!isTransitionValid(currentStatus, paymentStatus)) {
        console.warn(`Ignoring invalid transition: ${currentStatus} → ${paymentStatus} for order ${existingOrder.id}`);
        return new Response("ok", { status: 200, headers: corsHeaders });
      }

      /* ── Stock deduction on approval ── */
      let stockDecremented = (existingOrder.metadata as any)?.stock_decremented === true;
      let stockInsufficient = false;
      if (paymentStatus === "approved" && !stockDecremented) {
        const result = await decrementStock(adminClient, existingOrder);
        if (result === "ok") stockDecremented = true;
        else if (result === "insufficient") stockInsufficient = true;
        // "already" and "error" keep stockDecremented unchanged
      }

      /* ── Update order ── */
      await adminClient
        .from("orders")
        .update({
          mp_order_id: orderId,
          total_amount: Number(order.total_amount || 0),
          payment_status: paymentStatus,
          metadata: {
            ...(existingOrder.metadata as Record<string, unknown> || {}),
            external_reference: rawExternalReference || null,
            mp_status: order.status,
            mp_status_detail: order.status_detail,
            payments: order.transactions?.payments ?? [],
            stock_decremented: stockDecremented,
            ...(stockInsufficient ? { stock_insufficient: true } : {}),
          },
        })
        .eq("id", existingOrder.id);

      await adminClient.from("billing_events").insert({
        user_id: existingOrder.user_id,
        event_type: `store_order_${order.status}`,
        provider: "mercadopago",
        payload: {
          orderId: order.id,
          localOrderId: existingOrder.id,
          productId: existingOrder.product_id,
          variantId: existingOrder.variant_id,
          quantity: existingOrder.quantity,
          paymentMethod: existingOrder.payment_method,
          status: order.status,
          paymentStatus,
        },
      });
    } else if (legacyRefData.userId) {
      await adminClient.from("orders").insert({
        user_id: legacyRefData.userId,
        product_id: legacyRefData.productId || null,
        variant_id: legacyRefData.variantId || null,
        quantity: parseInt(legacyRefData.quantity || "1", 10),
        total_amount: Number(order.total_amount || 0),
        payment_method: legacyRefData.paymentMethod || "pix",
        payment_status: paymentStatus,
        mp_order_id: orderId,
        metadata: {
          external_reference: rawExternalReference || null,
          mp_status: order.status,
          mp_status_detail: order.status_detail,
          payments: order.transactions?.payments ?? [],
          stock_decremented: false,
        },
      });

      await adminClient.from("billing_events").insert({
        user_id: legacyRefData.userId,
        event_type: `store_order_${order.status}`,
        provider: "mercadopago",
        payload: {
          orderId: order.id,
          productId: legacyRefData.productId,
          variantId: legacyRefData.variantId,
          quantity: legacyRefData.quantity,
          paymentMethod: legacyRefData.paymentMethod,
          status: order.status,
          paymentStatus,
        },
      });
    } else {
      console.warn(
        "Webhook for order without matching local record:",
        JSON.stringify({ orderId, externalReference: rawExternalReference || null }),
      );
    }

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("mp-webhook error:", err);
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
});
