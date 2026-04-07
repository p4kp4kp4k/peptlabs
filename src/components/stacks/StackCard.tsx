import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { getCatConfig, getCatIcon } from "./stackUtils";
import type { FlatStack } from "@/pages/Stacks";

interface StackCardProps {
  stack: FlatStack;
}

export function StackCard({ stack }: StackCardProps) {
  const config = getCatConfig(stack.sourceCategory);
  const IconComp = getCatIcon(stack.sourceCategory);

  return (
    <Link
      to={`/peptide/${stack.sourceSlug}`}
      className="group rounded-xl border border-border/20 bg-card/60 p-4 hover:border-border/40 hover:bg-card/80 transition-all duration-200"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${config.bgColor}`}>
          <IconComp className={`h-4 w-4 ${config.color}`} />
        </div>
        <Badge
          variant="outline"
          className={`text-[10px] ${config.bgColor} ${config.color} ${config.borderColor} font-semibold px-2 py-0.5`}
        >
          {stack.sourceCategory}
        </Badge>
      </div>

      {/* Stack name */}
      <h3 className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors mb-0.5">
        {stack.nome}
      </h3>

      {/* Objetivo */}
      <p className="text-[11px] text-muted-foreground mb-3">{stack.objetivo}</p>

      {/* Peptide list */}
      <div className="space-y-1.5 mb-3">
        {stack.peptideos.map((p) => (
          <div key={p} className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${config.color.replace("text-", "bg-")}`} />
            <span className="text-[11px] font-medium text-foreground/90">{p}</span>
          </div>
        ))}
      </div>

      {/* Description */}
      {stack.descricao && (
        <p className="text-[10px] text-muted-foreground/70 leading-relaxed line-clamp-2">
          {stack.descricao}
        </p>
      )}

      {/* Source peptide */}
      <div className="mt-3 pt-2 border-t border-border/15">
        <p className="text-[9px] text-muted-foreground/50">
          Via: <span className="text-muted-foreground">{stack.sourcePeptide}</span>
        </p>
      </div>
    </Link>
  );
}
