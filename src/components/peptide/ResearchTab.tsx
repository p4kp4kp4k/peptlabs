import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Beaker } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface Reference {
  titulo: string;
  fonte: string;
  ano: number;
}

interface ResearchTabProps {
  mechanism?: string | null;
  mechanism_points?: string[] | null;
  evidence_level?: string | null;
  scientific_references?: Json | null;
}

export default function ResearchTab({ mechanism, mechanism_points, evidence_level, scientific_references }: ResearchTabProps) {
  const refs = scientific_references as unknown as Reference[] | null;

  return (
    <div className="space-y-4">
      {/* Mecanismo de Ação */}
      {(mechanism || (mechanism_points && mechanism_points.length > 0)) && (
        <Card className="border-border/30 bg-card/90">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Beaker className="h-4 w-4 text-amber-400" />
              Mecanismo de Ação
            </h3>
            {mechanism && (
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">{mechanism}</p>
            )}
            {mechanism_points && mechanism_points.length > 0 && (
              <div className="space-y-3">
                {mechanism_points.map((point, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="text-xs text-muted-foreground leading-relaxed">{point}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Referências Científicas */}
      {refs && refs.length > 0 && (
        <Card className="border-border/30 bg-card/90">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <BookOpen className="h-4 w-4 text-amber-400" />
              Referências Científicas
            </h3>
            <div className="space-y-3">
              {refs.map((ref, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground font-semibold leading-relaxed">{ref.titulo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-muted-foreground">{ref.fonte}</span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <Badge variant="outline" className="text-[10px] border-border/50">{ref.ano}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!mechanism && !mechanism_points?.length && !refs?.length && (
        <Card className="border-border/30 bg-card/90">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground italic">Informações de pesquisa não disponíveis para este peptídeo.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
