/**
 * useBilling.ts
 * ═════════════
 * Hook for billing operations.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  createCheckout,
  getSubscriptionInfo,
  cancelSubscription,
  canUpgrade,
} from "@/modules/billing";
import type { PlanId, PaymentProvider, SubscriptionInfo } from "@/modules/billing";
import { toast } from "sonner";

export function useBilling() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const subscriptionQuery = useQuery({
    queryKey: ["subscription-info", user?.id],
    queryFn: getSubscriptionInfo,
    enabled: !!user,
    staleTime: 60_000,
  });

  const checkoutMutation = useMutation({
    mutationFn: (params: { planId: PlanId; provider?: PaymentProvider }) =>
      createCheckout({
        planId: params.planId,
        ...(params.provider ? { provider: params.provider } : {}),
        successUrl: `${window.location.origin}/app/billing?success=true`,
        cancelUrl: `${window.location.origin}/app/billing?canceled=true`,
      }),
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err: Error) => {
      toast.error("Erro ao iniciar checkout", { description: err.message });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      toast.success("Assinatura será cancelada ao fim do período");
      queryClient.invalidateQueries({ queryKey: ["subscription-info"] });
      queryClient.invalidateQueries({ queryKey: ["entitlements"] });
    },
    onError: (err: Error) => {
      toast.error("Erro ao cancelar", { description: err.message });
    },
  });

  const info: SubscriptionInfo = subscriptionQuery.data ?? {
    planId: "free",
    status: "none",
    provider: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    isLifetime: false,
  };

  return {
    ...info,
    isLoading: subscriptionQuery.isLoading,
    checkout: checkoutMutation.mutate,
    isCheckingOut: checkoutMutation.isPending,
    cancel: cancelMutation.mutate,
    isCanceling: cancelMutation.isPending,
    canUpgradeTo: (target: PlanId) => canUpgrade(info.planId, target),
    refetch: subscriptionQuery.refetch,
  };
}
