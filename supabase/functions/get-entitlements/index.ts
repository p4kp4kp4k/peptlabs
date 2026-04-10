import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_LIMITS: Record<string, object> = {
  free: { max_protocols_month: 1, compare_limit: 1, history_days: 0, export_level: "basic", calc_limit: 1, stack_limit: 1, template_limit: 1, interaction_limit: 1 },
  starter: { max_protocols_month: 3, compare_limit: 5, history_days: 7, export_level: "basic", calc_limit: -1, stack_limit: -1, template_limit: -1, interaction_limit: -1 },
  pro: { max_protocols_month: -1, compare_limit: -1, history_days: -1, export_level: "pro", calc_limit: -1, stack_limit: 10, template_limit: -1, interaction_limit: -1 },
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

    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const userId = payload.sub as string;
    if (!userId) throw new Error("No user id");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get entitlements
    const { data: ent } = await admin
      .from("entitlements")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Check admin
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");

    const plan = ent?.plan ?? "free";
    const isActive = ent?.is_active ?? false;
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

    // Get current month usage
    const month = new Date().toISOString().slice(0, 7);
    const { data: usage } = await admin
      .from("usage_counters")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .single();

    return new Response(JSON.stringify({
      plan,
      isActive: plan === "free" ? true : isActive,
      isAdmin,
      isPro: plan === "pro" && isActive,
      isStarter: plan === "starter" && isActive,
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
