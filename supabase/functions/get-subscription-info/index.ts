/**
 * get-subscription-info/index.ts
 * ═════════════════════════════
 * Returns the user's current subscription details.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, handleCors, jsonResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
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

    const { data: sub } = await adminClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", auth.userId)
      .single();

    const { data: ent } = await adminClient
      .from("entitlements")
      .select("*")
      .eq("user_id", auth.userId)
      .single();

    const isLifetime = ent?.billing_type === "lifetime" && ent?.plan === "pro";

    return jsonResponse({
      planId: isLifetime ? "pro_lifetime" : (ent?.plan === "pro" ? "pro_monthly" : "free"),
      status: sub?.status || "none",
      provider: sub?.payment_provider || null,
      currentPeriodEnd: sub?.current_period_end || null,
      cancelAtPeriodEnd: sub?.cancel_at_period_end || false,
      isLifetime,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("get-subscription-info error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});
