/**
 * BulkApplyModal
 * ==============
 * Complete bulk apply system with preview, confirmation, execution, and revert.
 * Handles intelligent priority rules, confidence filtering, and full traceability.
 */
import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CheckCircle2, Loader2, AlertTriangle, Play, RotateCcw, Shield,
  Database, BookOpen, FlaskConical, Globe, Filter, XCircle, Zap,
  FileText, ArrowRight, Clock, Download
} from "lucide-react";
import { calculateConfidence, scoreToLevel, levelLabel, levelColor, type ConfidenceResult, type Decision } from "../corrections/confidenceEngine";
// ── Types ──

interface BulkCandidate {
  findingId: string;
  peptideId: string;
  peptideName: string;
  category: string;
  severity: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  sourceProvider: string | null;
  sourceReference: string | null;
  confidenceScore: number;
  isEligible: boolean;
  skipReason: string | null;
  decision: Decision;
  confidenceAnalysis: ConfidenceResult | null;
}

interface BulkSummary {
  totalCandidates: number;
  eligible: number;
  skipped: number;
  byField: Record<string, number>;
  bySource: Record<string, number>;
  byAction: { add: number; replace: number; merge: number };
  confidenceThreshold: number;
  priorityMode: string;
}

interface BulkRunResult {
  runId: string;
  applied: number;
  skipped: number;
  items: {
    peptideName: string;
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
    sourceProvider: string | null;
    confidenceScore: number;
    actionTaken: string;
    skipReason: string | null;
  }[];
}

type ModalStep = "preview" | "executing" | "report";

// ── Priority Rules ──

const FIELD_PRIORITY: Record<string, string[]> = {
  sequence: ["UniProt", "PDB", "DRAMP", "APD", "Peptipedia"],
  scientific_references: ["PubMed", "Crossref"],
  structure_info: ["PDB", "UniProt"],
  regulatory: ["openFDA"],
  mechanism: ["internal", "PubMed", "UniProt"],
  benefits: ["internal", "PubMed"],
  description: ["internal", "PubMed", "UniProt"],
  source_origins: ["UniProt", "PDB", "PubMed"],
};

const UNSAFE_CATEGORIES = new Set(["cross_source_conflict", "multi_source"]);
const UNSAFE_FIELDS = new Set(["sequence"]); // sequence replace requires manual review
const REGULATORY_FIELDS = new Set(["regulatory", "side_effects"]);

function evaluateEligibility(
  finding: any,
  confidenceThreshold: number
): { eligible: boolean; skipReason: string | null; confidence: number; fieldName: string; decision: Decision; analysis: ConfidenceResult } {
  const category = finding.category;
  const severity = finding.severity;
  const fieldName = extractFieldName(category, finding.description);

  // Use the Confidence Engine for real scoring
  const analysis = calculateConfidence({
    fieldName,
    sourceProvider: finding.source_b || "Unknown",
    changeType: !finding.value_a && finding.value_b ? "add" : "replace",
    severity,
    matchStrength: 0.75,
    currentValueExists: !!finding.value_a,
    hasConflict: UNSAFE_CATEGORIES.has(category),
    conflictSeverity: UNSAFE_CATEGORIES.has(category)
      ? severity === "critical" ? "critical" : "major"
      : "none",
    crossSourceAgreement: UNSAFE_CATEGORIES.has(category) ? 0.3 : 0.6,
    dataCompleteness: finding.value_b ? Math.min(1, (finding.value_b.length || 10) / 100) : 0.3,
  });

  // No proposed value → skip
  if (!finding.value_b) {
    return {
      eligible: false,
      skipReason: "Sem valor sugerido disponível",
      confidence: Math.round(analysis.score * 100),
      fieldName,
      decision: "blocked",
      analysis,
    };
  }

  // Use the engine's decision, but also check against the slider threshold
  const scorePercent = Math.round(analysis.score * 100);
  
  if (analysis.decision === "blocked") {
    return {
      eligible: false,
      skipReason: analysis.blockedReason || "Bloqueado pelo motor de confiança",
      confidence: scorePercent,
      fieldName,
      decision: "blocked",
      analysis,
    };
  }

  if (analysis.decision === "manual_review") {
    return {
      eligible: false,
      skipReason: analysis.blockedReason || `Revisão manual requerida (${analysis.reasoning.slice(0, 80)})`,
      confidence: scorePercent,
      fieldName,
      decision: "manual_review",
      analysis,
    };
  }

  // auto_apply from engine, but also check slider threshold
  if (scorePercent < confidenceThreshold) {
    return {
      eligible: false,
      skipReason: `Confiança ${scorePercent}% abaixo do limiar ${confidenceThreshold}%`,
      confidence: scorePercent,
      fieldName,
      decision: "manual_review",
      analysis,
    };
  }

  return { eligible: true, skipReason: null, confidence: scorePercent, fieldName, decision: "auto_apply", analysis };
}

function extractFieldName(category: string, description: string | null): string {
  const categoryFieldMap: Record<string, string> = {
    missing_sequence: "sequence",
    no_references: "scientific_references",
    incomplete_data: "description",
    no_source: "source_origins",
    no_protocol: "protocol_phases",
    data_inconsistency: "slug",
    cross_source_conflict: "unknown",
    multi_source: "unknown",
  };

  if (categoryFieldMap[category]) return categoryFieldMap[category];

  // Try to detect from description
  if (description) {
    const fields = ["mechanism", "benefits", "dosage_info", "description", "half_life", "classification"];
    for (const f of fields) {
      if (description.toLowerCase().includes(f)) return f;
    }
  }

  return "unknown";
}

// ── Field Labels ──

const FIELD_LABELS: Record<string, string> = {
  sequence: "Sequência",
  scientific_references: "Referências",
  source_origins: "Origens",
  mechanism: "Mecanismo",
  benefits: "Benefícios",
  description: "Descrição",
  dosage_info: "Dosagem",
  protocol_phases: "Protocolos",
  slug: "Slug",
  half_life: "Meia-Vida",
  classification: "Classificação",
  structure_info: "Estrutura",
  unknown: "Outro",
};

// ── Component ──

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BulkApplyModal({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<ModalStep>("preview");
  const [confidenceThreshold, setConfidenceThreshold] = useState(75);
  const [result, setResult] = useState<BulkRunResult | null>(null);
  const [fieldFilter, setFieldFilter] = useState<string>("all");

  // Load open findings with peptide data
  const { data: findings = [], isLoading } = useQuery({
    queryKey: ["bulk-apply-findings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_findings")
        .select("*, peptides(id, name, slug, sequence, source_origins)")
        .eq("status", "open")
        .order("severity", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Evaluate all candidates
  const candidates: BulkCandidate[] = useMemo(() => {
    return findings
      .filter((f: any) => f.peptide_id && f.peptides)
      .map((f: any) => {
        const evaluation = evaluateEligibility(f, confidenceThreshold);
        return {
          findingId: f.id,
          peptideId: f.peptide_id,
          peptideName: f.peptides?.name || "—",
          category: f.category,
          severity: f.severity,
          fieldName: evaluation.fieldName,
          oldValue: f.value_a,
          newValue: f.value_b,
          sourceProvider: f.source_b,
          sourceReference: null,
          confidenceScore: evaluation.confidence,
          isEligible: evaluation.eligible,
          skipReason: evaluation.skipReason,
          decision: evaluation.decision,
          confidenceAnalysis: evaluation.analysis,
        };
      });
  }, [findings, confidenceThreshold]);

  // Summary
  const summary: BulkSummary = useMemo(() => {
    const eligible = candidates.filter(c => c.isEligible);
    const skipped = candidates.filter(c => !c.isEligible);

    const byField: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    let addCount = 0, replaceCount = 0, mergeCount = 0;

    eligible.forEach(c => {
      byField[c.fieldName] = (byField[c.fieldName] || 0) + 1;
      const src = c.sourceProvider || "Interno";
      bySource[src] = (bySource[src] || 0) + 1;
      if (!c.oldValue) addCount++;
      else if (c.category === "no_references") mergeCount++;
      else replaceCount++;
    });

    return {
      totalCandidates: candidates.length,
      eligible: eligible.length,
      skipped: skipped.length,
      byField,
      bySource,
      byAction: { add: addCount, replace: replaceCount, merge: mergeCount },
      confidenceThreshold,
      priorityMode: "confidence_then_recency",
    };
  }, [candidates, confidenceThreshold]);

  // Filtered view
  const filteredCandidates = useMemo(() => {
    if (fieldFilter === "all") return candidates;
    if (fieldFilter === "eligible") return candidates.filter(c => c.isEligible);
    if (fieldFilter === "skipped") return candidates.filter(c => !c.isEligible);
    return candidates.filter(c => c.fieldName === fieldFilter);
  }, [candidates, fieldFilter]);

  // Execute bulk apply
  const applyMutation = useMutation({
    mutationFn: async () => {
      setStep("executing");
      const eligible = candidates.filter(c => c.isEligible);
      if (eligible.length === 0) throw new Error("Nenhum item elegível");

      // Create bulk run
      const { data: { user } } = await supabase.auth.getUser();
      const { data: run, error: runError } = await supabase
        .from("bulk_update_runs")
        .insert({
          triggered_by: user?.id || null,
          confidence_threshold: confidenceThreshold,
          source_priority_mode: "confidence_then_recency",
          status: "running",
        })
        .select()
        .single();
      if (runError) throw runError;

      const items: BulkRunResult["items"] = [];
      let appliedCount = 0;
      let skippedCount = 0;

      // Process each eligible item
      for (const candidate of eligible) {
        try {
          // Apply the change to peptides table
          const update: Record<string, any> = {};
          const field = candidate.fieldName;

          if (field === "scientific_references" || candidate.category === "no_references") {
            // References → insert to peptide_references table
            if (candidate.newValue) {
              await supabase.from("peptide_references").insert({
                peptide_id: candidate.peptideId,
                title: candidate.newValue.slice(0, 255),
                source: candidate.sourceProvider || "bulk-update",
              });
            }
          } else if (field === "source_origins") {
            // Merge source origins
            const { data: pep } = await supabase
              .from("peptides")
              .select("source_origins")
              .eq("id", candidate.peptideId)
              .single();
            const current = (pep?.source_origins as string[]) || [];
            const newOrigins = candidate.newValue ? [candidate.newValue] : [];
            const merged = [...new Set([...current, ...newOrigins])];
            update.source_origins = merged;
          } else if (field !== "unknown") {
            update[field] = candidate.newValue;
          }

          if (Object.keys(update).length > 0) {
            update.updated_at = new Date().toISOString();
            update.last_synced_at = new Date().toISOString();
            const { error: updateErr } = await supabase
              .from("peptides")
              .update(update as any)
              .eq("id", candidate.peptideId);
            if (updateErr) throw updateErr;
          }

          // Record in bulk_update_items
          await supabase.from("bulk_update_items").insert({
            run_id: run.id,
            peptide_id: candidate.peptideId,
            finding_id: candidate.findingId,
            field_name: field,
            old_value: candidate.oldValue,
            new_value: candidate.newValue,
            source_provider: candidate.sourceProvider,
            confidence_score: candidate.confidenceScore,
            action_taken: "applied",
          });

          // Record in peptide_change_history
          await supabase.from("peptide_change_history").insert({
            peptide_id: candidate.peptideId,
            change_origin: "bulk_update",
            change_summary: `Bulk update: ${field} via ${candidate.sourceProvider || "auto"}`,
            before_snapshot: { [field]: candidate.oldValue },
            after_snapshot: { [field]: candidate.newValue },
            applied_by: user?.id || null,
          });

          // Mark finding as resolved
          await supabase
            .from("audit_findings")
            .update({
              status: "resolved",
              resolved_at: new Date().toISOString(),
              resolved_by: user?.id || null,
              resolution_note: `Resolvido via bulk update (run: ${run.id.slice(0, 8)})`,
            })
            .eq("id", candidate.findingId);

          appliedCount++;
          items.push({
            peptideName: candidate.peptideName,
            fieldName: field,
            oldValue: candidate.oldValue,
            newValue: candidate.newValue,
            sourceProvider: candidate.sourceProvider,
            confidenceScore: candidate.confidenceScore,
            actionTaken: "applied",
            skipReason: null,
          });
        } catch (err: any) {
          skippedCount++;
          items.push({
            peptideName: candidate.peptideName,
            fieldName: candidate.fieldName,
            oldValue: candidate.oldValue,
            newValue: candidate.newValue,
            sourceProvider: candidate.sourceProvider,
            confidenceScore: candidate.confidenceScore,
            actionTaken: "error",
            skipReason: err.message,
          });
        }
      }

      // Also record skipped items
      const skippedItems = candidates.filter(c => !c.isEligible);
      for (const s of skippedItems) {
        await supabase.from("bulk_update_items").insert({
          run_id: run.id,
          peptide_id: s.peptideId,
          finding_id: s.findingId,
          field_name: s.fieldName,
          old_value: s.oldValue,
          new_value: s.newValue,
          source_provider: s.sourceProvider,
          confidence_score: s.confidenceScore,
          action_taken: "skipped",
          skip_reason: s.skipReason,
        });
      }

      // Update run
      await supabase.from("bulk_update_runs").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        applied_count: appliedCount,
        skipped_count: skippedCount + skippedItems.length,
        summary: {
          byField: summary.byField,
          bySource: summary.bySource,
          confidenceThreshold,
        },
      }).eq("id", run.id);

      return { runId: run.id, applied: appliedCount, skipped: skippedCount + skippedItems.length, items };
    },
    onSuccess: (data) => {
      setResult(data);
      setStep("report");
      queryClient.invalidateQueries({ queryKey: ["audit-findings"] });
      queryClient.invalidateQueries({ queryKey: ["open-findings-count"] });
      queryClient.invalidateQueries({ queryKey: ["peptides"] });
      toast({ title: "Aplicação em lote concluída", description: `${data.applied} alterações aplicadas` });
    },
    onError: (err: any) => {
      setStep("preview");
      toast({ title: "Erro na aplicação", description: err.message, variant: "destructive" });
    },
  });

  // Revert mutation
  const revertMutation = useMutation({
    mutationFn: async (runId: string) => {
      const { data: items, error } = await supabase
        .from("bulk_update_items")
        .select("*")
        .eq("run_id", runId)
        .eq("action_taken", "applied")
        .eq("was_reverted", false);
      if (error) throw error;
      if (!items?.length) throw new Error("Nenhum item para reverter");

      const { data: { user } } = await supabase.auth.getUser();

      for (const item of items) {
        if (!item.peptide_id || !item.field_name) continue;

        // Restore old value
        if (item.field_name !== "scientific_references") {
          const update: Record<string, any> = {
            [item.field_name]: item.old_value,
            updated_at: new Date().toISOString(),
          };
          await supabase.from("peptides").update(update as any).eq("id", item.peptide_id);
        }

        // Mark as reverted
        await supabase.from("bulk_update_items")
          .update({ was_reverted: true, action_taken: "reverted" })
          .eq("id", item.id);

        // Record in history
        await supabase.from("peptide_change_history").insert({
          peptide_id: item.peptide_id,
          change_origin: "bulk_revert",
          change_summary: `Revertido: ${item.field_name} (run: ${runId.slice(0, 8)})`,
          before_snapshot: { [item.field_name]: item.new_value },
          after_snapshot: { [item.field_name]: item.old_value },
          applied_by: user?.id || null,
        });

        // Reopen finding if exists
        if (item.finding_id) {
          await supabase.from("audit_findings")
            .update({ status: "open", resolved_at: null, resolved_by: null, resolution_note: null })
            .eq("id", item.finding_id);
        }
      }

      // Mark run as reverted
      await supabase.from("bulk_update_runs")
        .update({ reverted_at: new Date().toISOString(), status: "reverted" })
        .eq("id", runId);

      return items.length;
    },
    onSuccess: (count) => {
      toast({ title: "Reversão concluída", description: `${count} alterações revertidas` });
      queryClient.invalidateQueries({ queryKey: ["audit-findings"] });
      queryClient.invalidateQueries({ queryKey: ["peptides"] });
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ title: "Erro na reversão", description: err.message, variant: "destructive" });
    },
  });

  const handleClose = () => {
    if (step !== "executing") {
      setStep("preview");
      setResult(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-card border-border/60">
        {step === "preview" && (
          <PreviewStep
            summary={summary}
            candidates={filteredCandidates}
            allCandidates={candidates}
            fieldFilter={fieldFilter}
            setFieldFilter={setFieldFilter}
            confidenceThreshold={confidenceThreshold}
            setConfidenceThreshold={setConfidenceThreshold}
            isLoading={isLoading}
            onApply={() => applyMutation.mutate()}
            onClose={handleClose}
          />
        )}
        {step === "executing" && <ExecutingStep />}
        {step === "report" && result && (
          <ReportStep
            result={result}
            onRevert={() => revertMutation.mutate(result.runId)}
            isReverting={revertMutation.isPending}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Preview Step ──

function PreviewStep({
  summary, candidates, allCandidates, fieldFilter, setFieldFilter,
  confidenceThreshold, setConfidenceThreshold, isLoading, onApply, onClose,
}: {
  summary: BulkSummary;
  candidates: BulkCandidate[];
  allCandidates: BulkCandidate[];
  fieldFilter: string;
  setFieldFilter: (f: string) => void;
  confidenceThreshold: number;
  setConfidenceThreshold: (n: number) => void;
  isLoading: boolean;
  onApply: () => void;
  onClose: () => void;
}) {
  const fieldOptions = useMemo(() => {
    const fields = new Set(allCandidates.map(c => c.fieldName));
    return Array.from(fields).sort();
  }, [allCandidates]);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-base flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <Zap className="h-4 w-4 text-primary" />
          Pré-visualização — Aplicação em Massa
        </DialogTitle>
        <DialogDescription className="text-[11px]">
          Revise as alterações antes de aplicar. Apenas itens com confiança ≥ {confidenceThreshold}% serão aplicados.
        </DialogDescription>
      </DialogHeader>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="Total Analisados" value={summary.totalCandidates} icon={Database} color="text-foreground" />
            <SummaryCard label="Elegíveis" value={summary.eligible} icon={CheckCircle2} color="text-emerald-400" />
            <SummaryCard label="Pendentes (revisão)" value={summary.skipped} icon={AlertTriangle} color="text-amber-400" />
            <SummaryCard label="Limiar de Confiança" value={`${summary.confidenceThreshold}%`} icon={Shield} color="text-primary" />
          </div>

          {/* Stats by field and source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Card className="border-border/30 bg-secondary/20">
              <CardContent className="p-3">
                <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Por Campo</p>
                <div className="space-y-1.5">
                  {Object.entries(summary.byField).map(([field, count]) => (
                    <div key={field} className="flex items-center justify-between text-[11px]">
                      <span className="text-foreground">{FIELD_LABELS[field] || field}</span>
                      <Badge variant="outline" className="text-[9px]">{count}</Badge>
                    </div>
                  ))}
                  {Object.keys(summary.byField).length === 0 && (
                    <p className="text-[10px] text-muted-foreground">Nenhum item elegível</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-secondary/20">
              <CardContent className="p-3">
                <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Por Fonte</p>
                <div className="space-y-1.5">
                  {Object.entries(summary.bySource).map(([src, count]) => (
                    <div key={src} className="flex items-center justify-between text-[11px]">
                      <span className="text-foreground">{src}</span>
                      <Badge variant="outline" className="text-[9px]">{count}</Badge>
                    </div>
                  ))}
                  {Object.keys(summary.bySource).length === 0 && (
                    <p className="text-[10px] text-muted-foreground">Nenhum item elegível</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Confidence Threshold Slider */}
          <div className="flex items-center gap-3 px-1">
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">Confiança mínima:</span>
            <input
              type="range"
              min={50}
              max={95}
              step={5}
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="flex-1 h-1.5 accent-primary"
            />
            <Badge variant="outline" className="text-[10px] min-w-[40px] text-center">{confidenceThreshold}%</Badge>
          </div>

          {/* Filters */}
          <div className="flex gap-1 flex-wrap px-1">
            <FilterBtn active={fieldFilter === "all"} onClick={() => setFieldFilter("all")} label="Todos" count={allCandidates.length} />
            <FilterBtn active={fieldFilter === "eligible"} onClick={() => setFieldFilter("eligible")} label="Elegíveis" count={allCandidates.filter(c => c.isEligible).length} color="text-emerald-400" />
            <FilterBtn active={fieldFilter === "skipped"} onClick={() => setFieldFilter("skipped")} label="Pendentes" count={allCandidates.filter(c => !c.isEligible).length} color="text-amber-400" />
            {fieldOptions.map(f => (
              <FilterBtn key={f} active={fieldFilter === f} onClick={() => setFieldFilter(f)} label={FIELD_LABELS[f] || f} count={allCandidates.filter(c => c.fieldName === f).length} />
            ))}
          </div>

          {/* Items list */}
          <ScrollArea className="flex-1 min-h-0 max-h-[300px]">
            <div className="space-y-1.5 pr-3">
              {candidates.map((c) => {
                const lvl = c.confidenceAnalysis ? c.confidenceAnalysis.level : "low";
                const decisionLabel = c.decision === "auto_apply" ? "Auto" : c.decision === "manual_review" ? "Revisão" : "Bloqueado";
                const decisionColor = c.decision === "auto_apply" ? "text-emerald-400 border-emerald-400/30" : c.decision === "manual_review" ? "text-amber-400 border-amber-400/30" : "text-red-400 border-red-400/30";
                
                return (
                <div
                  key={c.findingId}
                  className={`p-2.5 rounded-lg border text-[11px] ${
                    c.isEligible
                      ? "border-emerald-400/20 bg-emerald-400/5"
                      : c.decision === "blocked"
                        ? "border-red-400/20 bg-red-400/5"
                        : "border-amber-400/20 bg-amber-400/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {c.isEligible ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                      ) : c.decision === "blocked" ? (
                        <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                      )}
                      <span className="font-medium text-foreground truncate">{c.peptideName}</span>
                      <Badge variant="outline" className="text-[8px] shrink-0">{FIELD_LABELS[c.fieldName] || c.fieldName}</Badge>
                      {c.sourceProvider && (
                        <Badge variant="outline" className="text-[8px] shrink-0">{c.sourceProvider}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className={`text-[8px] ${decisionColor}`}>
                        {decisionLabel}
                      </Badge>
                      <Badge variant="outline" className={`text-[8px] ${c.confidenceAnalysis ? levelColor(lvl) : ""}`}>
                        {c.confidenceScore}%
                      </Badge>
                    </div>
                  </div>
                  {c.skipReason && (
                    <p className="text-[9px] text-amber-400 mt-1 ml-5">{c.skipReason}</p>
                  )}
                  {c.confidenceAnalysis?.reasoning && (
                    <p className="text-[9px] text-muted-foreground mt-0.5 ml-5 truncate italic">
                      {c.confidenceAnalysis.reasoning.slice(0, 150)}
                    </p>
                  )}
                  {c.newValue && (
                    <p className="text-[9px] text-muted-foreground mt-1 ml-5 truncate">
                      → {c.newValue.slice(0, 120)}{c.newValue.length > 120 ? "…" : ""}
                    </p>
                  )}
                </div>
                );
              })}
              {candidates.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-8">Nenhum item encontrado</p>
              )}
            </div>
          </ScrollArea>
        </>
      )}

      <DialogFooter className="flex justify-between gap-2 pt-2 border-t border-border/30">
        <Button variant="ghost" size="sm" onClick={onClose} className="text-[11px]">
          Cancelar
        </Button>
        <Button
          size="sm"
          className="text-[11px] gap-1.5"
          disabled={summary.eligible === 0 || isLoading}
          onClick={onApply}
        >
          <Play className="h-3 w-3" />
          Aplicar {summary.eligible} alterações
        </Button>
      </DialogFooter>
    </>
  );
}

// ── Executing Step ──

function ExecutingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        Aplicando correções...
      </p>
      <p className="text-[10px] text-muted-foreground">Não feche esta janela</p>
    </div>
  );
}

// ── Report Step ──

function ReportStep({
  result, onRevert, isReverting, onClose,
}: {
  result: BulkRunResult;
  onRevert: () => void;
  isReverting: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"applied" | "skipped">("applied");
  const applied = result.items.filter(i => i.actionTaken === "applied");
  const skipped = result.items.filter(i => i.actionTaken !== "applied");

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-base flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          Relatório da Execução
        </DialogTitle>
        <DialogDescription className="text-[11px]">
          Run ID: {result.runId.slice(0, 8)}… — {result.applied} aplicadas, {result.skipped} pendentes
        </DialogDescription>
      </DialogHeader>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Aplicadas" value={result.applied} icon={CheckCircle2} color="text-emerald-400" />
        <SummaryCard label="Com Erro" value={result.items.filter(i => i.actionTaken === "error").length} icon={XCircle} color="text-red-400" />
        <SummaryCard label="Pendentes" value={skipped.length} icon={Clock} color="text-amber-400" />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex-1 min-h-0 flex flex-col">
        <TabsList className="h-8 bg-secondary/60 p-0.5">
          <TabsTrigger value="applied" className="text-[10px] gap-1 h-7 px-3 data-[state=active]:bg-card">
            <CheckCircle2 className="h-3 w-3" /> Aplicadas ({applied.length})
          </TabsTrigger>
          <TabsTrigger value="skipped" className="text-[10px] gap-1 h-7 px-3 data-[state=active]:bg-card">
            <AlertTriangle className="h-3 w-3" /> Pendentes ({skipped.length})
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 min-h-0 max-h-[350px] mt-2">
          <TabsContent value="applied" className="mt-0">
            <div className="space-y-1.5 pr-3">
              {applied.map((item, i) => (
                <div key={i} className="p-2.5 rounded-lg border border-emerald-400/20 bg-emerald-400/5 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span className="font-medium text-foreground truncate">{item.peptideName}</span>
                      <Badge variant="outline" className="text-[8px]">{FIELD_LABELS[item.fieldName] || item.fieldName}</Badge>
                      {item.sourceProvider && <Badge variant="outline" className="text-[8px]">{item.sourceProvider}</Badge>}
                    </div>
                    <Badge variant="outline" className="text-[8px] text-emerald-400 border-emerald-400/30">{item.confidenceScore}%</Badge>
                  </div>
                  {item.newValue && (
                    <p className="text-[9px] text-muted-foreground mt-1 ml-5 truncate">
                      {item.oldValue ? `${item.oldValue.slice(0, 50)}… → ` : "∅ → "}{item.newValue.slice(0, 80)}
                    </p>
                  )}
                </div>
              ))}
              {applied.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-8">Nenhuma alteração aplicada</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="skipped" className="mt-0">
            <div className="space-y-1.5 pr-3">
              {skipped.map((item, i) => (
                <div key={i} className="p-2.5 rounded-lg border border-amber-400/20 bg-amber-400/5 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                      <span className="font-medium text-foreground truncate">{item.peptideName}</span>
                      <Badge variant="outline" className="text-[8px]">{FIELD_LABELS[item.fieldName] || item.fieldName}</Badge>
                    </div>
                    <Badge variant="outline" className="text-[8px] text-amber-400 border-amber-400/30">
                      {item.actionTaken === "error" ? "Erro" : "Pendente"}
                    </Badge>
                  </div>
                  {item.skipReason && (
                    <p className="text-[9px] text-amber-400 mt-1 ml-5">{item.skipReason}</p>
                  )}
                </div>
              ))}
              {skipped.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-8">Nenhum item pendente</p>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <DialogFooter className="flex justify-between gap-2 pt-2 border-t border-border/30">
        <Button
          variant="outline"
          size="sm"
          className="text-[11px] gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={onRevert}
          disabled={isReverting || result.applied === 0}
        >
          {isReverting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
          Reverter tudo
        </Button>
        <Button size="sm" onClick={onClose} className="text-[11px]">
          Concluir
        </Button>
      </DialogFooter>
    </>
  );
}

// ── Shared Components ──

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: string }) {
  return (
    <Card className="border-border/30 bg-secondary/20">
      <CardContent className="p-3 flex items-center gap-3">
        <Icon className={`h-5 w-5 ${color} shrink-0`} />
        <div>
          <p className={`text-lg font-bold ${color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
          <p className="text-[9px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterBtn({ active, onClick, label, count, color }: { active: boolean; onClick: () => void; label: string; count: number; color?: string }) {
  return (
    <Button
      variant={active ? "default" : "ghost"}
      size="sm"
      className={`h-6 text-[9px] px-2 gap-1 ${!active && color ? color : ""}`}
      onClick={onClick}
    >
      {label}
      <span className="opacity-70">{count}</span>
    </Button>
  );
}
