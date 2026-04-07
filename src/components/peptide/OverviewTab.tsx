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
    <div className={`rounded-xl border border-border/25 bg-card/80 p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, children, iconColor = "text-amber-400", iconBg = "bg-amber-400/10" }: { icon: React.ElementType; children: React.ReactNode; iconColor?: string; iconBg?: string }) {
  return (
    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2.5">
      <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      {children}
    </h3>
  );
}

// Handle both old format {period, description} and new format {periodo, efeito}
interface TimelineItem {
  period?: string;
  periodo?: string;
  description?: string;
  efeito?: string;
}

export default function OverviewTab({ name, mechanism, mechanism_points, benefits, side_effects, timeline }: OverviewTabProps) {
  const timelineData = timeline as unknown as TimelineItem[] | null;

  return (
    <div className="space-y-4">
      {/* O que é + Como funciona */}
      {mechanism && (
        <SectionCard>
          <SectionTitle icon={Zap} iconColor="text-primary" iconBg="bg-primary/10">O que é {name}</SectionTitle>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3">{mechanism}</p>
          {mechanism_points && mechanism_points.length > 0 && (
            <div className="space-y-1.5 mt-3 pt-3 border-t border-border/20">
              <p className="text-[11px] font-bold text-foreground/80 uppercase tracking-wider mb-2">Mecanismos de Ação</p>
              {mechanism_points.map((point, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-secondary/40 border border-border/10">
                  <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[9px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-relaxed">{point}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Benefícios Comprovados */}
      {benefits && benefits.length > 0 && (
        <SectionCard>
          <SectionTitle icon={CheckCircle2} iconColor="text-emerald-400" iconBg="bg-emerald-400/10">Benefícios Comprovados</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {benefits.map((b: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/50 border border-border/15">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <span className="text-xs text-foreground/90 leading-relaxed">{b}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Efeitos Colaterais */}
      {side_effects && (
        <SectionCard>
          <SectionTitle icon={AlertTriangle} iconColor="text-amber-400" iconBg="bg-amber-400/10">Efeitos Colaterais e Precauções</SectionTitle>
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{side_effects}</p>
          </div>
        </SectionCard>
      )}

      {/* Linha do Tempo */}
      {timelineData && timelineData.length > 0 && (
        <SectionCard>
          <SectionTitle icon={Clock} iconColor="text-sky-400" iconBg="bg-sky-400/10">Linha do Tempo de Resultados</SectionTitle>
          <div className="space-y-0">
            {timelineData.map((t, i) => {
              const period = t.periodo || t.period || '';
              const desc = t.efeito || t.description || '';
              return (
                <div key={i} className="flex gap-4 items-stretch">
                  <div className="flex flex-col items-center w-4">
                    <div className="h-3.5 w-3.5 rounded-full bg-primary shrink-0 mt-1 ring-2 ring-primary/20" />
                    {i < timelineData.length - 1 && <div className="w-px flex-1 bg-border/40" />}
                  </div>
                  <div className="pb-5 flex-1">
                    <p className="text-xs font-bold mb-0.5 text-primary">{period}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
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
