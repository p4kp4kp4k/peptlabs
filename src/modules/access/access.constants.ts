/**
 * access.constants.ts
 * ═══════════════════
 * Shared constants for the access system.
 */
import type { EntitlementData } from "./access.types";

export const FREE_DEFAULTS: EntitlementData = {
  plan: "free",
  billingType: "monthly",
  isActive: true,
  isAdmin: false,
  isPro: false,
  isLifetime: false,
  limits: {
    max_protocols_month: 1,
    compare_limit: 1,
    history_days: 0,
    export_level: "basic",
    calc_limit: 1,
    stack_limit: 1,
    template_limit: 1,
    interaction_limit: 1,
  },
  currentPeriodEnd: null,
  usage: {
    protocolsCreated: 0,
    comparisonsMade: 0,
    exportsMade: 0,
    calcsMade: 0,
    stacksViewed: 0,
    templatesUsed: 0,
    interactionsChecked: 0,
  },
};
