/**
 * PeptidePreviewColumn
 * ====================
 * Renders a full peptide page preview using real section components.
 * Used in the side-by-side correction review page.
 * Highlights changed sections when `changedFields` is provided.
 */
import { Badge } from "@/components/ui/badge";
import {
  Tag, Activity, Clock, RotateCcw, Zap, CheckCircle2, AlertTriangle,
  Syringe, ListChecks, Beaker, BookOpen, GitMerge, Layers, TrendingUp,
  ExternalLink, Dna
} from "lucide-react";
import SequenceSection from "@/components/peptide/SequenceSection";
import type { Json } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";
import { translateMedicalText } from "./medicalTranslations";

/* ── Normalize helpers (same as PeptideDetail) ── */
interface TimelineItem { period?: string; periodo?: string; description?: string; efeito?: string; }
interface RawDosageRow { indicacao?: string; objetivo?: string; dose: string; frequencia: string; duracao: string; }
interface NormalizedDosageRow { indicacao: string; dose: string; frequencia: string; duracao: string; }
interface RawPhaseRow { fase: string; dose?: string; notas?: string; unidades?: string; duracao?: string; descricao?: string; }
interface NormalizedPhaseRow { fase: string; dose: string; detalhes: string; }
interface Reference { titulo?: string; title?: string; fonte?: string; source?: string; journal?: string; ano?: number; year?: number; pmid?: string; authors?: string; }
interface OldInteraction { nome: string; status: string; descricao: string; }
interface OldInteractionsData { peptideos?: OldInteraction[]; outras_substancias?: OldInteraction[]; }
interface NewInteraction { tipo: string; peptideo: string; descricao: string; }
interface Stack { nome: string; descricao?: string; peptideos: string[]; objetivo: string; }

function normalizeDosage(rows: RawDosageRow[]): NormalizedDosageRow[] {
  return rows.map(r => ({ indicacao: r.indicacao || r.objetivo || "—", dose: r.dose, frequencia: r.frequencia, duracao: r.duracao }));
}
function normalizePhases(rows: RawPhaseRow[]): NormalizedPhaseRow[] {
  return rows.map(r => {
    if (r.descricao) {
      const m = r.descricao.match(/^([\d.,\-–]+\s*(?:mcg|mg|μg|UI|IU|mL|g|%)[^\s]*(?:\s*(?:\/(?:dia|semana|kg)|\d*x\/(?:dia|semana)))?)/i);
      const dose = m ? m[1] : r.duracao || "—";
      const det = m ? r.descricao.slice(m[0].length).trim() : r.descricao;
      return { fase: r.fase, dose, detalhes: det || r.duracao || "—" };
    }
    return { fase: r.fase, dose: r.dose || "—", detalhes: r.unidades || r.notas || "—" };
  });
}
function normalizeInteractions(data: Json | null | undefined): Array<{ nome: string; status: string; descricao: string }> {
  if (!data) return [];
  if (Array.isArray(data)) return (data as unknown as NewInteraction[]).map(item => ({ nome: item.peptideo || '', status: item.tipo || '', descricao: item.descricao || '' }));
  const old = data as unknown as OldInteractionsData;
  return [...(old.peptideos || []), ...(old.outras_substancias || [])];
}
function computeScore(p: any) {
  let score = 50;
  if (p.evidence_level) { const e = p.evidence_level.toLowerCase(); if (e.includes("alto") || e.includes("high")) score += 20; else if (e.includes("moderado") || e.includes("moderate") || e.includes("médio")) score += 10; }
  if (p.benefits?.length > 4) score += 10;
  if (p.mechanism_points?.length > 3) score += 5;
  if (p.scientific_references && (p.scientific_references as any[]).length > 2) score += 10;
  if (p.dosage_table && (p.dosage_table as any[]).length > 0) score += 5;
  return Math.min(score, 100);
}

function StatusBadge({ status }: { status: string }) {
  const u = status.toUpperCase();
  if (u.includes("SINÉR") || u.includes("SINERG")) return <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold px-2">SINÉRGICO</Badge>;
  if (u.includes("COMPLEMENTAR")) return <Badge className="text-[10px] bg-sky-500/15 text-sky-400 border border-sky-500/25 font-bold px-2">COMPLEMENTAR</Badge>;
  if (u.includes("MONITOR") || u.includes("CAUTELA")) return <Badge className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/25 font-bold px-2">MONITORAR</Badge>;
  if (u.includes("EVITAR")) return <Badge className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/25 font-bold px-2">EVITAR</Badge>;
  return <Badge variant="outline" className="text-[10px] font-bold px-2">{status}</Badge>;
}

/* ── Change type highlight styles ── */
export type ChangeHighlightType = "added" | "replaced" | "merged" | "removed" | "conflict";

const highlightStyles: Record<ChangeHighlightType, string> = {
  added: "ring-2 ring-emerald-400/40 bg-emerald-400/5",
  replaced: "ring-2 ring-amber-400/40 bg-amber-400/5",
  merged: "ring-2 ring-blue-400/40 bg-blue-400/5",
  removed: "ring-2 ring-red-400/40 bg-red-400/5",
  conflict: "ring-2 ring-orange-400/40 bg-orange-400/5",
};

const changeBadgeLabels: Record<ChangeHighlightType, { label: string; className: string }> = {
  added: { label: "Novo", className: "bg-emerald-400/15 text-emerald-400 border-emerald-400/30" },
  replaced: { label: "Alterado", className: "bg-amber-400/15 text-amber-400 border-amber-400/30" },
  merged: { label: "Mesclado", className: "bg-blue-400/15 text-blue-400 border-blue-400/30" },
  removed: { label: "Removido", className: "bg-red-400/15 text-red-400 border-red-400/30" },
  conflict: { label: "Conflito", className: "bg-orange-400/15 text-orange-400 border-orange-400/30" },
};

/* ── Section wrapper ── */
function PreviewSection({ 
  id, icon: Icon, title, children, highlight, showHighlights, onlyChanges, iconColor = "text-primary"
}: {
  id: string; icon: React.ElementType; title: string; children: React.ReactNode;
  highlight?: ChangeHighlightType; showHighlights: boolean; onlyChanges: boolean; iconColor?: string;
}) {
  if (onlyChanges && !highlight) return null;

  return (
    <section
      id={id}
      data-preview-section={id}
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden transition-all duration-300",
        showHighlights && highlight && highlightStyles[highlight]
      )}
    >
      <div className="p-4 sm:px-5 sm:py-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <div className={cn("flex h-6 w-6 items-center justify-center rounded-md bg-primary/8", iconColor)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            {title}
          </h3>
          {showHighlights && highlight && (
            <Badge className={cn("text-[9px] font-bold px-2 border", changeBadgeLabels[highlight].className)}>
              {changeBadgeLabels[highlight].label}
            </Badge>
          )}
        </div>
      </div>
      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        {children}
      </div>
    </section>
  );
}

/* ── Props ── */
export interface ChangedField {
  field: string;
  sectionId: string;
  type: ChangeHighlightType;
}

interface PeptidePreviewColumnProps {
  peptide: Record<string, any>;
  changedFields?: ChangedField[];
  showHighlights: boolean;
  onlyChanges: boolean;
  label?: string;
}

export default function PeptidePreviewColumn({
  peptide: p, changedFields = [], showHighlights, onlyChanges, label
}: PeptidePreviewColumnProps) {
  const timelineData = p.timeline as unknown as TimelineItem[] | null;
  const rawDosage = p.dosage_table as unknown as RawDosageRow[] | null;
  const rawPhases = p.protocol_phases as unknown as RawPhaseRow[] | null;
  const dosageRows = rawDosage ? normalizeDosage(rawDosage) : null;
  const phases = rawPhases ? normalizePhases(rawPhases) : null;
  const refs = p.scientific_references as unknown as Reference[] | null;
  const allInteractions = normalizeInteractions(p.interactions);
  const stacksData = p.stacks as unknown as Stack[] | null;
  const score = computeScore(p);

  const getHighlight = (sectionId: string) => changedFields.find(c => c.sectionId === sectionId)?.type;

  const quickFacts = [
    { icon: Tag, label: "Classificação", value: p.classification || "—" },
    { icon: Activity, label: "Evidência", value: p.evidence_level || "—", highlight: true },
    { icon: Clock, label: "Meia-Vida", value: p.half_life ? `~${p.half_life}` : "—" },
    { icon: RotateCcw, label: "Reconstituição", value: p.reconstitution || "—" },
  ];

  return (
    <div className="min-w-0 space-y-3">
      {/* Column label */}
      {label ? (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pb-2 mb-1">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        </div>
      ) : null}

      {/* Hero mini */}
      {(!onlyChanges || getHighlight("hero")) && (
        <div className={cn(
          "rounded-xl border border-border overflow-hidden relative",
          showHighlights && getHighlight("hero") && highlightStyles[getHighlight("hero")!]
        )}>
          <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-background" />
          <div className="relative z-10 px-4 py-3">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <Badge className="bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-md">{p.category}</Badge>
              {p.classification && <Badge variant="outline" className="text-[9px] border-border text-muted-foreground bg-secondary/50">{p.classification}</Badge>}
            </div>
            <h2 className="text-base font-black text-foreground tracking-tight">{p.name}</h2>
            {p.description && <p className="text-[11px] text-muted-foreground leading-relaxed mt-1 line-clamp-2">{p.description}</p>}
          </div>
        </div>
      )}

      {/* Quick facts */}
      {(!onlyChanges) && (
        <div className="grid grid-cols-2 gap-1.5">
          {quickFacts.map(f => (
            <div key={f.label} className="rounded-lg border border-border bg-card p-2">
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">{f.label}</span>
              <p className={cn("text-[11px] font-semibold leading-snug", f.highlight ? "text-primary" : "text-foreground")}>{f.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Score */}
      <PreviewSection id="score" icon={TrendingUp} title="Score" highlight={getHighlight("score")} showHighlights={showHighlights} onlyChanges={onlyChanges}>
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <svg className="h-14 w-14 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
                strokeDasharray={`${(score / 100) * 213.6} 213.6`} strokeLinecap="round" />
            </svg>
            <span className="absolute text-sm font-black text-foreground">{score}</span>
          </div>
          <span className="text-xs text-muted-foreground">Scientific Score</span>
        </div>
      </PreviewSection>

      {/* Sequence — uses the same SequenceSection as the real page */}
      <PreviewSection id="sequence" icon={Dna} title="Sequência Peptídica" highlight={getHighlight("sequence")} showHighlights={showHighlights} onlyChanges={onlyChanges}>
        <SequenceSection
          sequence={p.sequence}
          sequenceLength={p.sequence_length}
          sourceOrigins={p.source_origins}
          confidenceScore={p.confidence_score}
          lastSyncedAt={p.last_synced_at}
          updatedAt={p.updated_at}
          structureInfo={p.structure_info}
          peptideId={p.id}
          peptideName={p.name}
        />
      </PreviewSection>

      {/* Mechanism */}
      {p.mechanism && (
        <PreviewSection id="mechanism" icon={Zap} title="Mecanismo de Ação" highlight={getHighlight("mechanism")} showHighlights={showHighlights} onlyChanges={onlyChanges}>
          <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{p.mechanism}</p>
          {p.mechanism_points?.length > 0 && (
            <div className="space-y-1">
              {p.mechanism_points.map((pt: string, i: number) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/40 border border-border">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[8px] font-bold mt-0.5">{i + 1}</span>
                  <span className="text-[10px] text-muted-foreground leading-relaxed">{pt}</span>
                </div>
              ))}
            </div>
          )}
        </PreviewSection>
      )}

      {/* Benefits */}
      {p.benefits?.length > 0 && (
        <PreviewSection id="benefits" icon={CheckCircle2} title="Benefícios" iconColor="text-emerald-400" highlight={getHighlight("benefits")} showHighlights={showHighlights} onlyChanges={onlyChanges}>
          <div className="space-y-1">
            {p.benefits.map((b: string, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/40 border border-border">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold mt-0.5">{i + 1}</span>
                <span className="text-[10px] text-foreground/90 leading-relaxed">{b}</span>
              </div>
            ))}
          </div>
        </PreviewSection>
      )}

      {/* Side effects */}
      {p.side_effects && (
        <PreviewSection id="side_effects" icon={AlertTriangle} title="Efeitos Colaterais" iconColor="text-amber-400" highlight={getHighlight("side_effects")} showHighlights={showHighlights} onlyChanges={onlyChanges}>
          <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
            <p className="text-[10px] text-muted-foreground leading-relaxed">{translateMedicalText(p.side_effects)}</p>
          </div>
        </PreviewSection>
      )}

      {/* Timeline */}
      {timelineData && timelineData.length > 0 && (
        <PreviewSection id="timeline" icon={Clock} title="Timeline" iconColor="text-sky-400" highlight={getHighlight("timeline")} showHighlights={showHighlights} onlyChanges={onlyChanges}>
          <div className="space-y-0">
            {timelineData.map((t, i) => (
              <div key={i} className="flex gap-2 items-stretch">
                <div className="flex flex-col items-center w-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-1 ring-1 ring-primary/20" />
                  {i < timelineData.length - 1 && <div className="w-px flex-1 bg-border" />}
                </div>
                <div className="pb-3 flex-1">
                  <p className="text-[10px] font-bold text-primary mb-0.5">{t.periodo || t.period}</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{t.efeito || t.description}</p>
                </div>
              </div>
            ))}
          </div>
        </PreviewSection>
      )}

      {/* Dosage */}
      {(dosageRows?.length || p.dosage_info) && (
        <PreviewSection id="dosage" icon={Syringe} title="Dosagem" highlight={getHighlight("dosage")} showHighlights={showHighlights} onlyChanges={onlyChanges}>
          {p.dosage_info && <p className="text-[10px] text-foreground font-medium leading-relaxed mb-2 p-2 rounded bg-primary/5 border border-primary/15">{p.dosage_info}</p>}
          {dosageRows && dosageRows.length > 0 && (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-[10px]">
                <thead><tr className="border-b border-border">
                  {["Indicação", "Dose", "Freq.", "Duração"].map(h => <th key={h} className="text-left py-1.5 px-2 text-muted-foreground font-semibold text-[9px] uppercase tracking-wider">{h}</th>)}
                </tr></thead>
                <tbody>{dosageRows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5 px-2 text-foreground font-medium">{row.indicacao}</td>
                    <td className="py-1.5 px-2 text-primary font-bold">{row.dose}</td>
                    <td className="py-1.5 px-2 text-muted-foreground">{row.frequencia}</td>
                    <td className="py-1.5 px-2 text-muted-foreground">{row.duracao}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </PreviewSection>
      )}

      {/* Protocols */}
      {phases && phases.length > 0 && (
        <PreviewSection id="protocols" icon={ListChecks} title="Fases do Protocolo" highlight={getHighlight("protocols")} showHighlights={showHighlights} onlyChanges={onlyChanges}>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[10px]">
              <thead><tr className="border-b border-border">
                <th className="text-left py-1.5 px-2 text-muted-foreground font-semibold text-[9px] uppercase w-5">#</th>
                <th className="text-left py-1.5 px-2 text-muted-foreground font-semibold text-[9px] uppercase">Fase</th>
                <th className="text-left py-1.5 px-2 text-muted-foreground font-semibold text-[9px] uppercase">Dose</th>
                <th className="text-left py-1.5 px-2 text-muted-foreground font-semibold text-[9px] uppercase">Detalhes</th>
              </tr></thead>
              <tbody>{phases.map((row, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5 px-2"><span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-primary text-[8px] font-bold">{i + 1}</span></td>
                  <td className="py-1.5 px-2 text-foreground font-medium">{row.fase}</td>
                  <td className="py-1.5 px-2 text-primary font-bold">{row.dose}</td>
                  <td className="py-1.5 px-2 text-muted-foreground">{row.detalhes}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </PreviewSection>
      )}

      {/* Reconstitution */}
      {p.reconstitution_steps?.length > 0 && (
        <PreviewSection id="recon" icon={Beaker} title="Reconstituição" highlight={getHighlight("recon")} showHighlights={showHighlights} onlyChanges={onlyChanges}>
          <div className="space-y-1">
            {p.reconstitution_steps.map((step: string, i: number) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/40 border border-border">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[8px] font-bold mt-0.5">{i + 1}</span>
                <span className="text-[10px] text-muted-foreground leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </PreviewSection>
      )}

      {/* Stacks */}
      {stacksData && stacksData.length > 0 && (
        <PreviewSection id="stacks" icon={Layers} title="Stacks" highlight={getHighlight("stacks")} showHighlights={showHighlights} onlyChanges={onlyChanges}>
          <div className="space-y-2">
            {stacksData.map((stack, i) => (
              <div key={i} className="p-2 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-foreground">{stack.nome}</span>
                  <Badge className="text-[8px] bg-primary/10 text-primary border border-primary/20 font-semibold">{stack.objetivo}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {stack.peptideos.map(sp => <Badge key={sp} className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{sp}</Badge>)}
                </div>
              </div>
            ))}
          </div>
        </PreviewSection>
      )}

      {/* Interactions */}
      {allInteractions.length > 0 && (
        <PreviewSection id="interactions" icon={GitMerge} title="Interações" highlight={getHighlight("interactions")} showHighlights={showHighlights} onlyChanges={onlyChanges}>
          <div className="space-y-1">
            {allInteractions.map((item, i) => (
              <div key={i} className="flex flex-col gap-1 p-2 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-foreground">{item.nome}</span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-[9px] text-muted-foreground leading-relaxed">{item.descricao}</p>
              </div>
            ))}
          </div>
        </PreviewSection>
      )}

      {/* References */}
      {refs && refs.length > 0 && (
        <PreviewSection id="refs" icon={BookOpen} title={`Referências Científicas (${refs.length})`} highlight={getHighlight("refs")} showHighlights={showHighlights} onlyChanges={onlyChanges}>
          <div className="space-y-1">
            {refs.map((ref, i) => {
              const title = ref.titulo || ref.title || "";
              const source = ref.fonte || ref.source || ref.journal || "";
              const year = ref.ano || ref.year || null;
              const pmid = ref.pmid;
              return (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/30 border border-border">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[8px] font-bold mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    {title ? (
                      <p className="text-[10px] text-foreground font-semibold leading-relaxed">{title}</p>
                    ) : pmid ? (
                      <p className="text-[10px] text-foreground font-semibold leading-relaxed">PMID: {pmid}</p>
                    ) : null}
                    <p className="text-[9px] text-muted-foreground">
                      {source}{source && year ? " · " : ""}{year}
                      {pmid && (
                        <>
                          {(source || year) ? " · " : ""}
                          <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-0.5"
                          >
                            PubMed <ExternalLink className="h-2 w-2" />
                          </a>
                        </>
                      )}
                    </p>
                    {ref.authors && (
                      <p className="text-[8px] text-muted-foreground/60 mt-0.5">{ref.authors}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </PreviewSection>
      )}

      <div className="h-4" />
    </div>
  );
}

/* Export section mapping for the changes nav */
export const SECTION_MAP: Record<string, { label: string; icon: React.ElementType }> = {
  hero: { label: "Informações Gerais", icon: Tag },
  score: { label: "Score", icon: TrendingUp },
  sequence: { label: "Sequência Peptídica", icon: Dna },
  mechanism: { label: "Mecanismo de Ação", icon: Zap },
  benefits: { label: "Benefícios", icon: CheckCircle2 },
  side_effects: { label: "Efeitos Colaterais", icon: AlertTriangle },
  timeline: { label: "Timeline", icon: Clock },
  dosage: { label: "Dosagem", icon: Syringe },
  protocols: { label: "Protocolos", icon: ListChecks },
  recon: { label: "Reconstituição", icon: Beaker },
  stacks: { label: "Stacks", icon: Layers },
  interactions: { label: "Interações", icon: GitMerge },
  refs: { label: "Referências", icon: BookOpen },
};
