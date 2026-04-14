/**
 * Suggestion Engine
 * =================
 * 1. Checks local DB tables (detected_changes, peptide_references) for existing data.
 * 2. If nothing found locally, calls the suggest-correction edge function
 *    which queries real external APIs (UniProt, PubMed).
 */

import { supabase } from "@/integrations/supabase/client";

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
      return suggestSlugFix(finding, peptide);
    default:
      break;
  }

  if (localResult) {
    console.log("[SuggestionEngine] Found local data for", finding.category);
    return localResult;
  }

  // Step 2: Call edge function for real API data
  console.log("[SuggestionEngine] No local data, calling external APIs...");
  return callExternalSuggestion(finding, peptide);
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
  const origins: string[] = [];

  if (peptide.ncbi_protein_id) origins.push("NCBI");
  if (peptide.dramp_id) origins.push("DRAMP");
  if (peptide.apd_id) origins.push("APD");
  if (peptide.peptipedia_id) origins.push("Peptipedia");

  const { data: refs } = await supabase
    .from("peptide_references")
    .select("source")
    .eq("peptide_id", finding.peptide_id!)
    .limit(50);

  if (refs && refs.length > 0) {
    const uniqueSources = [...new Set(refs.map((r) => r.source))];
    uniqueSources.forEach((s) => {
      if (!origins.includes(s)) origins.push(s);
    });
  }

  if (origins.length === 0) return null;

  const currentOrigins = peptide.source_origins || [];

  // Check if we'd actually add anything new
  const newOrigins = origins.filter((o) => !currentOrigins.includes(o));
  if (newOrigins.length === 0) return null;

  return {
    findingId: finding.id,
    peptideId: finding.peptide_id!,
    field: "source_origins",
    oldValue: currentOrigins,
    proposedValue: [...new Set([...currentOrigins, ...origins])],
    sourceProvider: origins.join(", "),
    sourceReference: null,
    confidenceScore: 80,
    confidenceLevel: "high",
    changeType: "merge",
    description: `Adicionar ${newOrigins.length} origem(ns) verificável(is) ao ${peptide.name}`,
    impact: "As origens serão registradas nos metadados de rastreabilidade",
    previewData: { origins: newOrigins },
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
    const field = change.field_name || "description";

    return {
      findingId: finding.id,
      peptideId: finding.peptide_id!,
      field,
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

// ── Check if a finding has available suggestion data (lightweight) ──
// Now always returns true for categories that can call external APIs

export async function checkSuggestionAvailable(
  findingCategory: string,
  _peptideId: string
): Promise<boolean> {
  // These categories can always generate suggestions via external APIs
  const apiCategories = [
    "missing_sequence",
    "no_references",
    "no_source",
    "incomplete_data",
    "data_inconsistency",
  ];
  return apiCategories.includes(findingCategory);
}
