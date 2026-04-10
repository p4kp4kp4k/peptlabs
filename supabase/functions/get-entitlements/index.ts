import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLAN_LIMITS: Record<string, Record<string, object>> = {
  free: {
    monthly: { max_protocols_month: 1, compare_limit: 1, history_days: 0, export_level: "basic", calc_limit: 1, stack_limit: 1, template_limit: 1, interaction_limit: 1 },
  },
  pro: {
    monthly: { max_protocols_month: -1, compare_limit: -1, history_days: -1, export_level: "pro", calc_limit: -1, stack_limit: 10, template_limit: -1, interaction_limit: -1 },
    lifetime: { max_protocols_month: -1, compare_limit: -1, history_days: -1, export_level: "pro_timeline", calc_limit: -1, stack_limit: -1, template_limit: -1, interaction_limit: -1 },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const month = new Date().toISOString().slice(0, 7);
    const [entRes, rolesRes, usageRes] = await Promise.all([
      admin.from("entitlements").select("*").eq("user_id", userId).single(),
      admin.from("user_roles").select("role").eq("user_id", userId),
      admin.from("usage_counters").select("*").eq("user_id", userId).eq("month", month).single(),
    ]);

    const ent = entRes.data;
    const isAdmin = (rolesRes.data ?? []).some((r: any) => r.role === "admin");
    // Normalize: any legacy "starter" plan maps to "free"
    const rawPlan = ent?.plan ?? "free";
    const plan = rawPlan === "starter" ? "free" : rawPlan;
    const billingType = (ent as any)?.billing_type ?? "monthly";
    const isActive = ent?.is_active ?? false;
    
    const planLimits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    const limits = planLimits[billingType] ?? planLimits["monthly"] ?? PLAN_LIMITS.free.monthly;
    
    const usage = usageRes.data;
    const isLifetime = plan === "pro" && billingType === "lifetime" && isActive;

    return new Response(JSON.stringify({
      plan,
      billingType,
      isActive: plan === "free" ? true : isActive,
      isAdmin,
      isPro: plan === "pro" && isActive,
      isLifetime,
      limits,
      currentPeriodEnd: ent?.current_period_end ?? null,
      usage: {
        protocolsCreated: usage?.protocols_created ?? 0,
        comparisonsMade: usage?.comparisons_made ?? 0,
        exportsMade: usage?.exports_made ?? 0,
        calcsMade: (usage as any)?.calcs_made ?? 0,
        stacksViewed: (usage as any)?.stacks_viewed ?? 0,
        templatesUsed: (usage as any)?.templates_used ?? 0,
        interactionsChecked: (usage as any)?.interactions_checked ?? 0,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});