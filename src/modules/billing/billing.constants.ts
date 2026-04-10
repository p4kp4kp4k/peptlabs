/**
 * billing.constants.ts
 * ═══════════════════
 * Plan pricing and configuration.
 */
import type { PlanId, PaymentProvider } from "./billing.types";

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number; // in BRL cents
  priceDisplay: string;
  period: string;
  isRecurring: boolean;
  stripePriceId?: string;
  mercadopagoPlanId?: string;
}

export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Explorer",
    price: 0,
    priceDisplay: "R$ 0",
    period: "sempre",
    isRecurring: false,
  },
  pro_monthly: {
    id: "pro_monthly",
    name: "PRO Mensal",
    price: 5990, // R$ 59,90
    priceDisplay: "R$ 59,90",
    period: "mês",
    isRecurring: true,
  },
  pro_lifetime: {
    id: "pro_lifetime",
    name: "PRO Vitalício",
    price: 39700, // R$ 397,00
    priceDisplay: "R$ 397",
    period: "único",
    isRecurring: false,
  },
};

export const ACTIVE_PROVIDERS: PaymentProvider[] = ["stripe", "mercadopago"];

export const UPGRADE_PATHS: Record<PlanId, PlanId[]> = {
  free: ["pro_monthly", "pro_lifetime"],
  pro_monthly: ["pro_lifetime"],
  pro_lifetime: [],
};
