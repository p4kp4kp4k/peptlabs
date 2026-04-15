/**
 * CorrectionReviewPage
 * ====================
 * Full-page side-by-side comparison for audit corrections.
 * Replaces the old modal with a premium visual diff experience.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, ArrowRight, CheckCircle2, XCircle, AlertTriangle, Loader2,
  Sparkles, Edit3, RefreshCw, History, SearchX, Eye, EyeOff,
  Link2, Unlink, Filter, FileCode, Wrench, Globe, Shield, ChevronLeft, ChevronRight
} from "lucide-react";
import { fieldLabel } from "./correctionEngine";
import { generateSuggestion, analyzeConflict, type Suggestion } from "./suggestionEngine";
import PeptidePreviewColumn, { SECTION_MAP, type ChangedField, type ChangeHighlightType } from "./PeptidePreviewColumn";

/* ── Field → Section mapping ── */
const FIELD_TO_SECTION: Record<string, string> = {
  sequence: "sequence",
  mechanism: "mechanism",
  mechanism_points: "mechanism",
  benefits: "benefits",
  side_effects: "side_effects",
  dosage_info: "dosage",
  dosage_table: "dosage",
  protocol_phases: "protocols",
  reconstitution: "recon",
  reconstitution_steps: "recon",
  stacks: "stacks",
  interactions: "interactions",
  scientific_references: "refs",
  description: "hero",
  classification: "hero",
  evidence_level: "hero",
  alternative_names: "hero",
  slug: "hero",
  source_origins: "score",
  half_life: "dosage",
};

const CHANGE_TYPE_MAP: Record<string, ChangeHighlightType> = {
  add: "added",
  replace: "replaced",
  merge: "merged",
  remove: "removed",
  manual_assist: "replaced",
};

export default function CorrectionReviewPage() {
  const { findingId } = useParams<{ findingId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const rawReturnTo = searchParams.get("returnTo");
  const returnTo = rawReturnTo?.startsWith("/app/admin")
    ? rawReturnTo
    : "/app/admin?tab=integrations&subtab=audit";
  const returnContext = new URLSearchParams(returnTo.split("?")[1] || "");
  const auditSeverity = returnContext.get("auditSeverity") || "all";
  const auditScope = returnContext.get("auditScope") || "global";
  const goBackToAudit = () => navigate(returnTo, { replace: true });

  // UI state
  const [syncScroll, setSyncScroll] = useState(true);
  const [showHighlights, setShowHighlights] = useState(true);
  const [onlyChanges, setOnlyChanges] = useState(false);
  const [showDiffPanel, setShowDiffPanel] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [notes, setNotes] = useState("");
  const [activeChangeIdx, setActiveChangeIdx] = useState(0);
  const [mobileTab, setMobileTab] = useState("current");

  // Scroll refs
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  // ── Data fetching ──
  const { data: finding, isLoading: findingLoading } = useQuery({
    queryKey: ["finding-review", findingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_findings")
        .select("*, peptides(name, id)")
        .eq("id", findingId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!findingId,
  });

  const { data: peptide } = useQuery({
    queryKey: ["peptide-for-review", finding?.peptide_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("peptides")
        .select("*")
        .eq("id", finding!.peptide_id!)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!finding?.peptide_id,
  });

  const { data: suggestion, isLoading: suggestionLoading, refetch: refetchSuggestion } = useQuery({
    queryKey: ["suggestion-review", findingId, finding?.peptide_id],
    queryFn: async (): Promise<Suggestion | null> => {
      if (!finding?.peptide_id || !peptide) return null;
      return generateSuggestion(
        {
          id: finding.id,
          category: finding.category,
          severity: finding.severity,
          peptide_id: finding.peptide_id,
          value_a: finding.value_a,
          value_b: finding.value_b,
          source_a: finding.source_a,
          source_b: finding.source_b,
          description: finding.description,
        },
        peptide as Record<string, any>
      );
    },
    enabled: !!finding?.peptide_id && !!peptide,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["correction-history-review", finding?.peptide_id],
    queryFn: async () => {
      if (!finding?.peptide_id) return [];
      const { data } = await supabase
        .from("peptide_change_history")
        .select("*")
        .eq("peptide_id", finding.peptide_id)
        .order("applied_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!finding?.peptide_id,
  });

  // ── Sibling findings for next/prev navigation ──
  const { data: siblingFindings = [] } = useQuery({
    queryKey: ["sibling-findings", finding?.audit_run_id, auditSeverity, auditScope],
    queryFn: async () => {
      if (!finding) return [];

      let query = supabase
        .from("audit_findings")
        .select("id, category, status, severity, peptide_id, peptides(name)")
        .eq("status", "open")
        .order("created_at", { ascending: true });

      if (auditScope === "run" && finding.audit_run_id) {
        query = query.eq("audit_run_id", finding.audit_run_id);
      }

      if (auditSeverity === "resolved") {
        query = query.in("status", ["resolved", "ignored"]);
      } else if (auditSeverity === "with_suggestion") {
        query = query.in("category", ["no_source", "no_references", "incomplete_data", "data_inconsistency"]);
      } else if (auditSeverity === "manual_only") {
        query = query.in("category", ["missing_sequence", "cross_source_conflict"]);
      } else if (auditSeverity !== "all") {
        query = query.eq("severity", auditSeverity);
      }

      const { data } = await query;
      return (data || []).filter((item: any) => item.status === "open" || auditSeverity === "resolved");
    },
    enabled: !!finding,
  });

  const currentFindingIdx = siblingFindings.findIndex((f: any) => f.id === findingId);
  const prevFinding = currentFindingIdx > 0 ? siblingFindings[currentFindingIdx - 1] : null;
  const nextFinding = currentFindingIdx < siblingFindings.length - 1 ? siblingFindings[currentFindingIdx + 1] : null;

  const navigateToFinding = (id: string) => {
    navigate(`/app/admin/review/${id}?${searchParams.toString()}`, { replace: true });
  };

  // ── Build corrected peptide ──
  const hasSuggestion = !!suggestion && suggestion.proposedValue !== null;

  const correctedPeptide = (() => {
    if (!peptide || !hasSuggestion || !suggestion) return peptide;
    const copy = { ...peptide } as Record<string, any>;
    const field = suggestion.field;
    if (suggestion.changeType === "merge" && Array.isArray(copy[field])) {
      const toAdd = Array.isArray(suggestion.proposedValue) ? suggestion.proposedValue : [suggestion.proposedValue];
      copy[field] = [...(copy[field] || []), ...toAdd.filter((v: any) => !(copy[field] || []).includes(v))];
    } else if (suggestion.changeType === "merge" && field === "scientific_references") {
      copy[field] = Array.isArray(suggestion.proposedValue)
        ? [...(copy[field] || []), ...suggestion.proposedValue]
        : copy[field];
    } else {
      copy[field] = manualMode ? tryParse(manualValue) : suggestion.proposedValue;
    }
    return copy;
  })();

  // ── Build changed fields list ──
  const changedFields: ChangedField[] = hasSuggestion && suggestion ? [{
    field: suggestion.field,
    sectionId: FIELD_TO_SECTION[suggestion.field] || "hero",
    type: CHANGE_TYPE_MAP[suggestion.changeType] || "replaced",
  }] : [];

  // ── Sync scroll handler ──
  const handleScroll = useCallback((source: "left" | "right") => {
    if (!syncScroll || isScrolling.current) return;
    isScrolling.current = true;
    const from = source === "left" ? leftScrollRef.current : rightScrollRef.current;
    const to = source === "left" ? rightScrollRef.current : leftScrollRef.current;
    if (from && to) {
      const pct = from.scrollTop / (from.scrollHeight - from.clientHeight || 1);
      to.scrollTop = pct * (to.scrollHeight - to.clientHeight);
    }
    requestAnimationFrame(() => { isScrolling.current = false; });
  }, [syncScroll]);

  // ── Navigate to changed section ──
  const scrollToSection = useCallback((sectionId: string) => {
    const scrollToInContainer = (container: HTMLDivElement | null) => {
      if (!container) return;
      const el = container.querySelector(`[data-preview-section="${sectionId}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    if (isMobile) {
      const container = mobileTab === "current" ? leftScrollRef.current : rightScrollRef.current;
      scrollToInContainer(container);
    } else {
      scrollToInContainer(leftScrollRef.current);
      if (syncScroll) {
        setTimeout(() => scrollToInContainer(rightScrollRef.current), 100);
      }
    }
  }, [syncScroll, isMobile, mobileTab]);

  // ── Mutations ──
  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!finding || !peptide || !suggestion) throw new Error("Dados insuficientes");
      const finalValue = manualMode ? tryParse(manualValue) : suggestion.proposedValue;
      const fieldName = suggestion.field;
      const beforeSnapshot: Record<string, any> = {};
      beforeSnapshot[fieldName] = (peptide as any)[fieldName];
      const updatePayload: Record<string, any> = {};
      if (suggestion.changeType === "merge" && Array.isArray((peptide as any)[fieldName])) {
        const current = (peptide as any)[fieldName] || [];
        const toAdd = Array.isArray(finalValue) ? finalValue : [finalValue];
        updatePayload[fieldName] = [...current, ...toAdd.filter((v: any) => !current.includes(v))];
      } else if (suggestion.changeType === "merge" && fieldName === "scientific_references") {
        const current = (peptide as any)[fieldName] || [];
        updatePayload[fieldName] = Array.isArray(finalValue) ? [...current, ...finalValue] : current;
      } else {
        updatePayload[fieldName] = finalValue;
      }
      updatePayload["updated_at"] = new Date().toISOString();

      const { error: updateError } = await supabase.from("peptides").update(updatePayload as any).eq("id", finding.peptide_id!);
      if (updateError) throw updateError;

      const { data: correctionData } = await supabase.from("audit_corrections").insert({
        audit_run_id: finding.audit_run_id,
        finding_id: finding.id,
        peptide_id: finding.peptide_id,
        field_name: fieldName,
        correction_type: manualMode ? "manual_assist" : suggestion.changeType,
        old_value: JSON.stringify(beforeSnapshot[fieldName]),
        new_value: JSON.stringify(updatePayload[fieldName]),
        source_provider: suggestion.sourceProvider,
        confidence_score: suggestion.confidenceScore,
        confidence_level: suggestion.confidenceLevel,
        approved_at: new Date().toISOString(),
        status: "applied",
        notes: notes || null,
      } as any).select("id").single();

      await supabase.from("peptide_change_history").insert({
        peptide_id: finding.peptide_id,
        change_origin: "audit_correction",
        change_summary: suggestion.description,
        before_snapshot: beforeSnapshot,
        after_snapshot: { [fieldName]: updatePayload[fieldName] },
        correction_id: correctionData?.id,
        applied_at: new Date().toISOString(),
      } as any);

      await supabase.from("audit_findings").update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        resolution_note: `Correção aplicada: ${suggestion.changeType} em ${fieldLabel(fieldName)}${notes ? ` — ${notes}` : ""}`,
      }).eq("id", finding.id);
    },
    onSuccess: () => {
      toast({ title: "Correção aplicada", description: "Dados atualizados com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["audit-findings"] });
      queryClient.invalidateQueries({ queryKey: ["open-findings-count"] });
      queryClient.invalidateQueries({ queryKey: ["sibling-findings"] });
      if (nextFinding) {
        navigateToFinding(nextFinding.id);
      } else {
        goBackToAudit();
      }
    },
    onError: (err: any) => {
      toast({ title: "Erro ao aplicar correção", description: err.message, variant: "destructive" });
    },
  });

  const ignoreMutation = useMutation({
    mutationFn: async () => {
      if (!finding) return;
      await supabase.from("audit_findings").update({
        status: "ignored",
        resolved_at: new Date().toISOString(),
        resolution_note: notes || "Ignorado pelo admin",
      }).eq("id", finding.id);
    },
    onSuccess: () => {
      toast({ title: "Finding ignorado" });
      queryClient.invalidateQueries({ queryKey: ["audit-findings"] });
      queryClient.invalidateQueries({ queryKey: ["sibling-findings"] });
      if (nextFinding) {
        navigateToFinding(nextFinding.id);
      } else {
        goBackToAudit();
      }
    },
  });

  // ── Loading state ──
  if (findingLoading || !finding) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Carregando finding...</span>
      </div>
    );
  }

  if (!peptide) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-3">
        <AlertTriangle className="h-8 w-8 text-amber-400" />
        <p className="text-sm text-muted-foreground">Peptídeo não encontrado para este finding.</p>
        <Button variant="outline" size="sm" onClick={goBackToAudit}>Voltar</Button>
      </div>
    );
  }

  const severityColors: Record<string, string> = {
    critical: "text-red-400 bg-red-400/10 border-red-400/30",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    low: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  };

  const confLabels: Record<string, string> = { high: "Alta", medium: "Média", low: "Baixa" };
  const confColors: Record<string, string> = {
    high: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    low: "text-red-400 bg-red-400/10 border-red-400/30",
  };

  // Status message
  const statusMessage = (() => {
    if (suggestionLoading) return { text: "Buscando sugestão nas fontes...", color: "text-muted-foreground" };
    if (!hasSuggestion) return { text: "Nenhuma sugestão automática confiável foi gerada. A página atual está à esquerda. Revise manualmente ou tente nova busca.", color: "text-amber-400" };
    if (suggestion!.confidenceLevel === "high") return { text: "Atualização segura sugerida com base em fonte confiável", color: "text-emerald-400" };
    if (suggestion!.confidenceLevel === "medium") return { text: "Revisão recomendada antes da aplicação", color: "text-amber-400" };
    return { text: "Aplicação automática não recomendada", color: "text-red-400" };
  })();

  /* ═══════ RENDER ═══════ */
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
      {/* ── TOPBAR ── */}
      <div className="shrink-0 border-b border-border bg-card/95 backdrop-blur-sm px-4 py-2.5 z-20">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={goBackToAudit}>
            <ArrowLeft className="h-3 w-3" /> Voltar
          </Button>

          {/* Prev / Next navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm" className="h-7 text-[10px] gap-0.5 px-2"
              disabled={!prevFinding}
              onClick={() => prevFinding && navigateToFinding(prevFinding.id)}
            >
              <ChevronLeft className="h-3 w-3" /> Anterior
            </Button>
            {siblingFindings.length > 0 && (
              <span className="text-[9px] text-muted-foreground px-1">
                {currentFindingIdx + 1}/{siblingFindings.length}
              </span>
            )}
            <Button
              variant="outline" size="sm" className="h-7 text-[10px] gap-0.5 px-2"
              disabled={!nextFinding}
              onClick={() => nextFinding && navigateToFinding(nextFinding.id)}
            >
              Próximo <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2 flex-wrap flex-1">
            <span className="text-sm font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {finding.peptides?.name || "Peptídeo"}
            </span>
            <Badge className={cn("text-[8px] border", severityColors[finding.severity])}>{finding.severity}</Badge>
            <Badge variant="outline" className="text-[8px]">{finding.category}</Badge>
            {hasSuggestion && (
              <>
                <Badge variant="outline" className="text-[8px]">{fieldLabel(suggestion!.field)}</Badge>
                <Badge className={cn("text-[8px] border", confColors[suggestion!.confidenceLevel])}>
                  <Sparkles className="h-2 w-2 mr-0.5" />{confLabels[suggestion!.confidenceLevel]}
                </Badge>
              </>
            )}
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-3 flex-wrap">
            {!isMobile && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowHighlights(!showHighlights)}
                      className={cn("flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md transition-colors",
                        showHighlights ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {showHighlights ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      Destaque
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Alternar destaque</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setSyncScroll(!syncScroll)}
                      className={cn("flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md transition-colors",
                        syncScroll ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {syncScroll ? <Link2 className="h-3 w-3" /> : <Unlink className="h-3 w-3" />}
                      Scroll sincronizado
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Scroll sincronizado</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setOnlyChanges(!onlyChanges)}
                      className={cn("flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md transition-colors",
                        onlyChanges ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Filter className="h-3 w-3" />
                      Apenas alterações
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Mostrar apenas seções alteradas</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowDiffPanel(!showDiffPanel)}
                      className={cn("flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-md transition-colors",
                        showDiffPanel ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <FileCode className="h-3 w-3" />
                      Diff técnico
                    </button>
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">Ver diff técnico</p></TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>

        {/* Status message */}
        <p className={cn("text-[10px] mt-1", statusMessage.color)}>{statusMessage.text}</p>
      </div>

      {/* ── BODY ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Changes nav sidebar (desktop only) */}
        {!isMobile && (
          <aside className="w-52 shrink-0 border-r border-border bg-card/50 overflow-y-auto p-3">
            <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Alterações
            </h4>
            {changedFields.length === 0 && !suggestionLoading && (
              <p className="text-[10px] text-muted-foreground italic">Nenhuma alteração proposta</p>
            )}
            {suggestionLoading && (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                <span className="text-[10px] text-muted-foreground">Buscando...</span>
              </div>
            )}
            <nav className="space-y-1">
              {changedFields.map((cf, idx) => {
                const section = SECTION_MAP[cf.sectionId];
                if (!section) return null;
                const Icon = section.icon;
                const typeLabels: Record<ChangeHighlightType, string> = {
                  added: "Novo", replaced: "Alterado", merged: "Mesclado", removed: "Removido", conflict: "Conflito"
                };
                const typeColors: Record<ChangeHighlightType, string> = {
                  added: "text-emerald-400", replaced: "text-amber-400", merged: "text-blue-400", removed: "text-red-400", conflict: "text-orange-400"
                };
                return (
                  <button
                    key={idx}
                    onClick={() => { setActiveChangeIdx(idx); scrollToSection(cf.sectionId); }}
                    className={cn(
                      "w-full text-left p-2 rounded-lg transition-all duration-200 group",
                      activeChangeIdx === idx ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary/50 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                      <span className="text-[10px] font-semibold text-foreground">{section.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn("text-[9px] font-bold", typeColors[cf.type])}>{typeLabels[cf.type]}</span>
                      {hasSuggestion && (
                        <>
                          <span className="text-[8px] text-muted-foreground">·</span>
                          <span className="text-[9px] text-muted-foreground">{suggestion!.sourceProvider}</span>
                          <span className="text-[8px] text-muted-foreground">·</span>
                          <span className={cn("text-[9px]", confColors[suggestion!.confidenceLevel].split(" ")[0])}>
                            {confLabels[suggestion!.confidenceLevel]}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>

            {/* History */}
            {history.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                  <History className="h-3 w-3" /> Histórico ({history.length})
                </h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {history.map((h: any) => (
                    <div key={h.id} className="p-1.5 rounded bg-secondary/40 border border-border/15 text-[9px]">
                      <p className="text-foreground font-medium truncate">{h.change_summary || "Alteração"}</p>
                      <p className="text-muted-foreground">{new Date(h.applied_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* ── Side-by-side columns (desktop) ── */}
        {!isMobile ? (
          <div className="flex-1 flex">
            {/* Left: Current */}
            <div className="flex-1 border-r border-border overflow-hidden">
              <div
                ref={leftScrollRef}
                onScroll={() => handleScroll("left")}
                className="h-full overflow-y-auto p-3"
              >
                <PeptidePreviewColumn
                  peptide={peptide as Record<string, any>}
                  changedFields={changedFields}
                  showHighlights={showHighlights}
                  onlyChanges={onlyChanges}
                  label="Página Atual"
                />
              </div>
            </div>

            {/* Right: Corrected */}
            <div className="flex-1 overflow-hidden">
              <div
                ref={rightScrollRef}
                onScroll={() => handleScroll("right")}
                className="h-full overflow-y-auto p-3"
              >
                {hasSuggestion && correctedPeptide ? (
                  <PeptidePreviewColumn
                    peptide={correctedPeptide as Record<string, any>}
                    changedFields={changedFields}
                    showHighlights={showHighlights}
                    onlyChanges={onlyChanges}
                    label="Página Corrigida"
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pb-2 mb-1">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Página Corrigida</p>
                    </div>
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                      {suggestionLoading ? (
                        <>
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-xs text-muted-foreground">Buscando dados nas integrações...</p>
                        </>
                      ) : (
                        <>
                          <SearchX className="h-10 w-10 text-muted-foreground/50" />
                          <div className="text-center max-w-xs">
                            <p className="text-sm font-medium text-foreground mb-1">Nenhuma sugestão automática disponível</p>
                            <p className="text-[11px] text-muted-foreground">
                              A página atual está à esquerda. Revise manualmente ou tente nova busca.
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setManualMode(true)}>
                              <Edit3 className="h-3 w-3" /> Editar manualmente
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => refetchSuggestion()}>
                              <RefreshCw className="h-3 w-3" /> Tentar nova busca
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Technical diff panel */}
            {showDiffPanel && hasSuggestion && (
              <aside className="w-72 shrink-0 border-l border-border bg-card/50 overflow-y-auto p-3">
                <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <FileCode className="h-3 w-3" /> Diff Técnico
                </h4>
                <div className="space-y-3 text-[10px]">
                  <div><span className="text-muted-foreground">Campo:</span><p className="text-foreground font-medium">{fieldLabel(suggestion!.field)}</p></div>
                  <div><span className="text-muted-foreground">Tipo:</span><p className="text-foreground font-medium">{suggestion!.changeType}</p></div>
                  <div><span className="text-muted-foreground">Fonte:</span><p className="text-primary font-medium">{suggestion!.sourceProvider}</p></div>
                  <div><span className="text-muted-foreground">Confiança:</span><p className="text-foreground font-medium">{suggestion!.confidenceScore}%</p></div>
                  <div className="border-t border-border pt-2">
                    <span className="text-muted-foreground">Valor anterior:</span>
                    <pre className="text-[9px] text-foreground whitespace-pre-wrap break-words mt-1 p-2 rounded bg-secondary/40 border border-border max-h-32 overflow-y-auto">
                      {suggestion!.oldValue != null ? (typeof suggestion!.oldValue === "string" ? suggestion!.oldValue : JSON.stringify(suggestion!.oldValue, null, 2)) : "null"}
                    </pre>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valor proposto:</span>
                    <pre className="text-[9px] text-foreground whitespace-pre-wrap break-words mt-1 p-2 rounded bg-emerald-400/5 border border-emerald-400/20 max-h-32 overflow-y-auto">
                      {suggestion!.proposedValue != null ? (typeof suggestion!.proposedValue === "string" ? suggestion!.proposedValue : JSON.stringify(suggestion!.proposedValue, null, 2)) : "null"}
                    </pre>
                  </div>
                  <div><span className="text-muted-foreground">Impacto:</span><p className="text-foreground">{suggestion!.impact}</p></div>
                </div>
              </aside>
            )}
          </div>
        ) : (
          /* ── Mobile: tabs ── */
          <div className="flex-1 overflow-hidden">
            <Tabs value={mobileTab} onValueChange={setMobileTab} className="h-full flex flex-col">
              <TabsList className="shrink-0 mx-3 mt-2">
                <TabsTrigger value="current" className="text-xs">Atual</TabsTrigger>
                <TabsTrigger value="corrected" className="text-xs">Corrigida</TabsTrigger>
                <TabsTrigger value="changes" className="text-xs">Alterações</TabsTrigger>
              </TabsList>
              <TabsContent value="current" className="flex-1 overflow-y-auto p-3" ref={leftScrollRef as any}>
                <PeptidePreviewColumn peptide={peptide as Record<string, any>} changedFields={changedFields} showHighlights={showHighlights} onlyChanges={false} label="Página Atual" />
              </TabsContent>
              <TabsContent value="corrected" className="flex-1 overflow-y-auto p-3" ref={rightScrollRef as any}>
                {hasSuggestion && correctedPeptide ? (
                  <PeptidePreviewColumn peptide={correctedPeptide as Record<string, any>} changedFields={changedFields} showHighlights={showHighlights} onlyChanges={false} label="Página Corrigida" />
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <SearchX className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground text-center">Sem sugestão automática</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="changes" className="flex-1 overflow-y-auto p-3">
                {changedFields.length > 0 ? changedFields.map((cf, idx) => {
                  const section = SECTION_MAP[cf.sectionId];
                  return section ? (
                    <div key={idx} className="p-3 rounded-lg border border-border bg-card mb-2">
                      <p className="text-xs font-bold text-foreground">{section.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{suggestion?.description}</p>
                    </div>
                  ) : null;
                }) : (
                  <p className="text-xs text-muted-foreground text-center py-8">Nenhuma alteração</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur-sm px-4 py-2.5 z-20">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Left actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground" onClick={goBackToAudit}>
              Cancelar
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] text-amber-400 hover:text-amber-300"
              onClick={() => ignoreMutation.mutate()} disabled={ignoreMutation.isPending}>
              <XCircle className="h-3 w-3 mr-1" /> Ignorar finding
            </Button>
            {hasSuggestion && (
              <Button variant="ghost" size="sm" className="h-7 text-[10px]"
                onClick={() => {
                  setManualMode(!manualMode);
                  if (!manualMode && suggestion) {
                    setManualValue(typeof suggestion.proposedValue === "string"
                      ? suggestion.proposedValue
                      : JSON.stringify(suggestion.proposedValue, null, 2));
                  }
                }}>
                <Edit3 className="h-3 w-3 mr-1" /> {manualMode ? "Voltar ao automático" : "Editar manualmente"}
              </Button>
            )}
            {!hasSuggestion && !suggestionLoading && (
              <>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setManualMode(true)}>
                  <Edit3 className="h-3 w-3" /> Editar manualmente
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => refetchSuggestion()}>
                  <RefreshCw className="h-3 w-3" /> Tentar nova busca
                </Button>
              </>
            )}
          </div>

          {/* Notes inline */}
          <div className="flex-1 max-w-xs">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas (opcional)..."
              className="w-full h-7 text-[10px] bg-secondary/40 border border-border rounded-md px-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Apply */}
          {(hasSuggestion || manualMode) && (
            <Button size="sm" className="h-8 text-[11px] gap-1"
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending || (!hasSuggestion && !manualValue)}>
              {applyMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Confirmar correção
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function tryParse(value: string): any {
  try { return JSON.parse(value); } catch { return value; }
}
