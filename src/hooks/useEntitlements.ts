import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Entitlements {
  isPremium: boolean;
  isAdmin: boolean;
  limits: {
    maxProtocols: number;
    maxStacks: number;
    maxCalculationsPerMonth: number;
  } | null;
  usage: {
    protocols: number;
    stacks: number;
    calculationsThisMonth: number;
  } | null;
}

const FREE_LIMITS = {
  maxProtocols: 3,
  maxStacks: 2,
  maxCalculationsPerMonth: 10,
};

async function fetchEntitlements(): Promise<Entitlements> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { isPremium: false, isAdmin: false, limits: FREE_LIMITS, usage: null };
  }

  const res = await supabase.functions.invoke("check-entitlements", {
    body: {},
  });

  if (res.error) throw new Error(res.error.message);
  return res.data as Entitlements;
}

export async function checkEntitlement(resource: "protocol" | "stack" | "calculation"): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const res = await supabase.functions.invoke("check-entitlements", {
    body: { resource },
  });
  if (res.error) throw new Error(res.error.message);
  return { allowed: res.data.allowed, reason: res.data.reason };
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

  const entitlements = query.data ?? {
    isPremium: false,
    isAdmin: false,
    limits: FREE_LIMITS,
    usage: null,
  };

  return {
    ...entitlements,
    isLoading: query.isLoading,
    refetch: query.refetch,
    canCreate: (resource: "protocol" | "stack" | "calculation") => {
      if (entitlements.isPremium || entitlements.isAdmin) return true;
      if (!entitlements.usage || !entitlements.limits) return true;
      if (resource === "protocol") return entitlements.usage.protocols < entitlements.limits.maxProtocols;
      if (resource === "stack") return entitlements.usage.stacks < entitlements.limits.maxStacks;
      if (resource === "calculation") return entitlements.usage.calculationsThisMonth < entitlements.limits.maxCalculationsPerMonth;
      return true;
    },
  };
}
