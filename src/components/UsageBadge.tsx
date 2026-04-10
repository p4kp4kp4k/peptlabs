import { useEntitlements } from "@/hooks/useEntitlements";
import { useAuth } from "@/hooks/useAuth";
import { Gauge } from "lucide-react";

type Feature = "protocol" | "compare" | "export" | "calculator" | "stack" | "template" | "interaction";

const FEATURE_CONFIG: Record<Feature, {
  label: string;
  usageKey: keyof ReturnType<typeof useEntitlements>["usage"];
  limitKey: keyof ReturnType<typeof useEntitlements>["limits"];
}> = {
  protocol:    { label: "protocolos",   usageKey: "protocolsCreated",     limitKey: "max_protocols_month" },
  compare:     { label: "comparações",  usageKey: "comparisonsMade",      limitKey: "compare_limit" },
  export:      { label: "exportações",  usageKey: "exportsMade",          limitKey: "compare_limit" }, // uses 1 for free
  calculator:  { label: "cálculos",     usageKey: "calcsMade",            limitKey: "calc_limit" },
  stack:       { label: "stacks",       usageKey: "stacksViewed",         limitKey: "stack_limit" },
  template:    { label: "templates",    usageKey: "templatesUsed",        limitKey: "template_limit" },
  interaction: { label: "interações",   usageKey: "interactionsChecked",  limitKey: "interaction_limit" },
};

interface UsageBadgeProps {
  feature: Feature;
  className?: string;
}

export default function UsageBadge({ feature, className = "" }: UsageBadgeProps) {
  const { user } = useAuth();
  const { limits, usage, isAdmin, isLoading } = useEntitlements();

  if (!user || isAdmin || isLoading) return null;

  const config = FEATURE_CONFIG[feature];
  const limit = (limits as any)[config.limitKey] as number | undefined;

  // -1 means unlimited
  if (!limit || limit === -1) return null;

  const used = (usage as any)[config.usageKey] ?? 0;
  const remaining = Math.max(0, limit - used);
  const exhausted = remaining === 0;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold border transition-colors ${
        exhausted
          ? "bg-destructive/10 text-destructive border-destructive/20"
          : "bg-primary/8 text-primary border-primary/15"
      } ${className}`}
    >
      <Gauge className="h-3 w-3" />
      <span>
        {remaining}/{limit} {config.label} restantes
      </span>
    </div>
  );
}
