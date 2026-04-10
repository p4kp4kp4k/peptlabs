import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProBadgeProps {
  className?: string;
}

export default function ProBadge({ className }: ProBadgeProps) {
  return (
    <Badge
      className={cn(
        "relative overflow-hidden text-[9px] gap-1 bg-primary/15 text-primary border border-primary/25 font-bold px-2 py-0.5",
        "shadow-[0_0_8px_-2px_hsl(var(--primary)/0.4)]",
        className
      )}
    >
      {/* shimmer overlay */}
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,hsl(var(--primary)/0.15)_50%,transparent_75%)] bg-[length:200%_100%] animate-shimmer" />
      <Crown className="h-2.5 w-2.5 relative z-[1]" />
      <span className="relative z-[1]">PRO</span>
    </Badge>
  );
}
