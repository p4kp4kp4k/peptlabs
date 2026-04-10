/**
 * billing.service.ts
 * ═════════════════
 * Service layer for billing operations.
 */
import { supabase } from "@/integrations/supabase/client";
import type { CheckoutRequest, CheckoutResponse, SubscriptionInfo, PlanId } from "./billing.types";
import { UPGRADE_PATHS } from "./billing.constants";

/** Create a checkout session for subscription or one-time payment */
export async function createCheckout(req: CheckoutRequest): Promise<CheckoutResponse> {
  const res = await supabase.functions.invoke("create-checkout", { body: req });
  if (res.error) throw new Error(res.error.message);
  return res.data as CheckoutResponse;
}

/** Get current subscription info */
export async function getSubscriptionInfo(): Promise<SubscriptionInfo> {
  const res = await supabase.functions.invoke("get-subscription-info", { body: {} });
  if (res.error) throw new Error(res.error.message);
  return res.data as SubscriptionInfo;
}

/** Cancel the current subscription */
export async function cancelSubscription(): Promise<{ success: boolean }> {
  const res = await supabase.functions.invoke("cancel-subscription", { body: {} });
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/** Check if upgrade is allowed */
export function canUpgrade(currentPlan: PlanId, targetPlan: PlanId): boolean {
  return UPGRADE_PATHS[currentPlan]?.includes(targetPlan) ?? false;
}

/** Get the customer portal URL */
export async function getPortalUrl(): Promise<{ url: string }> {
  const res = await supabase.functions.invoke("get-billing-portal", { body: {} });
  if (res.error) throw new Error(res.error.message);
  return res.data;
}
