/**
 * _shared/plan-limits.ts
 * ═══════════════════════
 * SINGLE SOURCE OF TRUTH for plan limits across all Edge Functions.
 * Any change to plan limits should be made HERE and only here.
 */

export interface PlanLimits {
  max_protocols_month: number;  // -1 = unlimited
  compare_limit: number;
  history_days: number;         // -1 = unlimited, 0 = none
  export_level: string;
  calc_limit: number;
  stack_limit: number;
  template_limit: number;
  interaction_limit: number;
}

export type PlanType = "free" | "pro";
export type BillingType = "monthly" | "lifetime";

export const PLAN_LIMITS: Record<PlanType, Partial<Record<BillingType, PlanLimits>>> = {
  free: {
    monthly: {
      max_protocols_month: 1,
      compare_limit: 1,
      history_days: 0,
      export_level: "basic",
      calc_limit: 1,
      stack_limit: 1,
      template_limit: 1,
      interaction_limit: 1,
    },
  },
  pro: {
    monthly: {
      max_protocols_month: -1,
      compare_limit: -1,
      history_days: -1,
      export_level: "pro",
      calc_limit: -1,
      stack_limit: -1,
      template_limit: -1,
      interaction_limit: -1,
    },
    lifetime: {
      max_protocols_month: -1,
      compare_limit: -1,
      history_days: -1,
      export_level: "pro_timeline",
      calc_limit: -1,
      stack_limit: -1,
      template_limit: -1,
      interaction_limit: -1,
    },
  },
};

/** Resolve limits for a plan+billing combo, with fallbacks */
export function resolveLimits(plan: PlanType, billingType: BillingType): PlanLimits {
  const planGroup = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  return (planGroup[billingType] ?? planGroup["monthly"] ?? PLAN_LIMITS.free.monthly!) as PlanLimits;
}

/** Normalize legacy plan names ("starter" → "free") */
export function normalizePlan(raw: string | null | undefined): PlanType {
  if (!raw) return "free";
  if (raw === "starter") return "free";
  if (raw === "pro") return "pro";
  return "free";
}
