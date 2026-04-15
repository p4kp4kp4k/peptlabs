/**
 * Suggestion Engine
 * =================
 * 1. Checks local DB tables (detected_changes, peptide_references) for existing data.
 * 2. If nothing found locally, calls the suggest-correction edge function
 *    which queries real external APIs (UniProt, PubMed).
 * 3. Records lookup results in peptide_source_checks for status tracking.
 */

import { supabase } from "@/integrations/supabase/client";
import { fieldLabel } from "./correctionEngine";
import { isNoChange, normalizeReferences, normalizeSequence } from "./noChangeFilter";
import { scoreSuggestion, type ConfidenceResult, type ConfidenceLevel, levelLabel } from "./confidenceEngine";

// ── Field mapping: external field names → valid DB columns ──
const FIELD_MAP: Record<string, string> = {
  adverse_events: "side_effects",
  regulatory_update: "side_effects",
};

const VALID_PEPTIDE_FIELDS = new Set([
  "name","slug","category","description","benefits","dosage_info","side_effects",
  "mechanism","classification","half_life","reconstitution","alternative_names",
  "timeline","dosage_table","protocol_phases","reconstitution_steps","mechanism_points",
  "interactions","stacks","scientific_references","goals","application","sequence",
  "sequence_length","organism","biological_activity","structure_info","source_origins",
  "confidence_score","ncbi_protein_id","dramp_id","apd_id","peptipedia_id",
  "tier","access_level","evidence_level",
]);

/** Map external field names to valid DB columns, skip invalid ones */
function mapField(raw: string): string | null {
  const mapped = FIELD_MAP[raw] || raw;
  return VALID_PEPTIDE_FIELDS.has(mapped) ? mapped : null;
}

export interface Suggestion {
  findingId: string;
  peptideId: string;
  field: string;
  oldValue: any;
  proposedValue: any;
  sourceProvider: string;
  sourceReference: string | null;
  confidenceScore: number;
  confidenceLevel: "high" | "medium" | "low";
  changeType: "add" | "replace" | "merge" | "remove" | "manual_assist";
  description: string;
  impact: string;
  previewData: any;
  requiresManualReview: boolean;
  noChangeReason?: string | null;
  /** Info about global source sync status */
  sourceContext?: SourceContext;
  /** Rich confidence analysis from the Confidence Engine */
  confidenceAnalysis?: ConfidenceResult;
}

export interface SourceContext {
  sourceProvider: string;
  globalSyncStatus: string | null;
  lastSyncAt: string | null;
  lookupStatus: string;
  lookupMessage: string;
}

interface FindingInput {
  id: string;
  category: string;
  severity: string;
  peptide_id: string | null;
  value_a: string | null;
  value_b: string | null;
  source_a: string | null;
  source_b: string | null;
  description: string | null;
}

// ── Source provider mapping by category ──

const CATEGORY_SOURCES: Record<string, string[]> = {
  missing_sequence: ["UniProt", "Peptipedia", "DRAMP", "APD"],
  no_references: ["PubMed"],
  no_source: ["UniProt", "PubMed", "Peptipedia"],
  incomplete_data: ["UniProt", "PubMed"],
  data_inconsistency: ["Internal"],
  cross_source_conflict: ["UniProt", "PubMed", "Peptipedia"],
};

// ── Conflict sub-classification ──

export type ConflictSubtype =
  | "sequence_conflict_comparable"
  | "sequence_missing_external"
  | "sequence_missing_internal"
  | "non_sequence_conflict"
  | "low_confidence_match"
  | "no_data_available";

export interface ConflictAnalysis {
  subtype: ConflictSubtype;
  canDiff: boolean;
  reason: string;
  seqA: string | null;
  seqB: string | null;
}

export function analyzeConflict(finding: FindingInput, peptide: Record<string, any>): ConflictAnalysis {
  const fieldName = finding.value_a !== null || finding.value_b !== null
    ? (finding.description?.match(/campo "(\w+)"/) || [])[1] || null
    : null;

  const isSequenceConflict = fieldName === "sequence"
    || finding.category === "cross_source_conflict" && (
      finding.value_a?.length > 10 || finding.value_b?.length > 10
    );

  if (!isSequenceConflict) {
    return {
      subtype: "non_sequence_conflict",
      canDiff: false,
      reason: "Este conflito não envolve sequências peptídicas — comparação de diff não aplicável.",
      seqA: null,
      seqB: null,
    };
  }

  const seqA = finding.value_a?.trim() || peptide.sequence?.trim() || null;
  const seqB = finding.value_b?.trim() || null;

  const isValidSeq = (s: string | null) => s && s.length >= 3 && /^[A-Za-z\-]+$/.test(s);

  if (!isValidSeq(seqA) && !isValidSeq(seqB)) {
    return {
      subtype: "no_data_available",
      canDiff: false,
      reason: "Nenhuma sequência válida disponível em nenhuma das fontes para comparação.",
      seqA: null,
      seqB: null,
    };
  }

  if (!isValidSeq(seqA)) {
    return {
      subtype: "sequence_missing_internal",
      canDiff: false,
      reason: "Sequência ausente no PeptLabs — não é possível gerar comparação.",
      seqA: null,
      seqB,
    };
  }

  if (!isValidSeq(seqB)) {
    return {
      subtype: "sequence_missing_external",
      canDiff: false,
      reason: `Nenhuma sequência confiável encontrada na fonte externa (${finding.source_b || "desconhecida"}).`,
      seqA,
      seqB: null,
    };
  }

  return {
    subtype: "sequence_conflict_comparable",
    canDiff: true,
    reason: "Duas sequências válidas encontradas — comparação disponível.",
    seqA,
    seqB,
  };
}

// ── Main entry point ──

export async function generateSuggestion(
  finding: FindingInput,
  peptide: Record<string, any>
): Promise<Suggestion | null> {
  if (!finding.peptide_id || !peptide) return null;

  console.log("[SuggestionEngine] Generating for", finding.category, peptide.name);

  // Step 1: Try local DB data
  let localResult: Suggestion | null = null;

  switch (finding.category) {
    case "missing_sequence":
      localResult = await suggestSequenceLocal(finding, peptide);
      break;
    case "no_references":
      localResult = await suggestReferencesLocal(finding, peptide);
      break;
    case "no_source":
      localResult = await suggestSourceOriginsLocal(finding, peptide);
      break;
    case "incomplete_data":
      localResult = await suggestIncompleteDataLocal(finding, peptide);
      break;
    case "data_inconsistency":
      return enrichWithSourceContext(suggestSlugFix(finding, peptide), finding);
    case "cross_source_conflict":
      localResult = await suggestCrossSourceConflict(finding, peptide);
      break;
    default:
      break;
  }

  if (localResult) {
    const noChange = isNoChange(localResult.field, localResult.oldValue, localResult.proposedValue);
    if (noChange.isNoChange) {
      console.log("[SuggestionEngine] NO_CHANGE detected for", finding.category, ":", noChange.reason);
      await recordLookupResult(finding.peptide_id!, localResult.sourceProvider, "no_change", 0, false);
      return enrichWithSourceContext({
        ...localResult,
        confidenceScore: 100,
        confidenceLevel: "high",
        noChangeReason: noChange.reason,
        description: `Sem alteração necessária em ${fieldLabel(localResult.field)}`,
        impact: "Os dados sugeridos já estão refletidos na página atual",
        requiresManualReview: false,
      }, finding);
    }
    console.log("[SuggestionEngine] Found local data for", finding.category);
    const enriched = applyConfidenceEngine(localResult);
    await recordLookupResult(finding.peptide_id!, enriched.sourceProvider, "strong_match", enriched.confidenceScore, true);
    return enrichWithSourceContext(enriched, finding);
  }

  console.log("[SuggestionEngine] No local data, calling external APIs...");
  const externalResult = await callExternalSuggestion(finding, peptide);

  if (externalResult) {
    const noChange = isNoChange(externalResult.field, externalResult.oldValue, externalResult.proposedValue);
    if (noChange.isNoChange) {
      console.log("[SuggestionEngine] NO_CHANGE (external) for", finding.category, ":", noChange.reason);
      await recordLookupResult(finding.peptide_id!, externalResult.sourceProvider, "no_change", 0, false);
      return enrichWithSourceContext({
        ...externalResult,
        confidenceScore: 100,
        confidenceLevel: "high",
        noChangeReason: noChange.reason,
        description: `Sem alteração necessária em ${fieldLabel(externalResult.field)}`,
        impact: "Os dados encontrados nas fontes já estão refletidos na página atual",
        requiresManualReview: false,
      }, finding);
    }
    const enriched = applyConfidenceEngine(externalResult);
    await recordLookupResult(finding.peptide_id!, enriched.sourceProvider, "strong_match", enriched.confidenceScore, true);
    return enrichWithSourceContext(enriched, finding);
  }

  const sources = CATEGORY_SOURCES[finding.category] || [];
  for (const src of sources) {
    await recordLookupResult(finding.peptide_id!, src, "no_match", 0, false);
  }

  return null;
}

// ── Apply Confidence Engine to a suggestion ──

function applyConfidenceEngine(suggestion: Suggestion): Suggestion {
  const analysis = scoreSuggestion({
    fieldName: suggestion.field,
    sourceProvider: suggestion.sourceProvider,
    changeType: suggestion.changeType === "manual_assist" || suggestion.changeType === "remove"
      ? "replace"
      : suggestion.changeType as "add" | "replace" | "merge",
    currentValueExists: suggestion.oldValue !== null && suggestion.oldValue !== undefined && suggestion.oldValue !== "",
    matchStrength: 0.75,
    hasConflict: false,
  });

  // Override the simple score/level with the engine's result
  suggestion.confidenceScore = Math.round(analysis.score * 100);
  suggestion.confidenceLevel = analysis.level === "very_high" || analysis.level === "high"
    ? "high"
    : analysis.level === "medium"
      ? "medium"
      : "low";
  suggestion.requiresManualReview = analysis.requiresManualReview || analysis.decision === "blocked";
  suggestion.confidenceAnalysis = analysis;

  return suggestion;
}

// ── Enrich with source context ──

async function enrichWithSourceContext(suggestion: Suggestion | null, finding: FindingInput): Promise<Suggestion | null> {
  if (!suggestion) return null;

  const providerSlug = suggestion.sourceProvider.toLowerCase().replace(/\s+/g, "");
  
  const { data: source } = await supabase
    .from("integration_sources")
    .select("last_sync_status, last_sync_at, name")
    .or(`slug.eq.${providerSlug},name.ilike.%${suggestion.sourceProvider}%`)
    .limit(1)
    .maybeSingle();

  const lookupStatus = suggestion.proposedValue ? "strong_match" : "no_match";

  suggestion.sourceContext = {
    sourceProvider: suggestion.sourceProvider,
    globalSyncStatus: source?.last_sync_status || null,
    lastSyncAt: source?.last_sync_at || null,
    lookupStatus,
    lookupMessage: getContextMessage(source?.last_sync_status, lookupStatus, suggestion.sourceProvider),
  };

  return suggestion;
}

function getContextMessage(globalStatus: string | null, lookupStatus: string, provider: string): string {
  if (!globalStatus || globalStatus === "never") {
    return `${provider} ainda não foi sincronizado globalmente`;
  }
  if (globalStatus === "success" && lookupStatus === "strong_match") {
    return `${provider} sincronizado com sucesso — correspondência encontrada para este peptídeo`;
  }
  if (globalStatus === "success" && lookupStatus === "no_match") {
    return `${provider} sincronizado globalmente, mas sem correspondência confiável para este peptídeo`;
  }
  if (globalStatus === "error") {
    return `${provider} apresentou erro na última sincronização global`;
  }
  return `${provider}: status ${globalStatus}`;
}

// ── Record lookup result ──

async function recordLookupResult(
  peptideId: string,
  sourceProvider: string,
  status: string,
  confidence: number,
  suggestionGenerated: boolean
) {
  try {
    await supabase.from("peptide_source_checks" as any).upsert(
      {
        peptide_id: peptideId,
        source_provider: sourceProvider,
        lookup_status: status,
        confidence_score: confidence,
        suggestion_generated: suggestionGenerated,
        last_checked_at: new Date().toISOString(),
      } as any,
      { onConflict: "peptide_id,source_provider" }
    );
  } catch (err) {
    console.error("[SuggestionEngine] Failed to record lookup:", err);
  }
}

// ── Call edge function ──

async function callExternalSuggestion(
  finding: FindingInput,
  peptide: Record<string, any>
): Promise<Suggestion | null> {
  try {
    const { data, error } = await supabase.functions.invoke("suggest-correction", {
      body: {
        peptide_name: peptide.name,
        peptide_id: finding.peptide_id,
        category: finding.category,
        aliases: peptide.alternative_names || [],
      },
    });

    if (error) {
      console.error("[SuggestionEngine] Edge function error:", error);
      return null;
    }

    const ext = data?.suggestion;
    if (!ext) {
      console.log("[SuggestionEngine] No external suggestion found");
      return null;
    }

    console.log("[SuggestionEngine] External suggestion found:", ext.field, "from", ext.source);

    // ── BLOCK generic placeholders without real evidence ──
    if (ext.field === "source_origins") {
      if (isGenericSourceOrigins(ext.proposed_value, ext.source_id, ext.extra)) {
        console.log("[SuggestionEngine] BLOCKED: source_origins without real evidence (generic placeholder)");
        await recordLookupResult(finding.peptide_id!, ext.source, "no_evidence", 0, false);
        return null;
      }
    }

    // ── BLOCK any suggestion without a source_id for fields that require it ──
    if (!ext.source_id && ext.field !== "scientific_references") {
      const fieldsRequiringId = ["sequence", "mechanism", "source_origins"];
      if (fieldsRequiringId.includes(ext.field)) {
        console.log("[SuggestionEngine] BLOCKED: field", ext.field, "requires source_id but none provided");
        await recordLookupResult(finding.peptide_id!, ext.source, "no_evidence", 0, false);
        return null;
      }
    }

    return {
      findingId: finding.id,
      peptideId: finding.peptide_id!,
      field: ext.field,
      oldValue: (peptide as any)[ext.field] || null,
      proposedValue: ext.proposed_value,
      sourceProvider: ext.source,
      sourceReference: ext.source_id || null,
      confidenceScore: ext.confidence,
      confidenceLevel: ext.confidence_level,
      changeType: ext.change_type,
      description: ext.description,
      impact: ext.impact,
      previewData: ext.extra || {},
      requiresManualReview: false,
    };
  } catch (err) {
    console.error("[SuggestionEngine] Failed to call edge function:", err);
    return null;
  }
}

// ── Local: Sequence ──

async function suggestSequenceLocal(
  finding: FindingInput,
  peptide: Record<string, any>
): Promise<Suggestion | null> {
  const { data: changes } = await supabase
    .from("detected_changes")
    .select("new_value, integration_sources(name, slug)")
    .eq("peptide_id", finding.peptide_id!)
    .eq("field_name", "sequence")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1);

  if (changes && changes.length > 0) {
    const change = changes[0];
    const source = (change as any).integration_sources;
    const sequence = change.new_value;

    if (sequence && sequence.length > 0) {
      return {
        findingId: finding.id,
        peptideId: finding.peptide_id!,
        field: "sequence",
        oldValue: peptide.sequence || null,
        proposedValue: sequence,
        sourceProvider: source?.name || "Fonte externa",
        sourceReference: source?.slug || null,
        confidenceScore: 75,
        confidenceLevel: "medium",
        changeType: "add",
        description: `Adicionar sequência peptídica para ${peptide.name} (${sequence.length} caracteres)`,
        impact: "A sequência aparecerá na seção de informações moleculares da página do peptídeo",
        previewData: { sequence, length: sequence.length },
        requiresManualReview: false,
      };
    }
  }

  return null;
}

// ── Local: References ──

async function suggestReferencesLocal(
  finding: FindingInput,
  peptide: Record<string, any>
): Promise<Suggestion | null> {
  const { data: refs } = await supabase
    .from("peptide_references")
    .select("title, journal, year, pmid, doi, source, authors")
    .eq("peptide_id", finding.peptide_id!)
    .order("year", { ascending: false })
    .limit(20);

  if (!refs || refs.length === 0) return null;

  const currentRefs = peptide.scientific_references || [];
  const currentCount = Array.isArray(currentRefs) ? currentRefs.length : 0;

  const formattedRefs = refs.map((r) => ({
    title: r.title,
    source: r.journal || r.source,
    year: r.year,
    pmid: r.pmid,
  }));

  // ── NO_CHANGE check: if all proposed refs already exist by PMID ──
  const noChange = isNoChange("scientific_references", currentRefs, formattedRefs);
  if (noChange.isNoChange) {
    console.log("[SuggestionEngine] References NO_CHANGE:", noChange.reason);
    return null;
  }

  return {
    findingId: finding.id,
    peptideId: finding.peptide_id!,
    field: "scientific_references",
    oldValue: currentRefs,
    proposedValue: formattedRefs,
    sourceProvider: "PubMed",
    sourceReference: null,
    confidenceScore: refs.some((r) => r.pmid) ? 85 : 65,
    confidenceLevel: refs.some((r) => r.pmid) ? "high" : "medium",
    changeType: currentCount > 0 ? "merge" : "add",
    description: `Vincular ${formattedRefs.length} referência(s) do banco de dados ao ${peptide.name}`,
    impact: "As referências aparecerão no bloco 'Referências Científicas' da aba Pesquisa",
    previewData: { references: formattedRefs, count: formattedRefs.length },
    requiresManualReview: false,
  };
}

// ── Local: Source origins ──

async function suggestSourceOriginsLocal(
  finding: FindingInput,
  peptide: Record<string, any>
): Promise<Suggestion | null> {
  // Only add origins backed by real external IDs
  const origins: Array<{ name: string; evidence: string }> = [];

  if (peptide.ncbi_protein_id) origins.push({ name: "NCBI", evidence: peptide.ncbi_protein_id });
  if (peptide.dramp_id) origins.push({ name: "DRAMP", evidence: peptide.dramp_id });
  if (peptide.apd_id) origins.push({ name: "APD", evidence: peptide.apd_id });
  if (peptide.peptipedia_id) origins.push({ name: "Peptipedia", evidence: peptide.peptipedia_id });

  // Only count references that have a real PMID
  const { data: refs } = await supabase
    .from("peptide_references")
    .select("source, pmid")
    .eq("peptide_id", finding.peptide_id!)
    .not("pmid", "is", null)
    .limit(50);

  if (refs && refs.length > 0) {
    const uniqueSources = [...new Set(refs.map((r) => r.source))];
    uniqueSources.forEach((s) => {
      if (!origins.find(o => o.name === s)) {
        const refWithPmid = refs.find(r => r.source === s && r.pmid);
        if (refWithPmid) {
          origins.push({ name: s, evidence: `PMID:${refWithPmid.pmid}` });
        }
      }
    });
  }

  if (origins.length === 0) return null;

  const originNames = origins.map(o => o.name);
  const currentOrigins = peptide.source_origins || [];
  const newOrigins = originNames.filter((o) => !currentOrigins.includes(o));
  if (newOrigins.length === 0) return null;

  return {
    findingId: finding.id,
    peptideId: finding.peptide_id!,
    field: "source_origins",
    oldValue: currentOrigins,
    proposedValue: [...new Set([...currentOrigins, ...originNames])],
    sourceProvider: originNames.join(", "),
    sourceReference: origins.map(o => `${o.name}:${o.evidence}`).join(", "),
    confidenceScore: 80,
    confidenceLevel: "high",
    changeType: "merge",
    description: `Adicionar ${newOrigins.length} origem(ns) com evidência real ao ${peptide.name}`,
    impact: "As origens serão registradas nos metadados de rastreabilidade",
    previewData: { origins: newOrigins, evidence: origins },
    requiresManualReview: false,
  };
}

// ── Local: Incomplete data ──

async function suggestIncompleteDataLocal(
  finding: FindingInput,
  peptide: Record<string, any>
): Promise<Suggestion | null> {
  const { data: changes } = await supabase
    .from("detected_changes")
    .select("field_name, new_value, integration_sources(name)")
    .eq("peptide_id", finding.peptide_id!)
    .eq("status", "pending")
    .not("field_name", "eq", "sequence")
    .order("created_at", { ascending: false })
    .limit(5);

  if (changes && changes.length > 0) {
    const change = changes[0];
    const rawField = change.field_name || "description";
    const field = mapField(rawField);
    if (!field) {
      console.log("[SuggestionEngine] SKIP invalid field from detected_changes:", rawField);
      return null;
    }
      oldValue: (peptide as any)[field] || null,
      proposedValue: change.new_value,
      sourceProvider: (change as any).integration_sources?.name || "Fonte externa",
      sourceReference: null,
      confidenceScore: 60,
      confidenceLevel: "medium",
      changeType: "add",
      description: `Preencher campo "${field}" para ${peptide.name}`,
      impact: "O campo preenchido aparecerá na seção correspondente da página",
      previewData: { field, value: change.new_value },
      requiresManualReview: false,
    };
  }

  return null;
}

// ── Slug fix (deterministic, no API needed) ──

function suggestSlugFix(
  finding: FindingInput,
  peptide: Record<string, any>
): Suggestion | null {
  const expectedSlug = peptide.name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  if (peptide.slug === expectedSlug) return null;

  return {
    findingId: finding.id,
    peptideId: finding.peptide_id!,
    field: "slug",
    oldValue: peptide.slug,
    proposedValue: expectedSlug,
    sourceProvider: "Internal",
    sourceReference: null,
    confidenceScore: 95,
    confidenceLevel: "high",
    changeType: "replace",
    description: `Corrigir slug inconsistente de ${peptide.name}`,
    impact: "O slug será atualizado. Links antigos podem ser afetados.",
    previewData: { oldSlug: peptide.slug, newSlug: expectedSlug },
    requiresManualReview: false,
  };
}

// ── Check if a finding has REAL suggestion data available (data-driven, no heuristics) ──

export async function checkSuggestionAvailable(
  findingCategory: string,
  peptideId: string
): Promise<boolean> {
  // Slug fix is always deterministic
  if (findingCategory === "data_inconsistency") return true;

  // Check for pending detected_changes matching this peptide + relevant field
  if (findingCategory === "missing_sequence") {
    const { count } = await supabase
      .from("detected_changes")
      .select("id", { count: "exact", head: true })
      .eq("peptide_id", peptideId)
      .eq("field_name", "sequence")
      .eq("status", "pending");
    return (count ?? 0) > 0;
  }

  if (findingCategory === "cross_source_conflict") {
    const { count } = await supabase
      .from("detected_changes")
      .select("id", { count: "exact", head: true })
      .eq("peptide_id", peptideId)
      .eq("status", "pending");
    return (count ?? 0) > 0;
  }

  if (findingCategory === "incomplete_data") {
    const { count } = await supabase
      .from("detected_changes")
      .select("id", { count: "exact", head: true })
      .eq("peptide_id", peptideId)
      .eq("status", "pending")
      .neq("field_name", "sequence");
    return (count ?? 0) > 0;
  }

  // References: only true if real NEW references exist that aren't already in the peptide
  if (findingCategory === "no_references") {
    const { data: dbRefs } = await supabase
      .from("peptide_references")
      .select("pmid, title, year")
      .eq("peptide_id", peptideId)
      .limit(20);
    if (!dbRefs || dbRefs.length === 0) return false;
    // Fetch current peptide refs
    const { data: pep } = await supabase
      .from("peptides")
      .select("scientific_references")
      .eq("id", peptideId)
      .single();
    const currentRefs = pep?.scientific_references || [];
    const noChange = isNoChange("scientific_references", currentRefs, dbRefs.map(r => ({ title: r.title, year: r.year, pmid: r.pmid })));
    return !noChange.isNoChange;
  }

  // Source origins: only true if peptide has real external IDs
  if (findingCategory === "no_source") {
    const { data: pep } = await supabase
      .from("peptides")
      .select("ncbi_protein_id, dramp_id, apd_id, peptipedia_id")
      .eq("id", peptideId)
      .single();
    if (pep && (pep.ncbi_protein_id || pep.dramp_id || pep.apd_id || pep.peptipedia_id)) return true;
    // Also check peptide_source_checks for any strong match
    const { count: matchCount } = await supabase
      .from("peptide_source_checks" as any)
      .select("id", { count: "exact", head: true })
      .eq("peptide_id", peptideId)
      .eq("lookup_status", "strong_match");
    return (matchCount ?? 0) > 0;
  }

  // Default: no suggestion available
  return false;
}

// ── Local: Cross-source conflict ──

async function suggestCrossSourceConflict(
  finding: FindingInput,
  peptide: Record<string, any>
): Promise<Suggestion | null> {
  // Check detected_changes for the specific conflict
  const { data: changes } = await supabase
    .from("detected_changes")
    .select("field_name, old_value, new_value, severity, integration_sources(name, slug)")
    .eq("peptide_id", finding.peptide_id!)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5);

  if (!changes || changes.length === 0) return null;

  const change = changes[0];
  const rawField = change.field_name || "description";
  const field = mapField(rawField);
  if (!field) {
    console.log("[SuggestionEngine] SKIP invalid field from detected_changes:", rawField);
    return null;
  }
  const source = (change as any).integration_sources;
  const newValue = change.new_value;

  if (!newValue) return null;

  const analysis = analyzeConflict(finding, peptide);

  return {
    findingId: finding.id,
    peptideId: finding.peptide_id!,
    field,
    oldValue: (peptide as any)[field] || finding.value_a || null,
    proposedValue: newValue,
    sourceProvider: source?.name || finding.source_b || "Fonte externa",
    sourceReference: source?.slug || null,
    confidenceScore: analysis.canDiff ? 70 : 50,
    confidenceLevel: analysis.canDiff ? "medium" : "low",
    changeType: "replace",
    description: `Conflito detectado no campo "${fieldLabel(field)}" entre PeptLabs e ${source?.name || finding.source_b || "fonte externa"}`,
    impact: `O campo "${fieldLabel(field)}" será atualizado com o valor da fonte externa`,
    previewData: {
      conflictAnalysis: analysis,
    },
    requiresManualReview: !analysis.canDiff || analysis.subtype !== "sequence_conflict_comparable",
  };
}

// ── Get source context for a peptide (used by UI) ──

export async function getSourceChecksForPeptide(
  peptideId: string
): Promise<Record<string, {
  status: string;
  confidence: number;
  lastChecked: string | null;
  suggestionGenerated: boolean;
  matchedRecordId?: string | null;
  matchedRecordName?: string | null;
  notes?: string | null;
}>> {
  const { data } = await supabase
    .from("peptide_source_checks" as any)
    .select("source_provider, lookup_status, confidence_score, last_checked_at, suggestion_generated, matched_record_id, matched_record_name, notes")
    .eq("peptide_id", peptideId);

  const result: Record<string, {
    status: string;
    confidence: number;
    lastChecked: string | null;
    suggestionGenerated: boolean;
    matchedRecordId?: string | null;
    matchedRecordName?: string | null;
    notes?: string | null;
  }> = {};
  (data || []).forEach((row: any) => {
    result[row.source_provider] = {
      status: row.lookup_status,
      confidence: row.confidence_score,
      lastChecked: row.last_checked_at,
      suggestionGenerated: Boolean(row.suggestion_generated),
      matchedRecordId: row.matched_record_id || null,
      matchedRecordName: row.matched_record_name || null,
      notes: row.notes || null,
    };
  });
  return result;
}

// ── Generic placeholder detection ──

const KNOWN_SOURCE_NAMES = ["PubMed", "UniProt", "PDB", "openFDA", "NCBI", "DRAMP", "APD", "Peptipedia", "Crossref"];

/**
 * Detects if a source_origins suggestion is just a generic placeholder
 * without real evidence (e.g. ["PubMed"] with no PMID or accession).
 */
function isGenericSourceOrigins(
  proposedValue: any,
  sourceId: string | null,
  extra: any
): boolean {
  // If there's a real source_id with actual IDs, it's valid
  if (sourceId && sourceId.length > 0) {
    // Check it's not just the source name repeated
    const isJustNames = KNOWN_SOURCE_NAMES.some(n => sourceId === n);
    if (!isJustNames) return false;
  }

  // If extra has structured origins with IDs, it's valid
  if (extra?.origins && Array.isArray(extra.origins)) {
    const hasRealEvidence = extra.origins.some((o: any) => o.id && o.id.length > 0);
    if (hasRealEvidence) return false;
  }

  // If proposed value is just an array of source names, it's a placeholder
  if (Array.isArray(proposedValue)) {
    const allGeneric = proposedValue.every((v: any) =>
      typeof v === "string" && KNOWN_SOURCE_NAMES.includes(v)
    );
    if (allGeneric) return true;
  }

  return false;
}
