/**
 * access.feature-map.ts
 * ═════════════════════
 * SINGLE SOURCE OF TRUTH for the permissions matrix on the frontend.
 * This mirrors the backend feature-map.ts to provide instant UI feedback.
 */
import type { FeatureKey, PlanType, BillingType } from "./access.types";

type AccessLevel = "allowed" | "metered" | "blocked";

interface FeatureRule {
  free: AccessLevel;
  pro_monthly: AccessLevel;
  pro_lifetime: AccessLevel;
}

/**
 * The official feature→plan access matrix.
 * "metered" = allowed but subject to usage limits.
 * "allowed" = unlimited.
 * "blocked" = not available at all.
 */
export const FEATURE_MAP: Record<FeatureKey, FeatureRule> = {
  // Metered features (limited for free, unlimited for pro)
  create_protocol:   { free: "metered", pro_monthly: "allowed", pro_lifetime: "allowed" },
  compare:           { free: "metered", pro_monthly: "allowed", pro_lifetime: "allowed" },
  export:            { free: "metered", pro_monthly: "allowed", pro_lifetime: "allowed" },
  calculator:        { free: "metered", pro_monthly: "allowed", pro_lifetime: "allowed" },
  stack_builder:     { free: "metered", pro_monthly: "allowed", pro_lifetime: "allowed" },
  engine:            { free: "metered", pro_monthly: "allowed", pro_lifetime: "allowed" },
  template:          { free: "metered", pro_monthly: "allowed", pro_lifetime: "allowed" },
  interaction_check: { free: "metered", pro_monthly: "allowed", pro_lifetime: "allowed" },

  // Boolean features (blocked for free, open for pro)
  advanced_peptide:  { free: "blocked", pro_monthly: "allowed", pro_lifetime: "allowed" },
  body_map_premium:  { free: "blocked", pro_monthly: "allowed", pro_lifetime: "allowed" },
  history_full:      { free: "blocked", pro_monthly: "allowed", pro_lifetime: "allowed" },
  ai_features:       { free: "blocked", pro_monthly: "allowed", pro_lifetime: "allowed" },
  templates_premium: { free: "blocked", pro_monthly: "allowed", pro_lifetime: "allowed" },

  // Lifetime-only features
  contact_suppliers: { free: "blocked", pro_monthly: "blocked", pro_lifetime: "allowed" },
  vip_badge:         { free: "blocked", pro_monthly: "blocked", pro_lifetime: "allowed" },
  early_access:      { free: "blocked", pro_monthly: "blocked", pro_lifetime: "allowed" },
  vip_support:       { free: "blocked", pro_monthly: "blocked", pro_lifetime: "allowed" },
};

/** 
 * Quick client-side check. Does NOT replace backend validation.
 * Used for instant UI feedback (hiding buttons, showing badges).
 */
export function canAccessLocally(
  feature: FeatureKey,
  plan: PlanType,
  billingType: BillingType,
  isActive: boolean,
  isAdmin: boolean,
): AccessLevel {
  if (isAdmin) return "allowed";

  const key = plan === "pro" && isActive
    ? billingType === "lifetime" ? "pro_lifetime" : "pro_monthly"
    : "free";

  return FEATURE_MAP[feature][key];
}
