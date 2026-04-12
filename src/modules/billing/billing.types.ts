/**
 * billing.types.ts
 * ════════════════
 * Central types for the billing system.
 */

export type PaymentProvider = "stripe" | "mercadopago";
export type PlanId = "free" | "pro_monthly" | "pro_lifetime";
export type SubscriptionStatus =
  | "none"
  | "trialing"
  | "active"
  | "canceled"
  | "expired"
  | "past_due"
  | "unpaid"
  | "lifetime";

export interface CheckoutRequest {
  planId: PlanId;
  provider?: PaymentProvider;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResponse {
  url: string;
  sessionId?: string;
  preferenceId?: string;
}

export interface SubscriptionInfo {
  planId: PlanId;
  status: SubscriptionStatus;
  provider: PaymentProvider | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isLifetime: boolean;
}

export interface BillingEvent {
  id: string;
  userId: string;
  event: string;
  provider: PaymentProvider;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface GatewaySettings {
  provider: PaymentProvider;
  isActive: boolean;
  environment: "sandbox" | "production";
  webhookUrl: string | null;
  configuredAt: string | null;
}
