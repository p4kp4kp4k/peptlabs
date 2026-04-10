/**
 * _shared/feature-map.ts
 * ═══════════════════════
 * SINGLE SOURCE OF TRUTH for which features exist and how they map to usage counters.
 */

export const VALID_FEATURES = [
  "create_protocol",
  "compare",
  "export",
  "calculator",
  "stack_builder",
  "engine",
  "template",
  "interaction_check",
  "advanced_peptide",
  "contact_suppliers",
  "body_map_premium",
  "history_full",
  "ai_features",
  "templates_premium",
  "vip_badge",
  "early_access",
  "vip_support",
] as const;

export type FeatureKey = typeof VALID_FEATURES[number];

/** Features that require counting (metered usage) */
export const METERED_FEATURES: Record<string, string> = {
  create_protocol: "protocols_created",
  compare: "comparisons_made",
  export: "exports_made",
  calculator: "calcs_made",
  stack_builder: "stacks_viewed",
  engine: "stacks_viewed",
  template: "templates_used",
  interaction_check: "interactions_checked",
};

/** Features that are boolean (on/off) — blocked for free, open for pro */
export const BOOLEAN_FEATURES_PRO = [
  "advanced_peptide",
  "body_map_premium",
  "history_full",
  "ai_features",
  "templates_premium",
];

/** Features exclusive to PRO Lifetime */
export const LIFETIME_ONLY_FEATURES = [
  "contact_suppliers",
  "vip_badge",
  "early_access",
  "vip_support",
];

export function isValidFeature(f: string): f is FeatureKey {
  return (VALID_FEATURES as readonly string[]).includes(f);
}
