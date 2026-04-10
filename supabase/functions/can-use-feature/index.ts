import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_FEATURES = [
  "create_protocol", "compare", "export", "calculator",
  "stack_builder", "engine", "template", "interaction_check", "advanced_peptide",
  "contact_suppliers",
];

const PLAN_LIMITS: Record<string, Record<string, any>> = {
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

    const body = await req.json().catch(() => ({}));
    const feature = body.feature as string;

    if (!feature || typeof feature !== "string" || !VALID_FEATURES.includes(feature)) {
      return new Response(JSON.stringify({ error: `Invalid feature. Must be one of: ${VALID_FEATURES.join(", ")}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Normalize legacy "starter" to "free"
    const rawPlan = entRes.data?.plan ?? "free";
    const plan = rawPlan === "starter" ? "free" : rawPlan;
    const billingType = (entRes.data as any)?.billing_type ?? "monthly";
    const isActive = entRes.data?.is_active ?? false;
    const isAdmin = (rolesRes.data ?? []).some((r: any) => r.role === "admin");
    const isLifetime = plan === "pro" && billingType === "lifetime" && isActive;

    // Admins bypass all limits
    if (isAdmin) {
      return new Response(JSON.stringify({ allowed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const usage = usageRes.data;
    const planLimits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    const limits = planLimits[billingType] ?? planLimits["monthly"] ?? PLAN_LIMITS.free.monthly;

    // ── PRO Lifetime: everything unlimited ──
    if (isLifetime) {
      return new Response(JSON.stringify({ allowed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── PRO Monthly ──
    if (plan === "pro" && isActive) {
      if (feature === "contact_suppliers") {
        const reason = "Contato com fornecedores é exclusivo do plano PRO Vitalício.";
        await admin.from("history").insert({
          user_id: userId, kind: "premium_gate",
          metadata: { feature, plan, billingType, reason },
        });
        return new Response(JSON.stringify({ allowed: false, reason }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (feature === "stack_builder" || feature === "engine") {
        const stacks = (usage as any)?.stacks_viewed ?? 0;
        const limit = limits.stack_limit;
        if (limit !== -1 && stacks >= limit) {
          const reason = `Você atingiu o limite de ${limit} stacks/mês no PRO Mensal. Faça upgrade para o PRO Vitalício para acesso ilimitado.`;
          await admin.from("history").insert({
            user_id: userId, kind: "premium_gate",
            metadata: { feature, plan, billingType, reason },
          });
          return new Response(JSON.stringify({ allowed: false, reason }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      return new Response(JSON.stringify({ allowed: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── FREE plan (or inactive subscription) ──
    const freeLimits = PLAN_LIMITS.free.monthly;
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
        if (counters.protocols_created >= freeLimits.max_protocols_month) {
          allowed = false;
          reason = "Você atingiu o limite de 1 protocolo/mês no plano Gratuito. Faça upgrade para continuar.";
        }
        break;
      case "compare":
        if (counters.comparisons_made >= freeLimits.compare_limit) {
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
        if (counters.calcs_made >= freeLimits.calc_limit) {
          allowed = false;
          reason = "Você atingiu o limite de 1 cálculo/mês no plano Gratuito.";
        }
        break;
      case "stack_builder":
      case "engine":
        if (counters.stacks_viewed >= freeLimits.stack_limit) {
          allowed = false;
          reason = "Você atingiu o limite de 1 stack/mês no plano Gratuito.";
        }
        break;
      case "template":
        if (counters.templates_used >= freeLimits.template_limit) {
          allowed = false;
          reason = "Você atingiu o limite de 1 template/mês no plano Gratuito.";
        }
        break;
      case "interaction_check":
        if (counters.interactions_checked >= freeLimits.interaction_limit) {
          allowed = false;
          reason = "Você atingiu o limite de 1 verificação/mês no plano Gratuito.";
        }
        break;
      case "advanced_peptide":
        allowed = false;
        reason = "Peptídeos avançados disponíveis apenas no plano PRO.";
        break;
      case "contact_suppliers":
        allowed = false;
        reason = "Contato com fornecedores é exclusivo do plano PRO Vitalício.";
        break;
      default:
        break;
    }

    if (!allowed) {
      await admin.from("history").insert({
        user_id: userId, kind: "premium_gate",
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