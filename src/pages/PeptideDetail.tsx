import { useParams, useNavigate } from "react-router-dom";
import { peptideVideos } from "@/assets/videos";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ScrollReveal";
import { CalculatorModal } from "@/components/peptide/CalculatorModal";
import { useEntitlements } from "@/hooks/useEntitlements";
import { usePeptides } from "@/hooks/usePeptides";
import { useAuth } from "@/hooks/useAuth";
import { Crown, Lock, UserPlus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Json } from "@/integrations/supabase/types";
import {
  ArrowLeft, Tag, Activity, Clock, RotateCcw, Zap, CheckCircle2,
  AlertTriangle, Syringe, ListChecks, Beaker, BookOpen, GitMerge,
  Layers, ExternalLink, Calculator, Shield, TrendingUp, Star, ChevronDown
} from "lucide-react";

/* ─── Type helpers ─── */
interface TimelineItem { period?: string; periodo?: string; description?: string; efeito?: string; }
interface RawDosageRow { indicacao?: string; objetivo?: string; dose: string; frequencia: string; duracao: string; }
interface NormalizedDosageRow { indicacao: string; dose: string; frequencia: string; duracao: string; }
interface RawPhaseRow { fase: string; dose?: string; notas?: string; unidades?: string; duracao?: string; descricao?: string; }
interface NormalizedPhaseRow { fase: string; dose: string; detalhes: string; }
interface Reference { titulo: string; fonte: string; ano: number; pmid?: string; }
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

/* ─── Collapsible section wrapper ─── */
function Section({ id, icon, title, iconColor = "text-primary", action, children, collapseSignal }: {
  id?: string; icon: React.ElementType; title: string; iconColor?: string; action?: React.ReactNode; children: React.ReactNode; collapseSignal: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const Icon = icon;

  useEffect(() => {
    if (collapseSignal > 0) {
      setExpanded(false);
    }
  }, [collapseSignal]);

  const handleToggle = () => {
    setExpanded(prev => !prev);
  };

  return (
    <ScrollReveal>
      <section id={id} data-section-id={id} className="rounded-xl border border-border bg-card card-line overflow-hidden">
        {/* Header — always visible, clickable */}
        <button
          onClick={handleToggle}
          className="w-full flex items-center justify-between p-4 sm:px-5 sm:py-3.5 text-left group hover:bg-secondary/20 transition-colors"
        >
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-md bg-primary/8 ${iconColor}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            {title}
          </h3>
          <div className="flex items-center gap-2">
            {action && <div onClick={e => e.stopPropagation()}>{action}</div>}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
          </div>
        </button>
        {/* Content — collapses */}
        <div
          className="transition-all duration-400 ease-in-out overflow-hidden"
          style={{
            maxHeight: expanded ? "2000px" : "0px",
            opacity: expanded ? 1 : 0,
            transition: "max-height 0.4s ease-in-out, opacity 0.3s ease-in-out",
          }}
        >
          <div className="px-4 pb-4 sm:px-5 sm:pb-5">
            {children}
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}

/* ─── Locked section placeholder (for anonymous/free users) ─── */
function LockedSectionPlaceholder({ icon, title, iconColor = "text-primary", navigateTo }: {
  icon: React.ElementType; title: string; iconColor?: string; navigateTo: (path: string) => void;
}) {
  const Icon = icon;
  return (
    <ScrollReveal>
      <section className="rounded-xl border border-border bg-card card-line overflow-hidden relative">
        <div className="p-4 sm:px-5 sm:py-3.5">
          <h3 className="text-sm font-bold text-foreground/40 flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-md bg-muted/30 text-muted-foreground/40`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            {title}
            <Lock className="h-3.5 w-3.5 text-muted-foreground/40 ml-auto" />
          </h3>
        </div>
        {/* Blurred placeholder content */}
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="space-y-2 pointer-events-none select-none blur-[4px] brightness-[0.5]">
            <div className="h-3 bg-muted/20 rounded w-3/4" />
            <div className="h-3 bg-muted/20 rounded w-1/2" />
            <div className="h-3 bg-muted/20 rounded w-2/3" />
          </div>
        </div>
      </section>
    </ScrollReveal>
  );
}

/* ─── Premium gate card (inserted between free and locked sections) ─── */
function PremiumGateCard({ user, navigate }: { user: any; navigate: (path: string) => void }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-card overflow-hidden">
      <div className="flex flex-col items-center text-center py-8 px-6">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
          <Lock className="h-6 w-6 text-primary" />
          <Crown className="h-3 w-3 text-primary absolute translate-x-3 -translate-y-3" />
        </div>
        <h3 className="text-sm font-bold text-foreground mb-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Conteúdo completo exclusivo Premium
        </h3>
        <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed mb-5">
          Acesse dosagens detalhadas, protocolos completos, interações verificadas e referências científicas.
        </p>
        <Button
          className="gap-2 h-10 text-xs font-bold px-8"
          onClick={() => navigate(user ? "/app/billing" : "/auth")}
        >
          <Crown className="h-4 w-4" />
          {user ? "Desbloquear com Premium" : "Criar Conta Gratuita"}
        </Button>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Acesso imediato</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Cancele quando quiser</span>
        </div>
      </div>
    </div>
  );
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

/* ─── Score helpers ─── */
function computeScore(p: any) {
  let score = 50;
  if (p.evidence_level) {
    const e = p.evidence_level.toLowerCase();
    if (e.includes("alto") || e.includes("high")) score += 20;
    else if (e.includes("moderado") || e.includes("moderate") || e.includes("médio")) score += 10;
  }
  if (p.benefits?.length > 4) score += 10;
  if (p.mechanism_points?.length > 3) score += 5;
  if (p.scientific_references && (p.scientific_references as any[]).length > 2) score += 10;
  if (p.dosage_table && (p.dosage_table as any[]).length > 0) score += 5;
  return Math.min(score, 100);
}

/* ═══════════════════════════════════════════════ */
export default function PeptideDetail() {
  const FREE_PEPTIDE_LIMIT = 1;
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>("");
  const [collapseSignal, setCollapseSignal] = useState(0);
  const [calcOpen, setCalcOpen] = useState(false);
  const hasScrolledDown = useRef(false);
  const hasAutoCollapsed = useRef(false);

  const { isAdmin, isPro } = useEntitlements();
  const { user } = useAuth();
  const hasAccess = isAdmin || isPro;
  const canViewFullContent = hasAccess; // Free & anonymous users see locked sections
  const { data: allPeptides = [] } = usePeptides();

  const { data: peptide, isLoading } = useQuery({
    queryKey: ["peptide", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("peptides").select("*").eq("slug", slug!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Determine if this peptide is locked for free users
  const isLocked = (() => {
    if (hasAccess) return false;
    if (!slug || allPeptides.length === 0) return false;
    const sorted = [...allPeptides].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    const idx = sorted.findIndex(p => p.slug === slug);
    return idx >= FREE_PEPTIDE_LIMIT;
  })();

  /* Intersection observer for active section tracking */
  const observeSections = useCallback(() => {
    const sectionEls = document.querySelectorAll("[data-section-id]");
    if (!sectionEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = (visible[0].target as HTMLElement).dataset.sectionId;
          if (id) setActiveSection(id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    sectionEls.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!peptide) return;
    const timer = setTimeout(observeSections, 200);
    return () => clearTimeout(timer);
  }, [peptide, observeSections]);

  useEffect(() => {
    hasScrolledDown.current = false;
    hasAutoCollapsed.current = false;
    setCollapseSignal(0);

    const scrollContainer = document.querySelector("main") as HTMLElement | null;
    if (!scrollContainer) return;

    let lastScrollTop = scrollContainer.scrollTop;
    const downThreshold = 120;

    const handleScroll = () => {
      const currentScrollTop = scrollContainer.scrollTop;

      if (currentScrollTop > downThreshold) {
        hasScrolledDown.current = true;
      }

      const isScrollingUp = currentScrollTop < lastScrollTop;
      if (isScrollingUp && hasScrolledDown.current && !hasAutoCollapsed.current) {
        hasAutoCollapsed.current = true;
        setCollapseSignal((value) => value + 1);
      }

      lastScrollTop = currentScrollTop;
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, [slug]);

  /* Loading */
  if (isLoading) {
    return (
      <div className="p-4 sm:p-5 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!peptide) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center flex-col gap-3">
        <p className="text-sm text-muted-foreground">Peptídeo não encontrado.</p>
        <button onClick={() => navigate("/app/peptides")} className="text-xs text-primary hover:underline">Voltar à Biblioteca</button>
      </div>
    );
  }

  /* ── LOCKED GATE for free users ── */
  /* Instead of blocking, we render the page blurred with a modal overlay */

  const p = peptide;
  const timelineData = p.timeline as unknown as TimelineItem[] | null;
  const rawDosage = p.dosage_table as unknown as RawDosageRow[] | null;
  const rawPhases = p.protocol_phases as unknown as RawPhaseRow[] | null;
  const dosageRows = rawDosage ? normalizeDosage(rawDosage) : null;
  const phases = rawPhases ? normalizePhases(rawPhases) : null;
  const refs = p.scientific_references as unknown as Reference[] | null;
  const allInteractions = normalizeInteractions(p.interactions);
  const stacksData = p.stacks as unknown as Stack[] | null;
  const score = computeScore(p);

  /* Quick fact cards */
  const quickFacts = [
    { icon: Tag, label: "Classificação", value: p.classification || "—" },
    { icon: Activity, label: "Evidência", value: p.evidence_level || "—", highlight: true },
    { icon: Clock, label: "Meia-Vida", value: p.half_life ? `~${p.half_life}` : "—" },
    { icon: RotateCcw, label: "Reconstituição", value: p.reconstitution || "—" },
  ];

  /* Nav sections */
  const sections = [
    { id: "score", label: "Score", icon: TrendingUp },
    p.mechanism ? { id: "mechanism", label: "Mecanismo", icon: Zap } : null,
    p.benefits?.length ? { id: "benefits", label: "Benefícios", icon: CheckCircle2 } : null,
    timelineData?.length ? { id: "timeline", label: "Timeline", icon: Clock } : null,
    (dosageRows?.length || p.dosage_info) ? { id: "dosage", label: "Dosagem", icon: Syringe } : null,
    phases?.length ? { id: "protocols", label: "Protocolos", icon: ListChecks } : null,
    p.reconstitution_steps?.length ? { id: "recon", label: "Reconstituição", icon: Beaker } : null,
    stacksData?.length ? { id: "stacks", label: "Stacks", icon: Layers } : null,
    allInteractions.length ? { id: "interactions", label: "Interações", icon: GitMerge } : null,
    refs?.length ? { id: "refs", label: "Referências", icon: BookOpen } : null,
  ].filter(Boolean) as { id: string; label: string; icon: React.ElementType }[];

  return (
    <>
    <div className={`p-3 sm:p-5 max-w-5xl mx-auto ${isLocked ? "pointer-events-none select-none blur-[6px] brightness-[0.4] saturate-[0.2]" : ""}`}>
      {/* ── TOP AREA (full width) ── */}
      <div className="space-y-4 mb-4">

      {/* ── HERO ── */}
      <div>
        <button onClick={() => navigate("/app/peptides")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors group">
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" /> Biblioteca
        </button>

        <div className="relative rounded-xl overflow-hidden border border-border card-line">
          {slug && peptideVideos[slug] ? (
            <>
              <video
                autoPlay muted loop playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-30"
                src={peptideVideos[slug]}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-card/90 via-card/70 to-transparent" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-background" />
              <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 85% 15%, hsl(var(--primary) / 0.08) 0%, transparent 50%), radial-gradient(circle at 15% 85%, hsl(var(--glow-accent) / 0.04) 0%, transparent 40%)` }} />
            </>
          )}
          <div className="absolute inset-0 flex items-center justify-end pr-6 sm:pr-10 pointer-events-none select-none overflow-hidden">
            <span className="text-[3.5rem] sm:text-[5rem] lg:text-[6rem] font-black text-white/[0.02] leading-none tracking-tighter whitespace-nowrap">{p.name}</span>
          </div>
          <div className="relative z-10 px-4 py-4 sm:px-5 sm:py-5">
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md">{p.category}</Badge>
              {p.classification && <Badge variant="outline" className="text-[10px] border-border text-muted-foreground bg-secondary/50">{p.classification}</Badge>}
              {p.evidence_level && <Badge variant="outline" className="text-[10px] border-border text-muted-foreground bg-secondary/50">{p.evidence_level}</Badge>}
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground mb-1 tracking-tight">{p.name}</h1>
            {p.description && <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mb-1">{p.description}</p>}
            {p.alternative_names && p.alternative_names.length > 0 && (
              <p className="text-[10px] text-muted-foreground/50">Também: <span className="text-muted-foreground/70">{p.alternative_names.join(", ")}</span></p>
            )}

            {/* Quick action buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              <Button size="sm" variant="outline" className="text-[11px] gap-1.5 h-7" onClick={() => setCalcOpen(true)}>
                <Calculator className="h-3 w-3" /> Calcular Dose
              </Button>
              <Button size="sm" variant="outline" className="text-[11px] gap-1.5 h-7" onClick={() => navigate("/app/compare")}>
                <ArrowLeft className="h-3 w-3 rotate-180" /> Comparar
              </Button>
              <Button size="sm" variant="outline" className="text-[11px] gap-1.5 h-7" onClick={() => navigate("/app/interactions")}>
                <Shield className="h-3 w-3" /> Interações
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK FACTS (inline nav) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {quickFacts.map(f => (
          <div key={f.label} className="rounded-lg border border-border bg-card p-3 card-line">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/8"><f.icon className="h-3 w-3 text-primary" /></div>
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">{f.label}</span>
            </div>
            <p className={`text-xs font-semibold ${f.highlight ? 'text-primary' : 'text-foreground'} leading-snug`}>{f.value}</p>
          </div>
        ))}
      </div>

      </div>{/* end top area */}

      {/* ── TWO-COLUMN LAYOUT: Content + Sticky Sidebar ── */}
      <div className="flex gap-5">
        {/* Main content */}
        <div key={slug} className="flex-1 min-w-0 space-y-4">

      {/* ── SCORE ── */}
      <Section collapseSignal={collapseSignal} id="score" icon={TrendingUp} title="Score do Peptídeo">
        <div className="flex items-center gap-4">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
                strokeDasharray={`${(score / 100) * 213.6} 213.6`} strokeLinecap="round" className="transition-all duration-700" />
            </svg>
            <span className="absolute text-lg font-black text-foreground">{score}</span>
          </div>
          <div className="flex-1 space-y-2">
            {[
              { label: "Evidência Científica", val: p.evidence_level ? (p.evidence_level.toLowerCase().includes("alto") ? 90 : 60) : 30 },
              { label: "Dados de Dosagem", val: dosageRows?.length ? 85 : 20 },
              { label: "Referências", val: refs?.length ? Math.min(refs.length * 20, 100) : 10 },
              { label: "Interações Mapeadas", val: allInteractions.length ? Math.min(allInteractions.length * 15, 100) : 10 },
            ].map(b => (
              <div key={b.label}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="text-foreground font-medium">{b.val}%</span>
                </div>
                <div className="h-1 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${b.val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── MECHANISM ── */}
      {p.mechanism && (
        <Section collapseSignal={collapseSignal} id="mechanism" icon={Zap} title="Mecanismo de Ação">
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{p.mechanism}</p>
          {p.mechanism_points && p.mechanism_points.length > 0 && (
            <div className="space-y-1.5">
              {p.mechanism_points.map((pt, i) => (
                <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/40 border border-border">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[9px] font-bold mt-0.5">{i + 1}</span>
                  <span className="text-[11px] text-muted-foreground leading-relaxed">{pt}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ── BENEFITS ── */}
      {p.benefits && p.benefits.length > 0 && (
        <Section collapseSignal={collapseSignal} id="benefits" icon={CheckCircle2} title="Benefícios Comprovados" iconColor="text-emerald-400">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {p.benefits.map((b: string, i: number) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/40 border border-border">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold mt-0.5">{i + 1}</span>
                <span className="text-xs text-foreground/90 leading-relaxed">{b}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── SIDE EFFECTS ── */}
      {p.side_effects && (
        <Section collapseSignal={collapseSignal} icon={AlertTriangle} title="Efeitos Colaterais" iconColor="text-amber-400">
          <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
            <p className="text-xs text-muted-foreground leading-relaxed">{p.side_effects}</p>
          </div>
        </Section>
      )}

      {/* ── PREMIUM GATE: locked sections for free/anonymous users ── */}
      {!canViewFullContent ? (
        <>
          {/* Premium gate card */}
          <PremiumGateCard user={user} navigate={navigate} />

          {/* Locked section placeholders */}
          {timelineData && timelineData.length > 0 && (
            <LockedSectionPlaceholder icon={Clock} title="Timeline de Resultados" iconColor="text-sky-400" navigateTo={navigate} />
          )}
          {(dosageRows?.length || p.dosage_info) && (
            <LockedSectionPlaceholder icon={Syringe} title="Dosagem" navigateTo={navigate} />
          )}
          {phases && phases.length > 0 && (
            <LockedSectionPlaceholder icon={ListChecks} title="Fases do Protocolo" navigateTo={navigate} />
          )}
          {p.reconstitution_steps && p.reconstitution_steps.length > 0 && (
            <LockedSectionPlaceholder icon={Beaker} title="Reconstituição" navigateTo={navigate} />
          )}
          {stacksData && stacksData.length > 0 && (
            <LockedSectionPlaceholder icon={Layers} title="Stacks Recomendados" navigateTo={navigate} />
          )}
          {allInteractions.length > 0 && (
            <LockedSectionPlaceholder icon={GitMerge} title="Interações" navigateTo={navigate} />
          )}
          {refs && refs.length > 0 && (
            <LockedSectionPlaceholder icon={BookOpen} title="Referências Científicas" navigateTo={navigate} />
          )}
        </>
      ) : (
        <>
      {/* ── TIMELINE ── */}
      {timelineData && timelineData.length > 0 && (
        <Section collapseSignal={collapseSignal} id="timeline" icon={Clock} title="Timeline de Resultados" iconColor="text-sky-400">
          <div className="space-y-0">
            {timelineData.map((t, i) => {
              const period = t.periodo || t.period || '';
              const desc = t.efeito || t.description || '';
              return (
                <div key={i} className="flex gap-3 items-stretch">
                  <div className="flex flex-col items-center w-3">
                    <div className="h-3 w-3 rounded-full bg-primary shrink-0 mt-1 ring-2 ring-primary/20" />
                    {i < timelineData.length - 1 && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-4 flex-1">
                    <p className="text-xs font-bold text-primary mb-0.5">{period}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* ── DOSAGE ── */}
      {(dosageRows?.length || p.dosage_info) && (
        <Section collapseSignal={collapseSignal} id="dosage" icon={Syringe} title="Dosagem" action={<Button size="sm" variant="outline" className="text-[10px] gap-1 h-6" onClick={() => setCalcOpen(true)}><Calculator className="h-3 w-3" /> Calculadora</Button>}>
          {p.dosage_info && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/15 mb-3">
              <p className="text-xs text-foreground font-medium leading-relaxed">{p.dosage_info}</p>
            </div>
          )}
          {p.half_life && <p className="text-xs text-muted-foreground mb-3"><span className="font-semibold text-foreground">Meia-vida:</span> ~{p.half_life}</p>}
          {dosageRows && dosageRows.length > 0 && (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {["Indicação", "Dose", "Frequência", "Duração"].map(h => (
                      <th key={h} className="text-left py-2 px-2.5 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dosageRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="py-2.5 px-2.5 text-foreground font-medium">{row.indicacao}</td>
                      <td className="py-2.5 px-2.5 text-primary font-bold whitespace-nowrap">{row.dose}</td>
                      <td className="py-2.5 px-2.5 text-muted-foreground">{row.frequencia}</td>
                      <td className="py-2.5 px-2.5 text-muted-foreground">{row.duracao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {/* ── PROTOCOLS ── */}
      {phases && phases.length > 0 && (
        <Section collapseSignal={collapseSignal} id="protocols" icon={ListChecks} title="Fases do Protocolo">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2.5 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider w-6">#</th>
                  <th className="text-left py-2 px-2.5 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">Fase</th>
                  <th className="text-left py-2 px-2.5 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">Dose</th>
                  <th className="text-left py-2 px-2.5 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {phases.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="py-2.5 px-2.5"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">{i + 1}</span></td>
                    <td className="py-2.5 px-2.5 text-foreground font-medium">{row.fase}</td>
                    <td className="py-2.5 px-2.5 text-primary font-bold whitespace-nowrap">{row.dose}</td>
                    <td className="py-2.5 px-2.5 text-muted-foreground">{row.detalhes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ── RECONSTITUTION ── */}
      {p.reconstitution_steps && p.reconstitution_steps.length > 0 && (
        <Section collapseSignal={collapseSignal} id="recon" icon={Beaker} title="Reconstituição">
          <div className="space-y-1.5">
            {p.reconstitution_steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/40 border border-border">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">{i + 1}</span>
                <span className="text-xs text-muted-foreground leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── STACKS ── */}
      {stacksData && stacksData.length > 0 && (
        <Section collapseSignal={collapseSignal} id="stacks" icon={Layers} title="Stacks Recomendados">
          <div className="space-y-2.5">
            {stacksData.map((stack, i) => (
              <div key={i} className="p-3 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-start sm:items-center justify-between gap-2 mb-2 flex-col sm:flex-row">
                  <span className="text-sm font-bold text-foreground">{stack.nome}</span>
                  <Badge className="text-[10px] bg-primary/10 text-primary border border-primary/20 font-semibold shrink-0">{stack.objetivo}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {stack.peptideos.map(sp => (
                    <Badge key={sp} className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">{sp}</Badge>
                  ))}
                </div>
                {stack.descricao && <p className="text-xs text-muted-foreground leading-relaxed">{stack.descricao}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── INTERACTIONS ── */}
      {allInteractions.length > 0 && (
        <Section collapseSignal={collapseSignal} id="interactions" icon={GitMerge} title="Interações">
          <div className="space-y-1.5">
            {allInteractions.map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border">
                <span className="text-xs font-semibold text-foreground min-w-[120px]">{item.nome}</span>
                <StatusBadge status={item.status} />
                <p className="text-[11px] text-muted-foreground leading-relaxed flex-1">{item.descricao}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── REFERENCES ── */}
      {refs && refs.length > 0 && (
        <Section collapseSignal={collapseSignal} id="refs" icon={BookOpen} title="Referências Científicas">
          <div className="space-y-1.5">
            {refs.map((ref, i) => (
              <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/30 border border-border">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground font-semibold leading-relaxed mb-0.5">{ref.titulo}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {ref.fonte} · {ref.ano}
                    {ref.pmid && (
                      <> · <a href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">PubMed <ExternalLink className="h-2.5 w-2.5" /></a></>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
        </>
      )}

      <div className="h-6" />
        </div>{/* end main content */}

        {/* ── STICKY SIDEBAR TOC ── */}
        <aside className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-5">
            <div className="rounded-xl border border-border bg-card p-3 card-line">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 pb-2 border-b border-border">
                Sumário
              </h4>
              <nav className="space-y-0.5">
                {sections.map(s => {
                  const isActive = activeSection === s.id;
                  return (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      <div className={`flex h-4 w-4 items-center justify-center rounded shrink-0 transition-colors duration-200 ${
                        isActive ? "bg-primary/20" : "bg-secondary"
                      }`}>
                        <s.icon className={`h-2.5 w-2.5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      {s.label}
                      {isActive && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </a>
                  );
                })}
              </nav>

              {/* Score mini */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="relative flex h-8 w-8 items-center justify-center">
                    <svg className="h-8 w-8 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="3"
                        strokeDasharray={`${(score / 100) * 87.96} 87.96`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-[9px] font-black text-foreground">{score}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-foreground leading-none">Score</p>
                    <p className="text-[9px] text-muted-foreground">Scientific</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>{/* end two-column */}

      <CalculatorModal
        open={calcOpen}
        onOpenChange={setCalcOpen}
        peptideName={p.name}
      />
    </div>

    {/* ── LOCKED MODAL for free users ── */}
    {isLocked && (
      <Dialog open={true} onOpenChange={() => navigate("/app/peptides")}>
        <DialogContent className="max-w-md border-primary/15 bg-card p-0 overflow-hidden [&>button]:hidden">
          <div className="p-6 sm:p-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <UserPlus className="h-7 w-7 text-primary" />
            </div>

            <h2 className="text-lg font-bold text-foreground mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Conteúdo Exclusivo
            </h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs">
              {user
                ? "Faça upgrade para desbloquear todos os peptídeos e protocolos completos."
                : "Crie sua conta gratuita para explorar e desbloquear protocolos completos."}
            </p>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-4 rounded-full border border-border bg-secondary/30 px-5 py-2 mb-5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5 text-primary" /> 2.847+ membros
              </span>
              <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> 4.9
              </span>
            </div>

            {/* Features */}
            <div className="w-full mb-5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                O que você desbloqueia:
              </p>
              <ul className="space-y-2 text-left">
                {[
                  "Dosagem personalizada por indicação",
                  "Guia de reconstituição passo a passo",
                  "Stacks sinérgicos recomendados",
                  "Mecanismo de ação detalhado",
                  "Referências científicas com PubMed",
                  "Protocolos completos com fases",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Testimonial */}
            <div className="w-full rounded-xl border border-border bg-secondary/20 p-4 mb-5">
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                "Uso diariamente no consultório. A plataforma mais completa para protocolos de peptídeos."
              </p>
              <p className="text-xs font-semibold text-foreground mt-2">— Dr. Rafael M., Endocrinologista</p>
            </div>

            {/* CTA */}
            <Button
              className="w-full gap-2 h-11 text-sm font-bold"
              onClick={() => navigate(user ? "/app/billing" : "/auth")}
            >
              <Crown className="h-4 w-4" />
              {user ? "Ver Planos" : "Criar Conta Gratuita"}
            </Button>
            <p className="text-[10px] text-muted-foreground/60 mt-2">
              ⏱ Garantia 7 dias · Grátis para criar
            </p>

            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-muted-foreground"
              onClick={() => navigate("/app/peptides")}
            >
              Voltar à Biblioteca
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}
