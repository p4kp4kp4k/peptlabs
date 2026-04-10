import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { requireAuth } from "../_shared/auth-guard.ts";
import { resolveLimits, normalizePlan } from "../_shared/plan-limits.ts";
import type { BillingType } from "../_shared/plan-limits.ts";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const { userId, adminClient: admin } = await requireAuth(req, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    });

    const month = new Date().toISOString().slice(0, 7);
    const [entRes, rolesRes, usageRes] = await Promise.all([
      admin.from("entitlements").select("*").eq("user_id", userId).single(),
      admin.from("user_roles").select("role").eq("user_id", userId),
      admin.from("usage_counters").select("*").eq("user_id", userId).eq("month", month).single(),
    ]);

    const ent = entRes.data;
    const isAdmin = (rolesRes.data ?? []).some((r: any) => r.role === "admin");
    const plan = normalizePlan(ent?.plan);
    const billingType = ((ent as any)?.billing_type ?? "monthly") as BillingType;
    const isActive = ent?.is_active ?? false;
    const isLifetime = plan === "pro" && billingType === "lifetime" && isActive;
    const limits = resolveLimits(plan, billingType);
    const usage = usageRes.data;

    return jsonResponse({
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
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
