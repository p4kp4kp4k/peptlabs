/**
 * access.service.ts
 * ═════════════════
 * Service layer for checking feature access against the backend.
 */
import { supabase } from "@/integrations/supabase/client";
import type { EntitlementData, FeatureKey } from "./access.types";
import { FREE_DEFAULTS } from "./access.constants";

/** Fetch full entitlements from the backend */
export async function fetchEntitlements(): Promise<EntitlementData> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return FREE_DEFAULTS;

  const res = await supabase.functions.invoke("get-entitlements", { body: {} });
  if (res.error) throw new Error(res.error.message);
  return res.data as EntitlementData;
}

/** Check if a specific feature is allowed (backend authority) */
export async function checkFeatureAccess(
  feature: FeatureKey,
): Promise<{ allowed: boolean; reason?: string }> {
  const res = await supabase.functions.invoke("can-use-feature", {
    body: { feature },
  });
  if (res.error) throw new Error(res.error.message);
  return { allowed: res.data.allowed, reason: res.data.reason };
}

/** Increment usage counter for a feature */
export async function incrementUsage(feature: string): Promise<void> {
  await supabase.functions.invoke("increment-usage", { body: { feature } });
}
