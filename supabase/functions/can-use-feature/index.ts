import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { resolveLimits, normalizePlan } from "../_shared/plan-limits.ts";
import type { BillingType } from "../_shared/plan-limits.ts";
import {
  isValidFeature,
  METERED_FEATURES,
  BOOLEAN_FEATURES_PRO,
  LIFETIME_ONLY_FEATURES,
} from "../_shared/feature-map.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { userId, adminClient: admin } = await requireAuth(req, corsHeaders);

    const body = await req.json().catch(() => ({}));
    const feature = body.feature as string;

    if (!feature || !isValidFeature(feature)) {
      return jsonResponse({ error: `Invalid feature: ${feature}` }, 400);
    }

    const month = new Date().toISOString().slice(0, 7);
    const [entRes, rolesRes, usageRes] = await Promise.all([
      admin.from("entitlements").select("*").eq("user_id", userId).single(),
      admin.from("user_roles").select("role").eq("user_id", userId),
      admin.from("usage_counters").select("*").eq("user_id", userId).eq("month", month).single(),
    ]);

    const plan = normalizePlan(entRes.data?.plan);
    const billingType = ((entRes.data as any)?.billing_type ?? "monthly") as BillingType;
    const isActive = entRes.data?.is_active ?? false;
    const isAdmin = (rolesRes.data ?? []).some((r: any) => r.role === "admin");
    const isLifetime = plan === "pro" && billingType === "lifetime" && isActive;
    const isPro = plan === "pro" && isActive;

    // ── Admins bypass everything ──
    if (isAdmin) return jsonResponse({ allowed: true });

    // ── Lifetime-only features ──
    if (LIFETIME_ONLY_FEATURES.includes(feature)) {
      if (isLifetime) return jsonResponse({ allowed: true });
      const reason = feature === "contact_suppliers"
        ? "Contato com fornecedores é exclusivo do plano PRO Vitalício."
        : `Recurso "${feature}" é exclusivo do plano PRO Vitalício.`;
      await logGate(admin, userId, feature, plan, billingType, reason);
      return jsonResponse({ allowed: false, reason });
    }

    // ── PRO Lifetime: everything else unlimited ──
    if (isLifetime) return jsonResponse({ allowed: true });

    // ── PRO Monthly: boolean features allowed, metered unlimited ──
    if (isPro) return jsonResponse({ allowed: true });

    // ── Boolean features: blocked for free ──
    if (BOOLEAN_FEATURES_PRO.includes(feature)) {
      const reason = "Este recurso está disponível apenas no plano PRO.";
      await logGate(admin, userId, feature, plan, billingType, reason);
      return jsonResponse({ allowed: false, reason });
    }

    // ── Metered features: check usage vs limit ──
    const counterCol = METERED_FEATURES[feature];
    if (counterCol) {
      const limits = resolveLimits(plan, billingType);
      const limitMap: Record<string, number> = {
        protocols_created: limits.max_protocols_month,
        comparisons_made: limits.compare_limit,
        exports_made: 1, // free gets 1
        calcs_made: limits.calc_limit,
        stacks_viewed: limits.stack_limit,
        templates_used: limits.template_limit,
        interactions_checked: limits.interaction_limit,
      };
      const limit = limitMap[counterCol] ?? 0;
      const used = (usageRes.data as any)?.[counterCol] ?? 0;

      if (limit !== -1 && used >= limit) {
        const reason = `Você atingiu o limite de ${limit} uso(s)/mês no plano Gratuito. Faça upgrade para continuar.`;
        await logGate(admin, userId, feature, plan, billingType, reason);
        return jsonResponse({ allowed: false, reason });
      }
    }

    return jsonResponse({ allowed: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});

async function logGate(
  admin: any,
  userId: string,
  feature: string,
  plan: string,
  billingType: string,
  reason: string,
) {
  await admin.from("history").insert({
    user_id: userId,
    kind: "premium_gate",
    metadata: { feature, plan, billingType, reason },
  });
}
