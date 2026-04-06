import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitMerge, Layers } from "lucide-react";
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
  if (upper.includes("SINÉR") || upper.includes("SINERG") || upper.includes("COMPATÍV")) {
    return <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold">{status}</Badge>;
  }
  if (upper.includes("MONITOR")) {
    return <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold">{status}</Badge>;
  }
  if (upper.includes("EVITAR")) {
    return <Badge className="text-[10px] bg-red-500/20 text-red-400 border-red-500/30 font-bold">{status}</Badge>;
  }
  return <Badge variant="outline" className="text-[10px] font-bold">{status}</Badge>;
}

export default function SynergyTab({ interactions, stacks }: SynergyTabProps) {
  const interactionsData = interactions as unknown as InteractionsData | null;
  const stacksData = stacks as unknown as Stack[] | null;

  const allInteractions = [
    ...(interactionsData?.peptideos || []),
    ...(interactionsData?.outras_substancias || []),
  ];

  if (allInteractions.length === 0 && (!stacksData || stacksData.length === 0)) {
    return (
      <Card className="border-border/30 bg-card/90">
        <CardContent className="p-5">
          <p className="text-xs text-muted-foreground italic">Informações de sinergia não disponíveis para este peptídeo.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Interações - Table format like PDF */}
      {allInteractions.length > 0 && (
        <Card className="border-border/30 bg-card/90">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <GitMerge className="h-4 w-4 text-amber-400" />
              Interações com Outros Peptídeos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2.5 pr-4 text-muted-foreground font-medium">Peptídeo</th>
                    <th className="text-left py-2.5 pr-4 text-muted-foreground font-medium">Status</th>
                    <th className="text-left py-2.5 text-muted-foreground font-medium">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {allInteractions.map((item, i) => (
                    <tr key={i} className="border-b border-border/20 last:border-0 align-top">
                      <td className="py-3 pr-4 text-foreground font-semibold whitespace-nowrap">{item.nome}</td>
                      <td className="py-3 pr-4"><StatusBadge status={item.status} /></td>
                      <td className="py-3 text-muted-foreground leading-relaxed">{item.descricao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stacks Recomendados */}
      {stacksData && stacksData.length > 0 && (
        <Card className="border-border/30 bg-card/90">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Layers className="h-4 w-4 text-amber-400" />
              Stacks Recomendados
            </h3>
            <div className="space-y-4">
              {stacksData.map((stack, i) => (
                <div key={i} className="p-4 rounded-lg bg-secondary/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-foreground">{stack.nome}</span>
                    <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">{stack.objetivo}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {stack.peptideos.map((p) => (
                      <Badge key={p} className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{p}</Badge>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{stack.descricao}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
