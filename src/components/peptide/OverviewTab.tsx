import { Card, CardContent } from "@/components/ui/card";
import { Zap, CheckCircle2, Clock } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface OverviewTabProps {
  name: string;
  mechanism?: string | null;
  mechanism_points?: string[] | null;
  benefits?: string[] | null;
  side_effects?: string | null;
  timeline?: Json | null;
}

export default function OverviewTab({ name, mechanism, mechanism_points, benefits, side_effects, timeline }: OverviewTabProps) {
  const timelineData = timeline as unknown as Array<{ period: string; description: string }> | null;

  return (
    <div className="space-y-4">
      {/* O que é */}
      {mechanism && (
        <Card className="border-border/30 bg-card/90">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Zap className="h-4 w-4 text-amber-400" />
              O que é {name}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{mechanism}</p>
          </CardContent>
        </Card>
      )}

      {/* Benefícios Comprovados - Grid 2 colunas */}
      {benefits && benefits.length > 0 && (
        <Card className="border-border/30 bg-card/90">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <CheckCircle2 className="h-4 w-4 text-amber-400" />
              Benefícios Comprovados
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {benefits.map((b: string, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span className="text-xs text-foreground leading-relaxed">{b}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Linha do Tempo de Resultados */}
      {timelineData && timelineData.length > 0 && (
        <Card className="border-border/30 bg-card/90">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Clock className="h-4 w-4 text-amber-400" />
              Linha do Tempo de Resultados
            </h3>
            <div className="space-y-4">
              {timelineData.map((t, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-primary shrink-0 mt-0.5" />
                    {i < timelineData.length - 1 && <div className="w-px flex-1 bg-border/40 min-h-[24px]" />}
                  </div>
                  <div className="pb-1">
                    <p className={`text-xs font-bold mb-0.5 ${
                      t.period.toLowerCase().includes('semana') ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {t.period}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{t.description}</p>
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
