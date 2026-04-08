import { useParams, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { useStacks } from "@/hooks/useStacks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getCatConfig, getCatIcon } from "@/components/stacks/stackUtils";
import type { Stack } from "@/types";
import {
  ArrowLeft, Syringe, Clock, CheckCircle2, AlertTriangle,
  Timer, Layers, GitMerge, Zap, Calendar, Target, ChevronRight
} from "lucide-react";

/* ─── Interaction between peptides in the stack ─── */
interface PeptideInteraction {
  from: string;
  to: string;
  status: string;
  descricao: string;
}

function StatusBadge({ status }: { status: string }) {
  const u = status.toUpperCase();
  if (u.includes("SINÉR") || u.includes("SINERG")) return <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold px-2">SINÉRGICO</Badge>;
  if (u.includes("COMPATÍV") || u.includes("COMPAT")) return <Badge className="text-[10px] bg-orange-500/15 text-orange-400 border border-orange-500/25 font-bold px-2">COMPATÍVEL</Badge>;
  if (u.includes("COMPLEMENTAR")) return <Badge className="text-[10px] bg-sky-500/15 text-sky-400 border border-sky-500/25 font-bold px-2">COMPLEMENTAR</Badge>;
  if (u.includes("MONITOR") || u.includes("CAUTELA")) return <Badge className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/25 font-bold px-2">MONITORAR</Badge>;
  if (u.includes("EVITAR")) return <Badge className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/25 font-bold px-2">EVITAR</Badge>;
  return <Badge variant="outline" className="text-[10px] font-bold px-2">{status}</Badge>;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <ScrollReveal>
      <div className="rounded-xl border border-border bg-card card-line overflow-hidden">
        {children}
      </div>
    </ScrollReveal>
  );
}

function SectionHeader({ icon: Icon, title, iconColor = "text-primary" }: { icon: React.ElementType; title: string; iconColor?: string }) {
  return (
    <div className="flex items-center gap-2 p-4 sm:px-5 sm:py-3.5 border-b border-border/30">
      <div className={`flex h-6 w-6 items-center justify-center rounded-md bg-primary/8 ${iconColor}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
    </div>
  );
}

export default function StackDetail() {
  const { stackId } = useParams<{ stackId: string }>();
  const navigate = useNavigate();
  const { data: stacks, isLoading: stacksLoading } = useStacks();

  const stack = useMemo(() => stacks?.find(s => s.id === stackId) ?? null, [stacks, stackId]);

  // Fetch peptide data to find interactions between stack peptides
  const peptideNames = useMemo(() => stack?.peptides.map(p => p.name) ?? [], [stack]);

  const { data: peptideRows } = useQuery({
    queryKey: ["stack-peptides", peptideNames],
    queryFn: async () => {
      if (!peptideNames.length) return [];
      const { data, error } = await supabase
        .from("peptides")
        .select("name, slug, interactions, category, evidence_level, half_life, benefits")
        .in("name", peptideNames);
      if (error) throw error;
      return data ?? [];
    },
    enabled: peptideNames.length > 0,
  });

  // Extract cross-interactions between peptides in this stack
  const crossInteractions = useMemo<PeptideInteraction[]>(() => {
    if (!peptideRows || peptideRows.length < 2) return [];
    const namesSet = new Set(peptideNames.map(n => n.toLowerCase()));
    const results: PeptideInteraction[] = [];
    const seen = new Set<string>();

    for (const pep of peptideRows) {
      const interactions = pep.interactions;
      if (!interactions) continue;

      const items: Array<{ nome: string; status: string; descricao: string }> = [];
      if (Array.isArray(interactions)) {
        for (const item of interactions as any[]) {
          items.push({ nome: item.peptideo || "", status: item.tipo || "", descricao: item.descricao || "" });
        }
      } else {
        const old = interactions as any;
        if (old.peptideos) items.push(...old.peptideos);
      }

      for (const item of items) {
        if (namesSet.has(item.nome.toLowerCase()) && item.nome.toLowerCase() !== pep.name.toLowerCase()) {
          const key = [pep.name, item.nome].sort().join("|");
          if (!seen.has(key)) {
            seen.add(key);
            results.push({ from: pep.name, to: item.nome, status: item.status, descricao: item.descricao });
          }
        }
      }
    }
    return results;
  }, [peptideRows, peptideNames]);

  if (stacksLoading) {
    return (
      <div className="p-4 sm:p-5 space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!stack) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center flex-col gap-3">
        <p className="text-sm text-muted-foreground">Stack não encontrado.</p>
        <button onClick={() => navigate("/app/stacks")} className="text-xs text-primary hover:underline">Voltar aos Stacks</button>
      </div>
    );
  }

  const config = getCatConfig(stack.category);
  const IconComp = getCatIcon(stack.category);

  // Build a simple timeline from duration
  const timelinePhases = buildTimeline(stack);

  return (
    <div className="p-3 sm:p-5 max-w-4xl mx-auto space-y-4">
      {/* Back */}
      <button onClick={() => navigate("/app/stacks")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" /> Stacks
      </button>

      {/* ── HERO ── */}
      <ScrollReveal>
        <div className="relative rounded-xl overflow-hidden border border-border card-line">
          <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-background" />
          <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 85% 15%, hsl(var(--primary) / 0.08) 0%, transparent 50%)` }} />
          <div className="absolute inset-0 flex items-center justify-end pr-6 sm:pr-10 pointer-events-none select-none overflow-hidden">
            <span className="text-[3rem] sm:text-[4.5rem] font-black text-white/[0.02] leading-none tracking-tighter whitespace-nowrap">{stack.name}</span>
          </div>
          <div className="relative z-10 px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex items-start gap-3 mb-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bgColor}`}>
                <IconComp className={`h-6 w-6 ${config.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <Badge className={`text-[10px] ${config.bgColor} ${config.color} ${config.borderColor} font-bold px-2`}>{stack.category}</Badge>
                  {stack.duration && (
                    <Badge variant="outline" className="text-[10px] border-border text-muted-foreground gap-1">
                      <Clock className="h-2.5 w-2.5" /> {stack.duration}
                    </Badge>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{stack.name}</h1>
                {stack.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{stack.subtitle}</p>}
              </div>
            </div>
            {stack.description && (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">{stack.description}</p>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* ── PROTOCOL ── */}
      <SectionCard>
        <SectionHeader icon={Syringe} title="Protocolo Completo" />
        <div className="p-4 sm:p-5 space-y-3">
          {stack.peptides.map((pep, i) => {
            const pepData = peptideRows?.find(r => r.name === pep.name);
            return (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-lg bg-secondary/30 border border-border/15 hover:bg-secondary/50 transition-colors">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[11px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[13px] font-bold text-foreground">{pep.name}</span>
                    {pepData && (
                      <button
                        onClick={() => navigate(`/peptide/${pepData.slug}`)}
                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                      >
                        Ver detalhes <ChevronRight className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="text-[11px] text-primary font-semibold">{pep.dose}</span>
                    {pepData?.half_life && (
                      <span className="text-[10px] text-muted-foreground">Meia-vida: ~{pepData.half_life}</span>
                    )}
                    {pepData?.category && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0">{pepData.category}</Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Timing */}
          {stack.timing && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/15 mt-2">
              <Timer className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-[11px] text-foreground leading-relaxed"><span className="font-semibold">Timing:</span> {stack.timing}</p>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── TIMELINE ── */}
      {timelinePhases.length > 0 && (
        <SectionCard>
          <SectionHeader icon={Calendar} title="Timeline de Uso" />
          <div className="p-4 sm:p-5">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
              <div className="space-y-4">
                {timelinePhases.map((phase, i) => (
                  <div key={i} className="flex items-start gap-4 relative">
                    <div className="relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-card border-2 border-primary/40">
                      <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-secondary/30 border border-border/15">
                      <p className="text-[11px] font-bold text-foreground mb-0.5">{phase.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{phase.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── INTERACTIONS BETWEEN PEPTIDES ── */}
      {crossInteractions.length > 0 && (
        <SectionCard>
          <SectionHeader icon={GitMerge} title="Interações entre os Peptídeos" />
          <div className="p-4 sm:p-5 space-y-2">
            {crossInteractions.map((inter, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/15">
                <GitMerge className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-foreground">{inter.from}</span>
                    <span className="text-[10px] text-muted-foreground">↔</span>
                    <span className="text-[11px] font-bold text-foreground">{inter.to}</span>
                    <StatusBadge status={inter.status} />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{inter.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* If no cross-interactions found, show synergy note */}
      {crossInteractions.length === 0 && peptideRows && peptideRows.length >= 2 && (
        <SectionCard>
          <SectionHeader icon={GitMerge} title="Interações entre os Peptídeos" />
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Todos os peptídeos deste stack foram selecionados por sua sinergia. Nenhuma interação adversa conhecida entre eles.
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── SYNERGY MECHANISM ── */}
      <SectionCard>
        <SectionHeader icon={Zap} title="Mecanismo Sinérgico" />
        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {stack.peptides.map((pep, i) => {
              const pepData = peptideRows?.find(r => r.name === pep.name);
              const topBenefits = (pepData?.benefits as string[] | null)?.slice(0, 3) ?? [];
              return (
                <div key={i} className="p-3 rounded-lg bg-secondary/30 border border-border/15">
                  <p className="text-[11px] font-bold text-foreground mb-2 flex items-center gap-1.5">
                    <Target className="h-3 w-3 text-primary" /> {pep.name}
                  </p>
                  {topBenefits.length > 0 ? (
                    <ul className="space-y-1">
                      {topBenefits.map((b, j) => (
                        <li key={j} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span> {b}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[10px] text-muted-foreground italic">Dados de benefícios não disponíveis.</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </SectionCard>

      {/* ── BENEFITS ── */}
      {stack.benefits && stack.benefits.length > 0 && (
        <SectionCard>
          <SectionHeader icon={CheckCircle2} title="Benefícios Esperados" iconColor="text-emerald-400" />
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {stack.benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-foreground/90 leading-relaxed">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── WARNINGS ── */}
      {stack.warnings && stack.warnings.length > 0 && (
        <SectionCard>
          <SectionHeader icon={AlertTriangle} title="Avisos e Monitoramento" iconColor="text-amber-400" />
          <div className="p-4 sm:p-5 space-y-2">
            {stack.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <span className="text-[11px] text-muted-foreground leading-relaxed">{w}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* ─── Build timeline from stack data ─── */
function buildTimeline(stack: Stack): Array<{ label: string; description: string }> {
  const phases: Array<{ label: string; description: string }> = [];

  // Phase 1: Preparation
  phases.push({
    label: "Preparação",
    description: `Adquira os peptídeos necessários: ${stack.peptides.map(p => p.name).join(", ")}. Certifique-se da qualidade e armazenamento adequado.`,
  });

  // Phase 2: Start protocol
  const dosageInfo = stack.peptides.map(p => `${p.name} (${p.dose})`).join(", ");
  phases.push({
    label: "Início do Protocolo",
    description: `Inicie com as dosagens recomendadas: ${dosageInfo}. ${stack.timing || "Siga o timing indicado."}`,
  });

  // Phase 3: Adaptation (week 1-2)
  phases.push({
    label: "Adaptação (Semanas 1-2)",
    description: "Monitore a resposta individual. Ajuste dosagens se necessário. Observe possíveis efeitos colaterais e registre resultados.",
  });

  // Phase 4: Main cycle
  const dur = stack.duration || "6-8 semanas";
  phases.push({
    label: `Ciclo Principal (${dur})`,
    description: "Mantenha o protocolo de forma consistente. Os efeitos sinérgicos começam a se manifestar de forma mais evidente a partir da 3ª semana.",
  });

  // Phase 5: Evaluation
  phases.push({
    label: "Avaliação e Ajuste",
    description: "Avalie resultados ao final do ciclo. Considere exames de acompanhamento e ajuste o protocolo para o próximo ciclo se necessário.",
  });

  return phases;
}
