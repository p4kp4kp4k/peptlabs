/**
 * provider-webhook/index.ts
 * ═════════════════════════
 * Unified webhook handler for all payment providers.
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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const url = new URL(req.url);
    const providerName = url.searchParams.get("provider");
    if (!providerName) return jsonResponse({ error: "Missing provider param" }, 400);

    const provider = getProvider(providerName);
    const clonedReq = req.clone();
    const rawBody = await req.text();

    // Parse webhook
    const webhookReq = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: rawBody,
    });
    
    // Re-parse from raw body
    const parsed = await provider.parseWebhook(
      new Request(req.url, { method: "POST", body: rawBody })
    );

    const adminClient = getAdminClient();

    // Idempotency check
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

    // Store webhook event
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

    // Process based on event type
    const userId = parsed.userId;
    if (!userId) {
      console.warn("Webhook without user_id:", parsed.event);
      return jsonResponse({ status: "no_user_id" });
    }

    const eventType = parsed.event;
    let processed = false;

    // Handle subscription/payment events
    if (
      eventType.includes("checkout.session.completed") ||
      eventType.includes("payment.approved") ||
      eventType === "payment"
    ) {
      const planId = parsed.planId;
      const isLifetime = planId === "pro_lifetime";

      // Update entitlements
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
          current_period_end: isLifetime ? null : new Date(Date.now() + 30 * 86400000).toISOString(),
        })
        .eq("user_id", userId);

      // Update subscriptions table
      await adminClient
        .from("subscriptions")
        .update({
          status: isLifetime ? "lifetime" : "active",
          plan_id: planId,
          payment_provider: providerName,
          current_period_end: isLifetime ? null : new Date(Date.now() + 30 * 86400000).toISOString(),
        })
        .eq("user_id", userId);

      // Log billing event
      await adminClient.from("billing_events").insert({
        user_id: userId,
        event_type: isLifetime ? "lifetime_activated" : "subscription_activated",
        provider: providerName,
        payload: { planId, subscriptionId: parsed.subscriptionId },
      });

      processed = true;
    }

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

    // Mark webhook as processed
    if (webhookRecord) {
      await adminClient
        .from("webhook_events")
        .update({ processed, processed_at: new Date().toISOString() })
        .eq("id", webhookRecord.id);
    }

    return jsonResponse({ status: "ok", processed });
  } catch (err) {
    console.error("provider-webhook error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
