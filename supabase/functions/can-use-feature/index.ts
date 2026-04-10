import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_LIMITS: Record<string, any> = {
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

    // Admins bypass all limits
    if (isAdmin) {
      return new Response(JSON.stringify({ allowed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // PRO with active subscription bypasses all limits
    if (plan === "pro" && isActive) {
      return new Response(JSON.stringify({ allowed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Starter with active subscription — only protocol limits apply
    if (plan === "starter" && isActive) {
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
          // per-comparison limit enforced in UI
          break;
        case "advanced_peptide":
          allowed = false;
          reason = "Peptídeos avançados disponíveis apenas no plano PRO.";
          break;
        // Starter has unlimited: calculator, stacks, templates, interactions, export
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
    }

    // FREE plan or inactive subscription — check limits with usage counters
    const limits = PLAN_LIMITS.free;
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
      calcs_made: (usage as any)?.calcs_made ?? 0,
      stacks_viewed: (usage as any)?.stacks_viewed ?? 0,
      templates_used: (usage as any)?.templates_used ?? 0,
      interactions_checked: (usage as any)?.interactions_checked ?? 0,
    };

    let allowed = true;
    let reason = "";

    switch (feature) {
      case "create_protocol":
        if (counters.protocols_created >= limits.max_protocols_month) {
          allowed = false;
          reason = "Você atingiu o limite de 1 protocolo/mês no plano Gratuito. Faça upgrade para continuar.";
        }
        break;
      case "compare":
        if (counters.comparisons_made >= limits.compare_limit) {
          allowed = false;
          reason = "Você atingiu o limite de 1 comparação/mês no plano Gratuito.";
        }
        break;
      case "export":
        if (counters.exports_made >= 1) {
          allowed = false;
          reason = "Você atingiu o limite de 1 exportação/mês no plano Gratuito.";
        }
        break;
      case "calculator":
        if (counters.calcs_made >= limits.calc_limit) {
          allowed = false;
          reason = "Você atingiu o limite de 1 cálculo/mês no plano Gratuito.";
        }
        break;
      case "stack_builder":
      case "engine":
        if (counters.stacks_viewed >= limits.stack_limit) {
          allowed = false;
          reason = "Você atingiu o limite de 1 stack/mês no plano Gratuito.";
        }
        break;
      case "template":
        if (counters.templates_used >= limits.template_limit) {
          allowed = false;
          reason = "Você atingiu o limite de 1 template/mês no plano Gratuito.";
        }
        break;
      case "interaction_check":
        if (counters.interactions_checked >= limits.interaction_limit) {
          allowed = false;
          reason = "Você atingiu o limite de 1 verificação/mês no plano Gratuito.";
        }
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
        metadata: { feature, plan: plan || "free", reason, usage: counters },
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
