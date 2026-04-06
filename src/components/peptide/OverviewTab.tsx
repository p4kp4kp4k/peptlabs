import { Zap, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface OverviewTabProps {
  name: string;
  mechanism?: string | null;
  mechanism_points?: string[] | null;
  benefits?: string[] | null;
  side_effects?: string | null;
  timeline?: Json | null;
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border/25 bg-card/80 p-3.5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, children, iconColor = "text-amber-400" }: { icon: React.ElementType; children: React.ReactNode; iconColor?: string }) {
  return (
    <h3 className="text-xs font-bold text-foreground mb-2.5 flex items-center gap-2">
      <div className={`flex h-5 w-5 items-center justify-center rounded-md bg-amber-400/10 ${iconColor}`}>
        <Icon className="h-3 w-3" />
      </div>
      {children}
    </h3>
  );
}

export default function OverviewTab({ name, mechanism, mechanism_points, benefits, side_effects, timeline }: OverviewTabProps) {
  const timelineData = timeline as unknown as Array<{ period: string; description: string }> | null;

  return (
    <div className="space-y-3">
      {/* O que é */}
      {mechanism && (
        <SectionCard>
          <SectionTitle icon={Zap}>O que é {name}</SectionTitle>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{mechanism}</p>
        </SectionCard>
      )}

      {/* Benefícios Comprovados */}
      {benefits && benefits.length > 0 && (
        <SectionCard>
          <SectionTitle icon={CheckCircle2}>Benefícios Comprovados</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {benefits.map((b: string, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/50 border border-border/15">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[9px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <span className="text-[11px] text-foreground/90 leading-relaxed">{b}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Efeitos Colaterais */}
      {side_effects && (
        <SectionCard>
          <SectionTitle icon={AlertTriangle} iconColor="text-amber-400">Efeitos Colaterais</SectionTitle>
          <p className="text-xs text-muted-foreground leading-[1.8]">{side_effects}</p>
        </SectionCard>
      )}

      {/* Linha do Tempo */}
      {timelineData && timelineData.length > 0 && (
        <SectionCard>
          <SectionTitle icon={Clock}>Linha do Tempo de Resultados</SectionTitle>
          <div className="space-y-0">
            {timelineData.map((t, i) => {
              const isWeek = t.period.toLowerCase().includes('semana');
              return (
                <div key={i} className="flex gap-4 items-stretch">
                  {/* Timeline track */}
                  <div className="flex flex-col items-center w-4">
                    <div className="h-3 w-3 rounded-full bg-primary shrink-0 mt-1 ring-2 ring-primary/20" />
                    {i < timelineData.length - 1 && <div className="w-px flex-1 bg-border/40" />}
                  </div>
                  {/* Content */}
                  <div className="pb-5 flex-1">
                    <p className={`text-xs font-bold mb-1 ${isWeek ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {t.period}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{t.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
