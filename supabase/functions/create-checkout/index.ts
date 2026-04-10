/**
 * create-checkout/index.ts
 * ════════════════════════
 * Creates a checkout session via the active payment provider.
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
    const { planId, provider: requestedProvider, successUrl, cancelUrl } = await req.json();

    // Validate plan
    if (!["pro_monthly", "pro_lifetime"].includes(planId)) {
      return jsonResponse({ error: "Invalid plan" }, 400);
    }

    // Check if user already has lifetime
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: ent } = await adminClient
      .from("entitlements")
      .select("plan, billing_type")
      .eq("user_id", auth.userId)
      .single();

    if (ent?.billing_type === "lifetime" && ent?.plan === "pro") {
      return jsonResponse({ error: "Already have lifetime access" }, 400);
    }

    // Determine provider: use requested or fall back to active gateway
    let providerName = requestedProvider;
    if (!providerName) {
      const { data: gw } = await adminClient
        .from("gateway_settings")
        .select("provider")
        .eq("is_active", true)
        .limit(1)
        .single();
      providerName = gw?.provider || "stripe";
    }

    // Get user email
    const { data: { user } } = await auth.userClient.auth.getUser();
    const email = user?.email || "";

    const provider = getProvider(providerName);
    const result = await provider.createCheckout({
      userId: auth.userId,
      email,
      planId,
      successUrl: successUrl || `${req.headers.get("origin")}/app/billing?success=true`,
      cancelUrl: cancelUrl || `${req.headers.get("origin")}/app/billing?canceled=true`,
    });

    // Log billing event
    await adminClient.from("billing_events").insert({
      user_id: auth.userId,
      event_type: "checkout_created",
      provider: providerName,
      payload: { planId, sessionId: result.sessionId, preferenceId: result.preferenceId },
    });

    return jsonResponse(result);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("create-checkout error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
