/**
 * Access Module — barrel export
 */
export { useFeatureAccess } from "./useFeatureAccess";
export { canAccessLocally, FEATURE_MAP } from "./access.feature-map";
export { fetchEntitlements, checkFeatureAccess, incrementUsage } from "./access.service";
export { FREE_DEFAULTS } from "./access.constants";
export type {
  FeatureKey,
  PlanType,
  BillingType,
  AccessResult,
  PlanLimits,
  EntitlementUsage,
  EntitlementData,
} from "./access.types";
