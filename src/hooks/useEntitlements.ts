import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchEntitlements, FREE_DEFAULTS } from "@/modules/access";
import type { EntitlementData, EntitlementUsage, PlanLimits } from "@/modules/access";

// Re-export types for backward compatibility
export type { EntitlementData, EntitlementUsage, PlanLimits as EntitlementLimits };

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
  };
}
