/**
 * provider-webhook/index.ts
 * ═════════════════════════
 * Unified webhook handler for subscription payment providers.
 * Routes: POST /provider-webhook?provider=stripe
 *         POST /provider-webhook?provider=mercadopago
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors, jsonResponse } from "../_shared/cors.ts";
import { getProvider } from "../_shared/billing-provider.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

/* ── HMAC signature validation for Mercado Pago ── */
async function validateMpSignature(req: Request, rawBody: string): Promise<boolean> {
  const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.warn("MERCADOPAGO_WEBHOOK_SECRET not set — skipping HMAC validation");
    return true;
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");
  if (!xSignature) {
    console.warn("Missing x-signature header on MP webhook");
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

  /* Build manifest — extract data.id from body for manifest */
  let dataId = "";
  try {
    const parsed = JSON.parse(rawBody);
    dataId = String(parsed?.data?.id || parsed?.id || "");
  } catch { /* ignore */ }

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
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computed !== v1) {
    console.error("MP signature mismatch — rejecting webhook");
    return false;
  }
  return true;
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const providerName = url.searchParams.get("provider");
    if (!providerName) return jsonResponse({ error: "Missing provider param" }, 400);

    const rawBody = await req.text();

    /* ── Signature validation ── */
    if (providerName === "mercadopago") {
      const valid = await validateMpSignature(req, rawBody);
      if (!valid) {
        return jsonResponse({ error: "Invalid signature" }, 403);
      }
    }
    // Stripe signature validation would go here when Stripe is enabled

    const provider = getProvider(providerName);

    /* Parse webhook using the provider adapter */
    const parsed = await provider.parseWebhook(
      new Request(req.url, { method: "POST", body: rawBody }),
    );

    const adminClient = getAdminClient();

    /* ── Idempotency ── */
    const eventId = parsed.raw?.id || parsed.raw?.data?.id || crypto.randomUUID();
    const { data: existing } = await adminClient
      .from("webhook_events")
      .select("id")
      .eq("provider_event_id", String(eventId))
      .eq("provider", providerName)
      .maybeSingle();

    if (existing) {
      return jsonResponse({ status: "already_processed" });
    }

    /* Store webhook event */
    const { data: webhookRecord } = await adminClient
      .from("webhook_events")
      .insert({
        provider: providerName,
        event_type: parsed.event,
        provider_event_id: String(eventId),
        payload: parsed.raw,
      })
      .select("id")
      .single();

    /* ── Resolve userId (try multiple sources) ── */
    let userId = parsed.userId;
    if (!userId && parsed.raw?.data?.external_reference) {
      try {
        const ref =
          typeof parsed.raw.data.external_reference === "string"
            ? JSON.parse(parsed.raw.data.external_reference as string)
            : parsed.raw.data.external_reference;
        userId = ref?.user_id;
      } catch { /* not JSON — ignore */ }
    }
    if (!userId && parsed.raw?.data?.metadata) {
      const meta = parsed.raw.data.metadata as Record<string, unknown>;
      userId = (meta?.user_id as string) || undefined;
    }

    if (!userId) {
      console.warn("Webhook without user_id:", parsed.event);
      return jsonResponse({ status: "no_user_id" });
    }

    const eventType = parsed.event;
    let processed = false;

    /* ── Payment approved / checkout completed ── */
    if (
      eventType.includes("checkout.session.completed") ||
      eventType.includes("payment.approved") ||
      eventType === "payment"
    ) {
      const planId = parsed.planId;
      const isLifetime = planId === "pro_lifetime";

      await adminClient
        .from("entitlements")
        .update({
          plan: "pro",
          billing_type: isLifetime ? "lifetime" : "monthly",
          is_active: true,
          limits: {
            max_protocols_month: isLifetime ? 9999 : 9999,
            compare_limit: 9999,
            history_days: 9999,
            export_level: "premium",
            calc_limit: 9999,
            stack_limit: isLifetime ? 9999 : 10,
            template_limit: 9999,
            interaction_limit: 9999,
          },
          current_period_end: isLifetime
            ? null
            : new Date(Date.now() + 30 * 86400000).toISOString(),
        })
        .eq("user_id", userId);

      await adminClient
        .from("subscriptions")
        .update({
          status: isLifetime ? "lifetime" : "active",
          plan_id: planId,
          payment_provider: providerName,
          current_period_end: isLifetime
            ? null
            : new Date(Date.now() + 30 * 86400000).toISOString(),
        })
        .eq("user_id", userId);

      await adminClient.from("billing_events").insert({
        user_id: userId,
        event_type: isLifetime ? "lifetime_activated" : "subscription_activated",
        provider: providerName,
        payload: { planId, subscriptionId: parsed.subscriptionId },
      });

      processed = true;
    }

    /* ── Subscription cancelled ── */
    if (
      eventType.includes("customer.subscription.deleted") ||
      eventType.includes("subscription.cancelled") ||
      eventType === "cancelled"
    ) {
      await adminClient
        .from("entitlements")
        .update({
          plan: "free",
          billing_type: "monthly",
          is_active: true,
          limits: {
            max_protocols_month: 1,
            compare_limit: 1,
            history_days: 0,
            export_level: "basic",
            calc_limit: 1,
            stack_limit: 1,
            template_limit: 1,
            interaction_limit: 1,
          },
        })
        .eq("user_id", userId);

      await adminClient
        .from("subscriptions")
        .update({ status: "canceled", plan_id: "free" })
        .eq("user_id", userId);

      await adminClient.from("billing_events").insert({
        user_id: userId,
        event_type: "subscription_canceled",
        provider: providerName,
        payload: { subscriptionId: parsed.subscriptionId },
      });

      processed = true;
    }

    /* ── Payment failed ── */
    if (
      eventType.includes("invoice.payment_failed") ||
      eventType.includes("payment.failed")
    ) {
      await adminClient
        .from("subscriptions")
        .update({ status: "past_due" })
        .eq("user_id", userId);

      await adminClient.from("billing_events").insert({
        user_id: userId,
        event_type: "payment_failed",
        provider: providerName,
        payload: parsed.raw,
      });

      processed = true;
    }

    /* Mark webhook as processed */
    if (webhookRecord) {
      await adminClient
        .from("webhook_events")
        .update({ processed, processed_at: new Date().toISOString() })
        .eq("id", webhookRecord.id);
    }

    return jsonResponse({ status: "ok", processed });
  } catch (err) {
    console.error("provider-webhook error:", err);
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
