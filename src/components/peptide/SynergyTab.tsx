import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitMerge, Layers, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface Interaction {
  nome: string;
  status: string;
  descricao: string;
}

interface InteractionsData {
  peptideos?: Interaction[];
  outras_substancias?: Interaction[];
}

interface Stack {
  nome: string;
  descricao: string;
  peptideos: string[];
  objetivo: string;
}

interface SynergyTabProps {
  interactions?: Json | null;
  stacks?: Json | null;
}

function StatusBadge({ status }: { status: string }) {
  const upper = status.toUpperCase();
  if (upper === "SINÉRGICO" || upper === "SINERGICO" || upper === "COMPATÍVEL") {
    return <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{status}</Badge>;
  }
  if (upper === "MONITORAR") {
    return <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30">{status}</Badge>;
  }
  if (upper === "EVITAR") {
    return <Badge className="text-[10px] bg-red-500/20 text-red-400 border-red-500/30">{status}</Badge>;
  }
  return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
}

function StatusIcon({ status }: { status: string }) {
  const upper = status.toUpperCase();
  if (upper === "SINÉRGICO" || upper === "SINERGICO" || upper === "COMPATÍVEL") {
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
  }
  if (upper === "MONITORAR") {
    return <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />;
  }
  if (upper === "EVITAR") {
    return <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />;
  }
  return null;
}

export default function SynergyTab({ interactions, stacks }: SynergyTabProps) {
  const interactionsData = interactions as InteractionsData | null;
  const stacksData = stacks as Stack[] | null;

  const hasInteractions = interactionsData &&
    ((interactionsData.peptideos && interactionsData.peptideos.length > 0) ||
     (interactionsData.outras_substancias && interactionsData.outras_substancias.length > 0));

  if (!hasInteractions && (!stacksData || stacksData.length === 0)) {
    return (
      <Card className="border-border/40 bg-card/80">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground italic">Informações de sinergia não disponíveis para este peptídeo.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Peptide Interactions */}
      {interactionsData?.peptideos && interactionsData.peptideos.length > 0 && (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <GitMerge className="inline h-3.5 w-3.5 text-primary mr-1.5" />
              Interações com Outros Peptídeos
            </h3>
            <div className="space-y-3">
              {interactionsData.peptideos.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/30">
                  <StatusIcon status={item.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground">{item.nome}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{item.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Other Substances */}
      {interactionsData?.outras_substancias && interactionsData.outras_substancias.length > 0 && (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Interações com Outras Substâncias
            </h3>
            <div className="space-y-3">
              {interactionsData.outras_substancias.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-secondary/30">
                  <StatusIcon status={item.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground">{item.nome}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{item.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stacks */}
      {stacksData && stacksData.length > 0 && (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Layers className="inline h-3.5 w-3.5 text-primary mr-1.5" />
              Stacks Recomendados
            </h3>
            <div className="space-y-3">
              {stacksData.map((stack, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30 border border-border/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground">{stack.nome}</span>
                    <Badge variant="outline" className="text-[10px]">{stack.objetivo}</Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2">{stack.descricao}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {stack.peptideos.map((p) => (
                      <Badge key={p} className="text-[10px] bg-primary/10 text-primary border-primary/30">{p}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
