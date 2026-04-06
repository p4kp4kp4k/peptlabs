import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface OverviewTabProps {
  mechanism?: string | null;
  mechanism_points?: string[] | null;
  benefits?: string[] | null;
  side_effects?: string | null;
  timeline?: Json | null;
}

export default function OverviewTab({ mechanism, mechanism_points, benefits, side_effects, timeline }: OverviewTabProps) {
  const timelineData = timeline as Array<{ period: string; description: string }> | null;

  return (
    <div className="space-y-4">
      {/* Mechanism */}
      {(mechanism || (mechanism_points && mechanism_points.length > 0)) && (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Mecanismo de Ação
            </h3>
            {mechanism && <p className="text-xs text-muted-foreground leading-relaxed mb-3">{mechanism}</p>}
            {mechanism_points && mechanism_points.length > 0 && (
              <div className="space-y-2">
                {mechanism_points.map((point, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span className="text-xs text-muted-foreground">{point}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Benefits */}
      {benefits && benefits.length > 0 && (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Benefícios Comprovados
            </h3>
            <div className="space-y-2">
              {benefits.map((b: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span className="text-xs text-foreground">{b}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Side Effects */}
      {side_effects && (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <AlertTriangle className="inline h-3.5 w-3.5 text-amber-400 mr-1.5" />
              Efeitos Colaterais
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{side_effects}</p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {timelineData && timelineData.length > 0 && (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <TrendingUp className="inline h-3.5 w-3.5 text-primary mr-1.5" />
              Linha do Tempo de Resultados
            </h3>
            <div className="space-y-3">
              {timelineData.map((t, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-1" />
                    {i < timelineData.length - 1 && <div className="w-px flex-1 bg-border/60 min-h-[20px]" />}
                  </div>
                  <div className="pb-2">
                    <p className="text-xs font-semibold text-foreground">{t.period}</p>
                    <p className="text-[11px] text-muted-foreground">{t.description}</p>
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
