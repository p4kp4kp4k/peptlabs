import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface EntitlementLimits {
  max_protocols_month: number;
  compare_limit: number;
  history_days: number;
  export_level: string;
}

export interface EntitlementUsage {
  protocolsCreated: number;
  comparisonsMade: number;
  exportsMade: number;
}

export interface EntitlementData {
  plan: "free" | "starter" | "pro";
  isActive: boolean;
  isAdmin: boolean;
  isPro: boolean;
  isStarter: boolean;
  limits: EntitlementLimits;
  currentPeriodEnd: string | null;
  usage: EntitlementUsage;
}

const FREE_DEFAULTS: EntitlementData = {
  plan: "free",
  isActive: false,
  isAdmin: false,
  isPro: false,
  isStarter: false,
  limits: { max_protocols_month: 0, compare_limit: 0, history_days: 0, export_level: "none" },
  currentPeriodEnd: null,
  usage: { protocolsCreated: 0, comparisonsMade: 0, exportsMade: 0 },
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
      if (ent.isAdmin || ent.isPro) return true;
      if (!ent.isActive) return false;
      if (resource === "protocol") {
        const limit = ent.limits.max_protocols_month;
        return limit === -1 || ent.usage.protocolsCreated < limit;
      }
      if (resource === "compare") {
        const limit = ent.limits.compare_limit;
        return limit === -1 || true; // per-comparison limit enforced in UI
      }
      return ent.isStarter;
    },
  };
}
