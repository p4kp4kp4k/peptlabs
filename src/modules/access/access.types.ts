/**
 * access.types.ts
 * ═══════════════
 * Central types for the access/permissions system.
 */

export type PlanType = "free" | "pro";
export type BillingType = "monthly" | "lifetime";

export type FeatureKey =
  | "create_protocol"
  | "compare"
  | "export"
  | "calculator"
  | "stack_builder"
  | "engine"
  | "template"
  | "interaction_check"
  | "advanced_peptide"
  | "contact_suppliers"
  | "body_map_premium"
  | "history_full"
  | "ai_features"
  | "templates_premium"
  | "vip_badge"
  | "early_access"
  | "vip_support";

export interface AccessResult {
  allowed: boolean;
  reason?: string;
  /** true while the backend check is in-flight */
  isChecking: boolean;
}

export interface PlanLimits {
  max_protocols_month: number;
  compare_limit: number;
  history_days: number;
  export_level: string;
  calc_limit: number;
  stack_limit: number;
  template_limit: number;
  interaction_limit: number;
}

export interface EntitlementUsage {
  protocolsCreated: number;
  comparisonsMade: number;
  exportsMade: number;
  calcsMade: number;
  stacksViewed: number;
  templatesUsed: number;
  interactionsChecked: number;
}

export interface EntitlementData {
  plan: PlanType;
  billingType: BillingType;
  isActive: boolean;
  isAdmin: boolean;
  isPro: boolean;
  isLifetime: boolean;
  limits: PlanLimits;
  currentPeriodEnd: string | null;
  usage: EntitlementUsage;
}
