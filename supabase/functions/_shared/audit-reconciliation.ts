import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

interface ReconcileOptions {
  peptideIds?: string[];
  includeGlobal?: boolean;
}

interface OpenFindingRow {
  id: string;
  category: string;
  peptide_id: string | null;
}

interface PeptideRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  mechanism: string | null;
  category: string | null;
  benefits: string[] | null;
  dosage_info: string | null;
  sequence: string | null;
  dosage_table: unknown;
  protocol_phases: unknown;
  scientific_references: unknown;
  source_origins: string[] | null;
}

const RECONCILABLE_CATEGORIES = [
  "incomplete_data",
  "missing_sequence",
  "no_references",
  "no_source",
  "no_protocol",
  "data_inconsistency",
  "cross_source_conflict",
  "multi_source",
  "stale_changes",
  "stale_imports",
] as const;

export async function reconcileOpenFindings(
  sb: SupabaseClient,
  options: ReconcileOptions = {},
): Promise<{ resolvedCount: number; resolvedIds: string[] }> {
  let findingsQuery = sb
    .from("audit_findings")
    .select("id, category, peptide_id")
    .eq("status", "open")
    .in("category", [...RECONCILABLE_CATEGORIES]);

  if (!options.includeGlobal && options.peptideIds?.length) {
    findingsQuery = findingsQuery.in("peptide_id", options.peptideIds);
  }

  const { data: openFindings, error: findingsError } = await findingsQuery;
  if (findingsError) throw findingsError;
  if (!openFindings?.length) return { resolvedCount: 0, resolvedIds: [] };

  const peptideIds = [...new Set(openFindings.map((finding) => finding.peptide_id).filter(Boolean))] as string[];

  const peptideById = new Map<string, PeptideRow>();
  const peptideIdsWithReferences = new Set<string>();
  const peptidesWithPendingConflicts = new Set<string>();

  if (peptideIds.length > 0) {
    const { data: peptides, error: peptidesError } = await sb
      .from("peptides")
      .select("id, name, slug, description, mechanism, category, benefits, dosage_info, sequence, dosage_table, protocol_phases, scientific_references, source_origins")
      .in("id", peptideIds);

    if (peptidesError) throw peptidesError;
    (peptides || []).forEach((peptide) => peptideById.set(peptide.id, peptide as PeptideRow));

    const { data: refs, error: refsError } = await sb
      .from("peptide_references")
      .select("peptide_id")
      .in("peptide_id", peptideIds)
      .limit(2000);

    if (refsError) throw refsError;
    (refs || []).forEach((ref) => {
      if (ref.peptide_id) peptideIdsWithReferences.add(ref.peptide_id);
    });

    const { data: pendingChanges, error: pendingChangesError } = await sb
      .from("detected_changes")
      .select("peptide_id")
      .eq("status", "pending")
      .in("severity", ["critical", "medium"])
      .in("peptide_id", peptideIds)
      .limit(2000);

    if (pendingChangesError) throw pendingChangesError;
    (pendingChanges || []).forEach((change) => {
      if (change.peptide_id) peptidesWithPendingConflicts.add(change.peptide_id);
    });
  }

  let stalePendingChangesCount = 0;
  let stalePendingImportsCount = 0;

  if (options.includeGlobal) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { count: pendingChangesCount, error: staleChangesError } = await sb
      .from("detected_changes")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("created_at", sevenDaysAgo);

    if (staleChangesError) throw staleChangesError;
    stalePendingChangesCount = pendingChangesCount || 0;

    const { count: pendingImportsCount, error: staleImportsError } = await sb
      .from("peptide_import_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lt("created_at", sevenDaysAgo);

    if (staleImportsError) throw staleImportsError;
    stalePendingImportsCount = pendingImportsCount || 0;
  }

  const resolvedIds = (openFindings as OpenFindingRow[])
    .filter((finding) => isFindingResolved(finding, {
      peptideById,
      peptideIdsWithReferences,
      peptidesWithPendingConflicts,
      stalePendingChangesCount,
      stalePendingImportsCount,
    }))
    .map((finding) => finding.id);

  if (resolvedIds.length === 0) return { resolvedCount: 0, resolvedIds: [] };

  const { error: updateError } = await sb
    .from("audit_findings")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      resolution_note: "Resolvido automaticamente: a condição não se reproduz mais nos dados atuais.",
    })
    .in("id", resolvedIds);

  if (updateError) throw updateError;

  return { resolvedCount: resolvedIds.length, resolvedIds };
}

function isFindingResolved(
  finding: OpenFindingRow,
  context: {
    peptideById: Map<string, PeptideRow>;
    peptideIdsWithReferences: Set<string>;
    peptidesWithPendingConflicts: Set<string>;
    stalePendingChangesCount: number;
    stalePendingImportsCount: number;
  },
): boolean {
  if (finding.category === "stale_changes") return context.stalePendingChangesCount === 0;
  if (finding.category === "stale_imports") return context.stalePendingImportsCount === 0;
  if (!finding.peptide_id) return false;

  const peptide = context.peptideById.get(finding.peptide_id);
  if (!peptide) return false;

  switch (finding.category) {
    case "incomplete_data":
      return getMissingEssentialFields(peptide).length === 0;
    case "missing_sequence":
      return Boolean(peptide.sequence?.trim());
    case "no_references":
      return context.peptideIdsWithReferences.has(finding.peptide_id) || hasInlineReferences(peptide);
    case "no_source":
      return Array.isArray(peptide.source_origins) && peptide.source_origins.length > 0;
    case "no_protocol":
      return Boolean(peptide.dosage_table || peptide.protocol_phases);
    case "data_inconsistency":
      return !hasInconsistentSlug(peptide);
    case "cross_source_conflict":
      return !context.peptidesWithPendingConflicts.has(finding.peptide_id);
    case "multi_source":
      return !hasMultiSourceRisk(peptide.source_origins || []);
    default:
      return false;
  }
}

function getMissingEssentialFields(peptide: PeptideRow): string[] {
  const missingFields: string[] = [];
  if (!peptide.description) missingFields.push("description");
  if (!peptide.mechanism) missingFields.push("mechanism");
  if (!peptide.category) missingFields.push("category");
  if (!peptide.benefits?.length) missingFields.push("benefits");
  if (!peptide.dosage_info) missingFields.push("dosage_info");
  return missingFields;
}

function hasInlineReferences(peptide: PeptideRow): boolean {
  return Array.isArray(peptide.scientific_references) && peptide.scientific_references.length > 0;
}

function hasInconsistentSlug(peptide: PeptideRow): boolean {
  const expectedSlug = peptide.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const firstToken = peptide.name.toLowerCase().split(" ")[0] || "";
  return peptide.slug !== expectedSlug && !peptide.slug.includes(firstToken);
}

function hasMultiSourceRisk(origins: string[]): boolean {
  const normalized = origins.map((origin) => origin.toLowerCase().replace(/[\s-]+/g, "_"));
  const hasNcbi = normalized.includes("ncbi_protein") || normalized.includes("ncbi");
  const hasDataset = normalized.includes("dramp") || normalized.includes("peptipedia");
  return hasNcbi && hasDataset;
}