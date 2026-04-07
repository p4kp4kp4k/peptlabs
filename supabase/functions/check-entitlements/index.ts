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

    // Decode JWT claims manually (the token is already verified by Supabase infrastructure)
    const token = authHeader.replace("Bearer ", "");
    let claims: Record<string, unknown>;
    try {
      const payloadBase64 = token.split(".")[1];
      const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
      claims = JSON.parse(payloadJson);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.sub as string;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse body
    const body = await req.json().catch(() => ({}));
    const resource = body.resource as string | undefined;

    // Use service role client for counting (bypasses RLS)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get subscription status
    const { data: sub } = await adminClient
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .single();

    const isPremium =
      sub?.status === "premium" ||
      sub?.status === "active" ||
      sub?.status === "trialing";

    // Check admin
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");

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
      adminClient
        .from("protocols")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      adminClient
        .from("stacks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      adminClient
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

    if (!allowed) {
      await adminClient.from("history").insert({
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
