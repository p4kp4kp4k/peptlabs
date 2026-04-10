/**
 * cancel-subscription/index.ts
 * ═══════════════════════════
 * Cancel the user's active subscription.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors, jsonResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { getProvider } from "../_shared/billing-provider.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const auth = await requireAuth(req, corsHeaders);
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get subscription info
    const { data: sub } = await adminClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", auth.userId)
      .single();

    if (!sub) return jsonResponse({ error: "No subscription found" }, 404);
    if (sub.status === "lifetime") return jsonResponse({ error: "Lifetime plans cannot be canceled" }, 400);
    if (sub.status === "free" || sub.status === "canceled") {
      return jsonResponse({ error: "No active subscription to cancel" }, 400);
    }

    // Cancel with provider
    const providerName = sub.payment_provider;
    const subscriptionId = sub.stripe_subscription_id;

    if (providerName && subscriptionId) {
      const provider = getProvider(providerName);
      await provider.cancelSubscription(subscriptionId);
    }

    // Mark as cancel_at_period_end
    await adminClient
      .from("subscriptions")
      .update({ cancel_at_period_end: true })
      .eq("user_id", auth.userId);

    await adminClient.from("billing_events").insert({
      user_id: auth.userId,
      event_type: "subscription_cancel_requested",
      provider: providerName || "manual",
      payload: { subscriptionId },
    });

    return jsonResponse({ success: true, cancelAtPeriodEnd: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("cancel-subscription error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
