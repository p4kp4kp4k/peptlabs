import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2, XCircle, AlertTriangle, Loader2, ExternalLink,
  BookOpen, Beaker, ArrowRight, Shield, Sparkles, Clock, Edit3, History,
  SearchX, RefreshCw, Globe,
} from "lucide-react";
import { fieldLabel } from "./correctionEngine";
import { generateSuggestion, analyzeConflict, type Suggestion, type ConflictAnalysis } from "./suggestionEngine";
import SequenceDiffView from "./SequenceDiffView";

interface AuditFinding {
  id: string;
  audit_run_id: string;
  category: string;
  severity: string;
  title: string;
  description: string | null;
  source_a: string | null;
  source_b: string | null;
  value_a: string | null;
  value_b: string | null;
  recommendation: string | null;
  status: string;
  resolution_note: string | null;
  peptide_id?: string | null;
  peptides?: { name: string } | null;
}

interface CorrectionModalProps {
  finding: AuditFinding | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CorrectionModal({ finding, open, onOpenChange }: CorrectionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [manualMode, setManualMode] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [notes, setNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // Fetch full peptide data
  const { data: peptide } = useQuery({
    queryKey: ["peptide-for-correction", finding?.peptide_id],
    queryFn: async () => {
      if (!finding?.peptide_id) return null;
      const { data, error } = await supabase
        .from("peptides")
        .select("*")
        .eq("id", finding.peptide_id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!finding?.peptide_id && open,
  });

  // Generate real suggestion from integration data
  const { data: suggestion, isLoading: suggestionLoading, refetch: refetchSuggestion } = useQuery({
    queryKey: ["suggestion", finding?.id, finding?.peptide_id],
    queryFn: async (): Promise<Suggestion | null> => {
      if (!finding?.peptide_id || !peptide) return null;
      console.log("[CorrectionModal] Fetching suggestion for", finding.category);
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
    enabled: !!finding?.peptide_id && !!peptide && open,
  });

  // Fetch correction history
  const { data: history = [] } = useQuery({
    queryKey: ["correction-history", finding?.peptide_id],
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
    enabled: !!finding?.peptide_id && open,
  });

  // Apply correction mutation
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

      const { error: updateError } = await supabase
        .from("peptides")
        .update(updatePayload as any)
        .eq("id", finding.peptide_id!);
      if (updateError) throw updateError;

      const { data: correctionData, error: corrError } = await supabase
        .from("audit_corrections")
        .insert({
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
        } as any)
        .select("id")
        .single();
      if (corrError) throw corrError;

      const afterSnapshot: Record<string, any> = {};
      afterSnapshot[fieldName] = updatePayload[fieldName];

      await supabase.from("peptide_change_history").insert({
        peptide_id: finding.peptide_id,
        change_origin: "audit_correction",
        change_summary: suggestion.description,
        before_snapshot: beforeSnapshot,
        after_snapshot: afterSnapshot,
        correction_id: correctionData?.id,
        applied_at: new Date().toISOString(),
      } as any);

      await supabase
        .from("audit_findings")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
          resolution_note: `Correção aplicada: ${suggestion.changeType} em ${fieldLabel(fieldName)}${notes ? ` — ${notes}` : ""}`,
        })
        .eq("id", finding.id);
    },
    onSuccess: () => {
      toast({ title: "Correção aplicada", description: "Dados atualizados com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["audit-findings"] });
      queryClient.invalidateQueries({ queryKey: ["open-findings-count"] });
      queryClient.invalidateQueries({ queryKey: ["peptide-for-correction"] });
      queryClient.invalidateQueries({ queryKey: ["correction-history"] });
      queryClient.invalidateQueries({ queryKey: ["suggestion-availability"] });
      onOpenChange(false);
      setManualMode(false);
      setManualValue("");
      setNotes("");
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
      queryClient.invalidateQueries({ queryKey: ["open-findings-count"] });
      onOpenChange(false);
      setNotes("");
    },
  });

  if (!finding) return null;

  const severityColors: Record<string, string> = {
    critical: "text-red-400 bg-red-400/10 border-red-400/30",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    low: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  };

  const changeTypeLabels: Record<string, { label: string; color: string }> = {
    add: { label: "Adicionando", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
    replace: { label: "Substituindo", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
    merge: { label: "Mesclando", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
    remove: { label: "Removendo", color: "text-red-400 bg-red-400/10 border-red-400/30" },
    manual_assist: { label: "Revisão Manual", color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  };

  const confLabels: Record<string, string> = {
    high: "Alta Confiança",
    medium: "Média Confiança",
    low: "Baixa Confiança",
  };

  const confColors: Record<string, string> = {
    high: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    low: "text-red-400 bg-red-400/10 border-red-400/30",
  };

  const hasSuggestion = !!suggestion && suggestion.proposedValue !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Correção de Dados
          </DialogTitle>
          <DialogDescription className="sr-only">Modal de correção de finding de auditoria</DialogDescription>
        </DialogHeader>

        {/* ── Header Info ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-lg bg-secondary/40 border border-border/20">
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Peptídeo</p>
            <p className="text-xs font-semibold text-foreground">{finding.peptides?.name || "—"}</p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Finding</p>
            <Badge className={`text-[8px] ${severityColors[finding.severity] || ""}`}>{finding.category}</Badge>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Severidade</p>
            <Badge className={`text-[8px] ${severityColors[finding.severity] || ""}`}>{finding.severity}</Badge>
          </div>
          {hasSuggestion && (
            <>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Campo</p>
                <p className="text-xs font-medium text-foreground">{fieldLabel(suggestion!.field)}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Fonte</p>
                <p className="text-xs font-medium text-primary">{suggestion!.sourceProvider}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Confiança</p>
                <Badge className={`text-[8px] ${confColors[suggestion!.confidenceLevel]}`}>
                  <Sparkles className="h-2 w-2 mr-0.5" />{confLabels[suggestion!.confidenceLevel]}
                </Badge>
              </div>
            </>
          )}
        </div>

        {/* ── Loading state ── */}
        {suggestionLoading && (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Buscando dados nas integrações...</p>
          </div>
        )}

        {/* ── Source Context ── */}
        {!suggestionLoading && suggestion?.sourceContext && (
          <div className="p-3 rounded-lg bg-secondary/30 border border-border/20">
            <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Globe className="h-3 w-3" /> Contexto da Fonte
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-muted-foreground">Fonte global:</span>
                <p className="text-foreground font-medium flex items-center gap-1 mt-0.5">
                  {suggestion.sourceContext.globalSyncStatus === "success" ? (
                    <><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Sincronizada</>
                  ) : suggestion.sourceContext.globalSyncStatus === "error" ? (
                    <><XCircle className="h-3 w-3 text-destructive" /> Com erro</>
                  ) : (
                    <><Clock className="h-3 w-3 text-muted-foreground" /> Não sincronizada</>
                  )}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Resultado para este peptídeo:</span>
                <p className="text-foreground font-medium flex items-center gap-1 mt-0.5">
                  {suggestion.sourceContext.lookupStatus === "strong_match" ? (
                    <><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Correspondência encontrada</>
                  ) : (
                    <><AlertTriangle className="h-3 w-3 text-amber-400" /> Sem correspondência confiável</>
                  )}
                </p>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground mt-2 italic">{suggestion.sourceContext.lookupMessage}</p>
          </div>
        )}

        {/* ── No suggestion found ── */}
        {!suggestionLoading && !hasSuggestion && !manualMode && (() => {
          const conflictInfo = finding.category === "cross_source_conflict" && peptide
            ? analyzeConflict(
                { id: finding.id, category: finding.category, severity: finding.severity, peptide_id: finding.peptide_id || null, value_a: finding.value_a, value_b: finding.value_b, source_a: finding.source_a, source_b: finding.source_b, description: finding.description },
                peptide as Record<string, any>
              )
            : null;
          const noSuggestionMessage = conflictInfo
            ? conflictInfo.reason
            : "As fontes conectadas foram verificadas, mas não encontraram correspondência confiável para este peptídeo.";

          return (
            <div className="text-center py-8 space-y-3">
              <SearchX className="h-10 w-10 text-muted-foreground mx-auto" />
              <div>
                <p className="text-sm font-medium text-foreground">Nenhuma sugestão automática disponível</p>
                <p className="text-[11px] text-muted-foreground mt-1">{noSuggestionMessage}</p>
                {conflictInfo && conflictInfo.subtype !== "sequence_conflict_comparable" && (
                  <Badge className="mt-2 text-[8px] text-amber-400 bg-amber-400/10 border-amber-400/30">
                    {conflictInfo.subtype === "sequence_missing_internal" && "Sequência ausente no PeptLabs"}
                    {conflictInfo.subtype === "sequence_missing_external" && "Sequência ausente na fonte externa"}
                    {conflictInfo.subtype === "non_sequence_conflict" && "Conflito não-sequencial"}
                    {conflictInfo.subtype === "no_data_available" && "Sem dados comparáveis"}
                    {conflictInfo.subtype === "low_confidence_match" && "Match insuficiente"}
                  </Badge>
                )}
              </div>
              <div className="flex justify-center gap-2 pt-2">
                <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1" onClick={() => setManualMode(true)}>
                  <Edit3 className="h-3 w-3" /> Editar manualmente
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1" onClick={() => refetchSuggestion()}>
                  <RefreshCw className="h-3 w-3" /> Tentar nova busca
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-[11px] text-amber-400 gap-1" onClick={() => ignoreMutation.mutate()} disabled={ignoreMutation.isPending}>
                  <XCircle className="h-3 w-3" /> Ignorar
                </Button>
              </div>
            </div>
          );
        })()}

        {/* ── Suggestion found: show details ── */}
        {!suggestionLoading && hasSuggestion && (
          <>
            {/* Block 1: Summary */}
            <div className="p-3 rounded-lg border border-border/20 bg-primary/5">
              <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" /> Resumo da Correção
              </h4>
              <p className="text-xs text-muted-foreground">{suggestion!.description}</p>
              <p className="text-[10px] text-primary mt-1">{suggestion!.impact}</p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Badge className={`text-[8px] ${changeTypeLabels[suggestion!.changeType]?.color || ""}`}>
                  {changeTypeLabels[suggestion!.changeType]?.label}
                </Badge>
                <Badge className={`text-[8px] ${confColors[suggestion!.confidenceLevel]}`}>
                  Score: {suggestion!.confidenceScore}%
                </Badge>
              </div>
              {suggestion!.requiresManualReview && (
                <div className="mt-2 p-2 rounded bg-amber-400/10 border border-amber-400/20">
                  <p className="text-[10px] text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Este tipo de correção requer revisão manual
                  </p>
                </div>
              )}
            </div>

            {/* Block 2: Before × After */}
            <div>
              <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ArrowRight className="h-3 w-3 text-primary" /> Antes × Depois
              </h4>

              {/* Sequence Diff Engine — only when both sequences are valid and comparable */}
              {suggestion!.field === "sequence" && !manualMode && suggestion!.oldValue && suggestion!.proposedValue
                && typeof suggestion!.oldValue === "string" && typeof suggestion!.proposedValue === "string"
                && suggestion!.oldValue.length >= 3 && suggestion!.proposedValue.length >= 3
                && /^[A-Za-z\-]+$/.test(suggestion!.oldValue) && /^[A-Za-z\-]+$/.test(suggestion!.proposedValue)
                && (!suggestion!.previewData?.conflictAnalysis || suggestion!.previewData.conflictAnalysis.canDiff) && (
                <SequenceDiffView
                  seqA={suggestion!.oldValue}
                  seqB={suggestion!.proposedValue}
                  labelA="PeptLabs"
                  labelB={suggestion!.sourceProvider || "Fonte Externa"}
                />
              )}

              {/* Conflict explanation when diff is not possible */}
              {suggestion!.field === "sequence" && !manualMode
                && suggestion!.previewData?.conflictAnalysis
                && !suggestion!.previewData.conflictAnalysis.canDiff && (
                <div className="p-3 rounded-lg bg-amber-400/5 border border-amber-400/20 space-y-1.5">
                  <p className="text-[10px] font-medium text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-3 w-3" />
                    Comparação de sequência indisponível
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {suggestion!.previewData.conflictAnalysis.reason}
                  </p>
                  <Badge className="text-[8px] text-amber-400 bg-amber-400/10 border-amber-400/30">
                    {suggestion!.previewData.conflictAnalysis.subtype.replace(/_/g, " ")}
                  </Badge>
                </div>
              )}

              {/* Standard before/after for non-sequence or when one side is empty */}
              {(suggestion!.field !== "sequence" || manualMode || !suggestion!.oldValue || !suggestion!.proposedValue) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <p className="text-[9px] font-bold text-destructive uppercase tracking-wider mb-1.5">Antes</p>
                    <ValueDisplay value={suggestion!.oldValue} field={suggestion!.field} />
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-400/5 border border-emerald-400/20">
                    <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">Depois</p>
                    {manualMode ? (
                      <Textarea
                        value={manualValue}
                        onChange={(e) => setManualValue(e.target.value)}
                        placeholder="Digite o valor corrigido..."
                        className="text-xs min-h-[80px] bg-transparent border-emerald-400/20"
                      />
                    ) : (
                      <ValueDisplay value={suggestion!.proposedValue} field={suggestion!.field} isNew />
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Block 3: Preview */}
            {!manualMode && (
              <div>
                <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3 text-primary" /> Pré-visualização na Página
                </h4>
                <div className="rounded-xl border border-border/25 bg-card/80 p-4 overflow-hidden">
                  <FieldPreview
                    field={suggestion!.field}
                    value={suggestion!.proposedValue}
                    peptide={peptide}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Manual mode without suggestion ── */}
        {!suggestionLoading && !hasSuggestion && manualMode && (
          <div>
            <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-2">
              Edição Manual
            </h4>
            <p className="text-[10px] text-muted-foreground mb-2">
              Campo: <span className="text-foreground font-medium">{finding.category}</span>
            </p>
            <Textarea
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              placeholder="Digite o valor corrigido em formato JSON ou texto..."
              className="text-xs min-h-[120px]"
            />
          </div>
        )}

        {/* ── Notes ── */}
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Notas (opcional)</p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observações sobre esta correção..."
            className="text-xs min-h-[50px]"
          />
        </div>

        {/* ── History Toggle ── */}
        {history.length > 0 && (
          <div>
            <Button
              variant="ghost" size="sm"
              className="text-[10px] text-muted-foreground h-6 px-2 gap-1"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="h-3 w-3" />
              {showHistory ? "Ocultar histórico" : `Ver histórico (${history.length})`}
            </Button>
            {showHistory && (
              <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                {history.map((h: any) => (
                  <div key={h.id} className="p-2 rounded bg-secondary/40 border border-border/15 text-[10px]">
                    <p className="text-foreground font-medium">{h.change_summary || "Alteração"}</p>
                    <p className="text-muted-foreground">{new Date(h.applied_at).toLocaleString("pt-BR")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-border/20">
          <div className="flex gap-2 flex-wrap">
            <Button variant="ghost" size="sm" className="h-8 text-[11px] text-muted-foreground"
              onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-[11px] text-amber-400 hover:text-amber-300"
              onClick={() => ignoreMutation.mutate()} disabled={ignoreMutation.isPending}>
              <XCircle className="h-3 w-3 mr-1" /> Ignorar finding
            </Button>
            {hasSuggestion && (
              <Button variant="ghost" size="sm" className="h-8 text-[11px]"
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
          </div>
          {(hasSuggestion || manualMode) && (
            <Button size="sm" className="h-8 text-[11px]"
              onClick={() => applyMutation.mutate()}
              disabled={applyMutation.isPending || (!hasSuggestion && !manualValue)}>
              {applyMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              )}
              Confirmar correção
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Value Display ──

function ValueDisplay({ value, field, isNew }: { value: any; field: string; isNew?: boolean }) {
  if (value === null || value === undefined) {
    return <p className="text-[10px] text-muted-foreground italic">Vazio / Não definido</p>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <p className="text-[10px] text-muted-foreground italic">Lista vazia</p>;

    // Special rendering for references
    if (field === "scientific_references" && typeof value[0] === "object") {
      return (
        <div className="space-y-1">
          {value.slice(0, 5).map((ref: any, i: number) => (
            <div key={i} className="text-[10px] text-foreground p-1.5 rounded bg-secondary/30 space-y-0.5">
              <p className="font-medium">{ref.title || ref.titulo}</p>
              <p className="text-muted-foreground text-[9px]">
                {ref.source || ref.journal || ref.fonte} · {ref.year || ref.ano}
                {ref.pmid && <span className="text-primary ml-1">PMID: {ref.pmid}</span>}
              </p>
            </div>
          ))}
          {value.length > 5 && (
            <p className="text-[9px] text-muted-foreground">+{value.length - 5} referências</p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {value.slice(0, 5).map((item, i) => (
          <div key={i} className="text-[10px] text-foreground p-1 rounded bg-secondary/30">
            {typeof item === "object" ? JSON.stringify(item) : String(item)}
          </div>
        ))}
        {value.length > 5 && (
          <p className="text-[9px] text-muted-foreground">+{value.length - 5} itens</p>
        )}
      </div>
    );
  }

  if (typeof value === "object") {
    return <pre className="text-[9px] text-foreground whitespace-pre-wrap break-words">{JSON.stringify(value, null, 2)}</pre>;
  }

  const str = String(value);
  if (str.length > 200) {
    return <p className="text-[10px] text-foreground break-words">{str.slice(0, 200)}…</p>;
  }
  return <p className="text-[10px] text-foreground break-words">{str}</p>;
}

// ── Field Preview (renders like the actual page) ──

function FieldPreview({ field, value, peptide }: { field: string; value: any; peptide: any }) {
  switch (field) {
    case "scientific_references":
      return <ReferencesPreview refs={value} />;
    case "sequence":
      // If peptide already has a sequence, show diff; otherwise simple preview
      if (peptide?.sequence && value && peptide.sequence !== value) {
        return (
          <SequenceDiffView
            seqA={peptide.sequence}
            seqB={typeof value === "string" ? value : null}
            labelA="Atual"
            labelB="Proposta"
          />
        );
      }
      return <SequencePreview sequence={value} />;
    case "description":
    case "mechanism":
      return <TextPreview text={value} label={fieldLabel(field)} />;
    case "benefits":
      return <BenefitsPreview benefits={value} />;
    case "dosage_info":
      return <TextPreview text={value} label="Informações de Dosagem" />;
    case "mechanism_points":
      return <MechanismPointsPreview points={value} />;
    case "source_origins":
      return <SourceOriginsPreview origins={value} />;
    case "slug":
      return <SlugPreview oldSlug={peptide?.slug} newSlug={value} />;
    default:
      return <ValueDisplay value={value} field={field} isNew />;
  }
}

// ── Preview Components ──

function ReferencesPreview({ refs }: { refs: any }) {
  const list = Array.isArray(refs) ? refs : [];
  if (list.length === 0) return <p className="text-[10px] text-muted-foreground italic">Sem referências</p>;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
          <BookOpen className="h-3.5 w-3.5" />
        </div>
        Referências Científicas ({list.length})
      </h3>
      {list.map((ref: any, i: number) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border/15 group">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold mt-0.5">
            {i + 1}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground font-semibold leading-relaxed mb-0.5">{ref.titulo || ref.title}</p>
            <p className="text-[11px] text-muted-foreground">
              {ref.fonte || ref.source || ref.journal} · <span className="text-muted-foreground/70">{ref.ano || ref.year}</span>
              {ref.pmid && (
                <> · <span className="text-primary">PMID: {ref.pmid} <ExternalLink className="h-2.5 w-2.5 inline" /></span></>
              )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SequencePreview({ sequence }: { sequence: string }) {
  if (!sequence) return <p className="text-[10px] text-muted-foreground italic">Sem sequência</p>;
  return (
    <div>
      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Beaker className="h-3.5 w-3.5" />
        </div>
        Sequência Peptídica
      </h3>
      <div className="p-3 rounded-lg bg-secondary/40 border border-border/15 font-mono text-xs text-foreground break-all leading-relaxed">
        {sequence}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5">{sequence.length} caracteres</p>
    </div>
  );
}

function TextPreview({ text, label }: { text: string; label: string }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-foreground mb-2">{label}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function BenefitsPreview({ benefits }: { benefits: string[] }) {
  if (!benefits?.length) return null;
  return (
    <div>
      <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </div>
        Benefícios
      </h3>
      <div className="space-y-1.5">
        {benefits.map((b, i) => (
          <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-secondary/40 border border-border/10">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-400 text-[9px] font-bold mt-0.5">✓</span>
            <span className="text-[11px] text-muted-foreground leading-relaxed">{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MechanismPointsPreview({ points }: { points: string[] }) {
  if (!points?.length) return null;
  return (
    <div>
      <h3 className="text-sm font-bold text-foreground mb-3">Mecanismos de Ação</h3>
      <div className="space-y-2">
        {points.map((point, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border/15">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold mt-0.5">
              {i + 1}
            </span>
            <span className="text-xs text-muted-foreground leading-relaxed">{point}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SourceOriginsPreview({ origins }: { origins: string[] }) {
  if (!origins?.length) return null;
  return (
    <div>
      <h3 className="text-sm font-bold text-foreground mb-2">Origens Verificáveis</h3>
      <div className="flex flex-wrap gap-1.5">
        {origins.map((o) => (
          <Badge key={o} variant="outline" className="text-[10px] border-border text-muted-foreground font-normal px-2 py-0.5">
            {o}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function SlugPreview({ oldSlug, newSlug }: { oldSlug: string; newSlug: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-foreground mb-2">URL / Slug</h3>
      <div className="p-2 rounded bg-secondary/40 border border-border/15">
        <p className="text-[10px] text-muted-foreground">Atual: <code className="text-destructive">/peptides/{oldSlug}</code></p>
        <p className="text-[10px] text-muted-foreground mt-1">Novo: <code className="text-emerald-400">/peptides/{newSlug}</code></p>
      </div>
    </div>
  );
}

function tryParse(str: string): any {
  try { return JSON.parse(str); } catch { return str; }
}
