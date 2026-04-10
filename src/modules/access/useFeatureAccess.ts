/**
 * useFeatureAccess.ts
 * ═══════════════════
 * THE central hook for feature access checks throughout the app.
 *
 * Usage:
 *   const { allowed, reason, isChecking, hasAccess, showGate } = useFeatureAccess("calculator");
 *
 *   if (!hasAccess) return <PremiumGateModal ... />;
 */
import { useState, useCallback, useMemo } from "react";
import { useEntitlements } from "@/hooks/useEntitlements";
import { canAccessLocally, FEATURE_MAP } from "./access.feature-map";
import { checkFeatureAccess } from "./access.service";
import type { FeatureKey } from "./access.types";

interface UseFeatureAccessReturn {
  /** Quick local check — true if feature is available based on cached entitlements */
  hasAccess: boolean;
  /** true if user is admin or PRO */
  isPremium: boolean;
  /** true if this feature is exclusive to lifetime */
  isLifetimeOnly: boolean;
  /** Whether the feature is metered (has usage limits) */
  isMetered: boolean;
  /** Trigger a backend check + gate modal if denied */
  guardAction: (onAllowed: () => void) => Promise<void>;
  /** Gate state for PremiumGateModal */
  gateOpen: boolean;
  gateReason: string;
  closeGate: () => void;
}

export function useFeatureAccess(feature: FeatureKey): UseFeatureAccessReturn {
  const ent = useEntitlements();
  const [gateOpen, setGateOpen] = useState(false);
  const [gateReason, setGateReason] = useState("");

  const accessLevel = useMemo(
    () => canAccessLocally(feature, ent.plan, ent.billingType, ent.isActive, ent.isAdmin),
    [feature, ent.plan, ent.billingType, ent.isActive, ent.isAdmin],
  );

  const hasAccess = accessLevel !== "blocked" && (accessLevel === "allowed" || true);
  const isPremium = ent.isAdmin || ent.isPro;
  const isLifetimeOnly = FEATURE_MAP[feature]?.pro_monthly === "blocked";
  const isMetered = accessLevel === "metered";

  /**
   * Guard an action behind a backend permission check.
   * If allowed, calls `onAllowed()`. If denied, opens the gate modal.
   */
  const guardAction = useCallback(
    async (onAllowed: () => void) => {
      // Admins and local-allowed skip backend check
      if (ent.isAdmin) {
        onAllowed();
        return;
      }

      // Quick local check for boolean-blocked features
      if (accessLevel === "blocked") {
        setGateReason(
          isLifetimeOnly
            ? "Este recurso é exclusivo do plano PRO Vitalício."
            : "Este recurso está disponível apenas no plano PRO."
        );
        setGateOpen(true);
        return;
      }

      // For metered features on free plan, check backend
      if (accessLevel === "metered" && !ent.isPro) {
        try {
          const result = await checkFeatureAccess(feature);
          if (!result.allowed) {
            setGateReason(result.reason || "Limite atingido. Faça upgrade para continuar.");
            setGateOpen(true);
            return;
          }
        } catch {
          // On error, allow action (fail-open for UX, backend still enforces)
        }
      }

      onAllowed();
    },
    [ent.isAdmin, ent.isPro, accessLevel, feature, isLifetimeOnly],
  );

  const closeGate = useCallback(() => setGateOpen(false), []);

  return {
    hasAccess: ent.isAdmin || ent.isPro || accessLevel === "allowed",
    isPremium,
    isLifetimeOnly,
    isMetered,
    guardAction,
    gateOpen,
    gateReason,
    closeGate,
  };
}
