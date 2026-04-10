import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface EntitlementLimits {
  max_protocols_month: number;
  compare_limit: number;
  history_days: number;
  export_level: string;
  calc_limit?: number;
  stack_limit?: number;
  template_limit?: number;
  interaction_limit?: number;
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
  plan: "free" | "starter" | "pro";
  billingType: "monthly" | "lifetime";
  isActive: boolean;
  isAdmin: boolean;
  isPro: boolean;
  isLifetime: boolean;
  isStarter: boolean;
  limits: EntitlementLimits;
  currentPeriodEnd: string | null;
  usage: EntitlementUsage;
}

const FREE_DEFAULTS: EntitlementData = {
  plan: "free",
  billingType: "monthly",
  isActive: true,
  isAdmin: false,
  isPro: false,
  isLifetime: false,
  isStarter: false,
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
  usage: { protocolsCreated: 0, comparisonsMade: 0, exportsMade: 0, calcsMade: 0, stacksViewed: 0, templatesUsed: 0, interactionsChecked: 0 },
};

async function fetchEntitlements(): Promise<EntitlementData> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return FREE_DEFAULTS;

  const res = await supabase.functions.invoke("get-entitlements", { body: {} });
  if (res.error) throw new Error(res.error.message);
  return res.data as EntitlementData;
}

export async function checkFeature(feature: string): Promise<{ allowed: boolean; reason?: string }> {
  const res = await supabase.functions.invoke("can-use-feature", { body: { feature } });
  if (res.error) throw new Error(res.error.message);
  return { allowed: res.data.allowed, reason: res.data.reason };
}

export async function incrementUsage(feature: string): Promise<void> {
  await supabase.functions.invoke("increment-usage", { body: { feature } });
}

export function useEntitlements() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["entitlements", user?.id],
    queryFn: fetchEntitlements,
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const ent = query.data ?? FREE_DEFAULTS;

  return {
    ...ent,
    isLoading: query.isLoading,
    refetch: query.refetch,
    canCreate: (resource: "protocol" | "stack" | "calculation" | "compare" | "export") => {
      if (ent.isAdmin || ent.isLifetime) return true;
      if (ent.isPro) {
        // PRO Monthly has stack limit of 10
        if (resource === "stack") {
          const limit = ent.limits.stack_limit;
          return limit === undefined || limit === -1 || ent.usage.stacksViewed < limit;
        }
        return true;
      }
      if (!ent.isActive) return false;
      if (resource === "protocol") {
        const limit = ent.limits.max_protocols_month;
        return limit === -1 || ent.usage.protocolsCreated < limit;
      }
      if (resource === "compare") {
        const limit = ent.limits.compare_limit;
        return limit === -1 || ent.usage.comparisonsMade < limit;
      }
      if (resource === "export") {
        return ent.limits.export_level !== "none";
      }
      if (ent.isStarter) return true;
      return true;
    },
  };
}
