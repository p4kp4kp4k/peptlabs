import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_LIMITS: Record<string, any> = {
  free: { max_protocols_month: 0, compare_limit: 0, history_days: 0, export_level: "none" },
  starter: { max_protocols_month: 3, compare_limit: 5, history_days: 7, export_level: "basic" },
  pro: { max_protocols_month: -1, compare_limit: -1, history_days: -1, export_level: "pro" },
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

    const body = await req.json().catch(() => ({}));
    const feature = body.feature as string;

    if (!feature) {
      return new Response(JSON.stringify({ error: "Missing feature" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get entitlements
    const { data: ent } = await admin.from("entitlements").select("*").eq("user_id", userId).single();
    const plan = ent?.plan ?? "free";
    const isActive = ent?.is_active ?? false;

    // Check admin
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");

    // Admins and PRO bypass all limits
    if (isAdmin || (plan === "pro" && isActive)) {
      return new Response(JSON.stringify({ allowed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Free users can't use anything
    if (!isActive || plan === "free") {
      // Log attempt
      await admin.from("history").insert({
        user_id: userId,
        kind: "premium_gate",
        metadata: { feature, plan, reason: "Plano inativo ou gratuito" },
      });
      return new Response(JSON.stringify({
        allowed: false,
        reason: "Você precisa de um plano ativo para usar esta funcionalidade.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Starter limits
    const limits = PLAN_LIMITS.starter;
    const month = new Date().toISOString().slice(0, 7);
    const { data: usage } = await admin
      .from("usage_counters")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .single();

    const counters = {
      protocols_created: usage?.protocols_created ?? 0,
      comparisons_made: usage?.comparisons_made ?? 0,
      exports_made: usage?.exports_made ?? 0,
    };

    let allowed = true;
    let reason = "";

    switch (feature) {
      case "create_protocol":
        if (counters.protocols_created >= limits.max_protocols_month) {
          allowed = false;
          reason = `Limite de ${limits.max_protocols_month} protocolos/mês atingido no plano Starter.`;
        }
        break;
      case "compare":
        // Compare limit is per-comparison (UI enforced), but we can track monthly too
        break;
      case "export":
        // Starter has basic export only
        break;
      case "engine":
      case "stack_builder":
        allowed = false;
        reason = "Funcionalidade disponível apenas no plano PRO.";
        break;
      case "advanced_peptide":
        allowed = false;
        reason = "Peptídeos avançados disponíveis apenas no plano PRO.";
        break;
      default:
        break;
    }

    if (!allowed) {
      await admin.from("history").insert({
        user_id: userId,
        kind: "premium_gate",
        metadata: { feature, plan, reason, usage: counters },
      });
    }

    return new Response(JSON.stringify({ allowed, reason }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
