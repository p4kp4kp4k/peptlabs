import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const FREE_LIMITS = {
  maxProtocols: 3,
  maxStacks: 2,
  maxCalculationsPerMonth: 10,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Parse body
    const body = await req.json().catch(() => ({}));
    const resource = body.resource as string | undefined; // "protocol" | "stack" | "calculation"

    // Get subscription status
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .single();

    const isPremium =
      sub?.status === "premium" ||
      sub?.status === "active" ||
      sub?.status === "trialing";

    // Check admin
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");

    // If premium or admin, always allow
    if (isPremium || isAdmin) {
      return new Response(
        JSON.stringify({
          allowed: true,
          isPremium: true,
          isAdmin,
          limits: null,
          usage: null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count usage for free user
    const [protocolsRes, stacksRes, calcsRes] = await Promise.all([
      supabase
        .from("protocols")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("stacks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("calculations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ]);

    const usage = {
      protocols: protocolsRes.count ?? 0,
      stacks: stacksRes.count ?? 0,
      calculationsThisMonth: calcsRes.count ?? 0,
    };

    let allowed = true;
    let reason = "";

    if (resource === "protocol" && usage.protocols >= FREE_LIMITS.maxProtocols) {
      allowed = false;
      reason = `Limite de ${FREE_LIMITS.maxProtocols} protocolos atingido no plano gratuito.`;
    } else if (resource === "stack" && usage.stacks >= FREE_LIMITS.maxStacks) {
      allowed = false;
      reason = `Limite de ${FREE_LIMITS.maxStacks} stacks atingido no plano gratuito.`;
    } else if (resource === "calculation" && usage.calculationsThisMonth >= FREE_LIMITS.maxCalculationsPerMonth) {
      allowed = false;
      reason = `Limite de ${FREE_LIMITS.maxCalculationsPerMonth} cálculos/mês atingido no plano gratuito.`;
    }

    // Log blocked attempt
    if (!allowed) {
      await supabase.from("history").insert({
        user_id: userId,
        kind: "premium_gate",
        metadata: { resource, reason, usage },
      });
    }

    return new Response(
      JSON.stringify({
        allowed,
        reason,
        isPremium: false,
        isAdmin: false,
        limits: FREE_LIMITS,
        usage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
