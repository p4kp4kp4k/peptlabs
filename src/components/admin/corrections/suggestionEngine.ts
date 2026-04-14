/**
 * Suggestion Engine
 * =================
 * Fetches real data from integration sources (detected_changes, peptide_references)
 * and generates concrete correction proposals with before/after values.
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

  switch (finding.category) {
    case "missing_sequence":
      return suggestSequence(finding, peptide);
    case "no_references":
      return suggestReferences(finding, peptide);
    case "no_source":
      return suggestSourceOrigins(finding, peptide);
    case "incomplete_data":
      return suggestIncompleteData(finding, peptide);
    case "data_inconsistency":
      return suggestSlugFix(finding, peptide);
    default:
      return null;
  }
}

// ── Sequence suggestion ──

async function suggestSequence(
  finding: FindingInput,
  peptide: Record<string, any>
): Promise<Suggestion | null> {
  // 1. Check detected_changes for sequence data
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
      console.log("[SuggestionEngine] Found sequence from", source?.name);
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

  // 2. Check if peptide has sequence in import_queue
  const { data: queued } = await supabase
    .from("peptide_import_queue")
    .select("collected_data, integration_sources(name)")
    .eq("status", "pending")
    .limit(100);

  if (queued) {
    for (const q of queued) {
      const data = q.collected_data as any;
      if (data?.sequence && data?.name?.toLowerCase() === peptide.name?.toLowerCase()) {
        return {
          findingId: finding.id,
          peptideId: finding.peptide_id!,
          field: "sequence",
          oldValue: null,
          proposedValue: data.sequence,
          sourceProvider: (q as any).integration_sources?.name || "Import Queue",
          sourceReference: null,
          confidenceScore: 60,
          confidenceLevel: "medium",
          changeType: "add",
          description: `Sequência encontrada na fila de importação para ${peptide.name}`,
          impact: "A sequência aparecerá na seção de informações moleculares",
          previewData: { sequence: data.sequence, length: data.sequence.length },
          requiresManualReview: false,
        };
      }
    }
  }

  return null;
}

// ── References suggestion ──

async function suggestReferences(
  finding: FindingInput,
  peptide: Record<string, any>
): Promise<Suggestion | null> {
  // Check peptide_references table for existing refs
  const { data: refs, error } = await supabase
    .from("peptide_references")
    .select("title, journal, year, pmid, doi, source, authors")
    .eq("peptide_id", finding.peptide_id!)
    .order("year", { ascending: false })
    .limit(20);

  if (error || !refs || refs.length === 0) {
    // Check detected_changes for new_reference entries
    const { data: refChanges } = await supabase
      .from("detected_changes")
      .select("new_value, metadata, integration_sources(name)")
      .eq("peptide_id", finding.peptide_id!)
      .eq("change_type", "new_reference")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10);

    if (refChanges && refChanges.length > 0) {
      const parsedRefs = refChanges.map((rc) => {
        try {
          const meta = rc.metadata as any;
          return {
            title: meta?.title || rc.new_value || "Referência sem título",
            journal: meta?.journal || null,
            year: meta?.year || null,
            pmid: meta?.pmid || null,
            source: (rc as any).integration_sources?.name || "PubMed",
          };
        } catch {
          return { title: rc.new_value || "Referência", journal: null, year: null, pmid: null, source: "PubMed" };
        }
      });

      return {
        findingId: finding.id,
        peptideId: finding.peptide_id!,
        field: "scientific_references",
        oldValue: peptide.scientific_references || [],
        proposedValue: parsedRefs,
        sourceProvider: "PubMed / Detected Changes",
        sourceReference: null,
        confidenceScore: 65,
        confidenceLevel: "medium",
        changeType: "merge",
        description: `Vincular ${parsedRefs.length} referência(s) científica(s) ao ${peptide.name}`,
        impact: "As referências aparecerão no bloco 'Referências Científicas' da aba Pesquisa",
        previewData: { references: parsedRefs, count: parsedRefs.length },
        requiresManualReview: false,
      };
    }

    return null;
  }

  // We have refs in peptide_references but the peptide's scientific_references JSON is empty
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

// ── Source origins suggestion ──

async function suggestSourceOrigins(
  finding: FindingInput,
  peptide: Record<string, any>
): Promise<Suggestion | null> {
  const origins: string[] = [];

  // Check which external IDs exist on the peptide
  if (peptide.ncbi_protein_id) origins.push("NCBI");
  if (peptide.dramp_id) origins.push("DRAMP");
  if (peptide.apd_id) origins.push("APD");
  if (peptide.peptipedia_id) origins.push("Peptipedia");

  // Check peptide_references for sources
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

  // Check detected_changes for any data from sources
  const { data: changes } = await supabase
    .from("detected_changes")
    .select("integration_sources(name)")
    .eq("peptide_id", finding.peptide_id!)
    .limit(20);

  if (changes) {
    changes.forEach((c: any) => {
      const name = c.integration_sources?.name;
      if (name && !origins.includes(name)) origins.push(name);
    });
  }

  if (origins.length === 0) return null;

  const currentOrigins = peptide.source_origins || [];

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
    description: `Adicionar ${origins.length} origem(ns) verificável(is) ao ${peptide.name}`,
    impact: "As origens serão registradas nos metadados de rastreabilidade",
    previewData: { origins },
    requiresManualReview: false,
  };
}

// ── Incomplete data suggestion ──

async function suggestIncompleteData(
  finding: FindingInput,
  peptide: Record<string, any>
): Promise<Suggestion | null> {
  // Check detected_changes for any field data
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

// ── Slug fix suggestion ──

async function suggestSlugFix(
  finding: FindingInput,
  peptide: Record<string, any>
): Promise<Suggestion | null> {
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

// ── Check if a finding has available suggestion data (lightweight check) ──

export async function checkSuggestionAvailable(
  findingCategory: string,
  peptideId: string
): Promise<boolean> {
  switch (findingCategory) {
    case "missing_sequence": {
      const { count } = await supabase
        .from("detected_changes")
        .select("*", { count: "exact", head: true })
        .eq("peptide_id", peptideId)
        .eq("field_name", "sequence")
        .eq("status", "pending");
      return (count || 0) > 0;
    }
    case "no_references": {
      const { count } = await supabase
        .from("peptide_references")
        .select("*", { count: "exact", head: true })
        .eq("peptide_id", peptideId);
      if ((count || 0) > 0) return true;
      const { count: changeCount } = await supabase
        .from("detected_changes")
        .select("*", { count: "exact", head: true })
        .eq("peptide_id", peptideId)
        .eq("change_type", "new_reference")
        .eq("status", "pending");
      return (changeCount || 0) > 0;
    }
    case "no_source": {
      // Always can derive from existing external IDs
      return true;
    }
    case "data_inconsistency": {
      return true;
    }
    case "incomplete_data": {
      const { count } = await supabase
        .from("detected_changes")
        .select("*", { count: "exact", head: true })
        .eq("peptide_id", peptideId)
        .eq("status", "pending")
        .neq("field_name", "sequence");
      return (count || 0) > 0;
    }
    default:
      return false;
  }
}
