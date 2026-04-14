/**
 * sync-orchestrator
 * ═════════════════
 * Orchestrates synchronization from external scientific APIs.
 * Records changes in detected_changes and sync_runs tables.
 * Populates peptide_source_checks per peptide per source.
 *
 * POST body:
 *   { source?: "uniprot"|"pubmed"|"pdb"|"openfda"|"all", mode?: "manual"|"semi_auto"|"auto" }
 */
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, handleCors, jsonResponse } from "../_shared/cors.ts";

// ── Canonical source names ──
const SOURCE_NAMES: Record<string, string> = {
  pubmed: "PubMed",
  uniprot: "UniProt",
  pdb: "PDB",
  openfda: "openFDA",
  peptipedia: "Peptipedia",
  dramp: "DRAMP",
  apd: "APD",
};

function canonicalSource(slug: string): string {
  return SOURCE_NAMES[slug] || slug;
}

// ── Constants ──
const NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const UNIPROT_BASE = "https://rest.uniprot.org/uniprotkb";
const PDB_BASE = "https://data.rcsb.org/rest/v1";
const OPENFDA_BASE = "https://api.fda.gov";

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Validate admin
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        const { data: role } = await sb.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
        if (!role) return jsonResponse({ error: "Admin required" }, 403);
      }
    }

    const body = await req.json().catch(() => ({}));
    const sourceSlug: string = body.source || "all";
    const mode: string = body.mode || "manual";

    // Get integration sources
    const { data: sources } = await sb.from("integration_sources").select("*").eq("is_active", true);
    if (!sources?.length) return jsonResponse({ error: "No active sources" }, 400);

    const targetSources = sourceSlug === "all"
      ? sources
      : sources.filter((s: any) => s.slug === sourceSlug);

    if (!targetSources.length) return jsonResponse({ error: `Source '${sourceSlug}' not found or inactive` }, 404);

    // Get all peptides for comparison
    const { data: peptides } = await sb.from("peptides")
      .select("id, name, slug, alternative_names, sequence, description, mechanism, biological_activity, structure_info, ncbi_protein_id, source_origins");

    const allResults: Record<string, any> = {};

    for (const source of targetSources) {
      const result = await syncSource(sb, source, peptides || [], mode);
      allResults[source.slug] = result;

      // Update source status — records_count = peptides actually processed in THIS run
      const syncStatus = result.processed === 0 && result.errors > 0
        ? "error"
        : result.errors > 0
        ? "partial"
        : "success";
      await sb.from("integration_sources").update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: syncStatus,
        records_count: result.processed, // overwrite, not accumulate
      }).eq("id", source.id);
    }

    return jsonResponse({ success: true, results: allResults });
  } catch (err: any) {
    console.error("sync-orchestrator error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});

// ── Main sync dispatcher ──

async function syncSource(sb: SupabaseClient, source: any, peptides: any[], mode: string) {
  // Create sync run
  const { data: run } = await sb.from("sync_runs").insert({
    source_id: source.id,
    status: "running",
    mode,
  }).select("id").single();
  const runId = run?.id;

  let processed = 0, added = 0, updated = 0, conflicts = 0, errors = 0;
  const errorMessages: string[] = [];

  try {
    // Dataset sources (no live API) — mark as success with no processing
    if (source.api_type === "dataset") {
      processed = 0;
    } else {
      switch (source.slug) {
        case "uniprot":
          ({ processed, added, updated, conflicts, errors } = await syncUniProt(sb, source, peptides, runId));
          break;
        case "pubmed":
          ({ processed, added, updated, conflicts, errors } = await syncPubMed(sb, source, peptides, runId));
          break;
        case "pdb":
          ({ processed, added, updated, conflicts, errors } = await syncPDB(sb, source, peptides, runId));
          break;
        case "openfda":
          ({ processed, added, updated, conflicts, errors } = await syncOpenFDA(sb, source, peptides, runId));
          break;
        default:
          errorMessages.push(`No adapter for source: ${source.slug}`);
          errors = 1;
      }
    }
  } catch (e: any) {
    errorMessages.push(e.message);
    errors++;
  }

  // Update sync run
  if (runId) {
    await sb.from("sync_runs").update({
      status: errors > 0 && processed === 0 ? "failed" : errors > 0 ? "partial" : "completed",
      completed_at: new Date().toISOString(),
      records_processed: processed,
      records_added: added,
      records_updated: updated,
      conflicts_found: conflicts,
      errors_count: errors,
      error_message: errorMessages.length ? errorMessages.slice(0, 5).join("; ") : null,
    }).eq("id", runId);
  }

  return { processed, added, updated, conflicts, errors };
}

// ── Record peptide_source_checks per peptide ──

async function upsertSourceCheck(
  sb: SupabaseClient,
  peptideId: string,
  sourceProvider: string,
  status: "strong_match" | "weak_match" | "no_match" | "error",
  confidence: number,
  matchedRecordId: string | null = null,
  matchedRecordName: string | null = null
) {
  await sb.from("peptide_source_checks").upsert({
    peptide_id: peptideId,
    source_provider: canonicalSource(sourceProvider),
    lookup_status: status,
    confidence_score: confidence,
    matched_record_id: matchedRecordId,
    matched_record_name: matchedRecordName,
    last_checked_at: new Date().toISOString(),
    suggestion_generated: status === "strong_match",
  }, { onConflict: "peptide_id,source_provider" });
}

// ── UniProt Adapter ──

async function syncUniProt(sb: SupabaseClient, source: any, peptides: any[], runId: string | null) {
  let processed = 0, added = 0, updated = 0, conflicts = 0, errors = 0;

  for (const pep of peptides.slice(0, 50)) {
    try {
      const searchName = pep.name.replace(/[^a-zA-Z0-9\s-]/g, "").trim();
      if (!searchName || searchName.length < 2) {
        await upsertSourceCheck(sb, pep.id, "uniprot", "no_match", 0);
        continue;
      }

      const query = encodeURIComponent(`${searchName} AND (length:[2 TO 100])`);
      const res = await fetch(`${UNIPROT_BASE}/search?query=${query}&size=3&format=json&fields=accession,protein_name,organism_name,sequence,cc_function`, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        await res.text().catch(() => "");
        errors++;
        await upsertSourceCheck(sb, pep.id, "uniprot", "error", 0);
        await sleep(500);
        continue;
      }

      const data = await res.json();
      const results = data?.results || [];
      processed++;

      if (results.length === 0) {
        await upsertSourceCheck(sb, pep.id, "uniprot", "no_match", 0);
        continue;
      }

      const best = results[0];
      const uniSeq = best.sequence?.value || null;
      const uniAccession = best.primaryAccession || null;

      // Record source check with match info
      await upsertSourceCheck(
        sb, pep.id, "uniprot",
        uniSeq ? "strong_match" : "weak_match",
        uniSeq ? 75 : 30,
        uniAccession,
        best.proteinDescription?.recommendedName?.fullName?.value || null
      );

      // Detect changes — store FULL sequences, no truncation
      if (uniSeq && pep.sequence && uniSeq !== pep.sequence) {
        await recordChange(sb, {
          sync_run_id: runId,
          source_id: source.id,
          peptide_id: pep.id,
          change_type: "sequence_change",
          field_name: "sequence",
          old_value: pep.sequence, // full sequence
          new_value: uniSeq,       // full sequence
          severity: "critical",
          metadata: { uniprot_accession: uniAccession },
        });
        conflicts++;
      } else if (uniSeq && !pep.sequence) {
        await recordChange(sb, {
          sync_run_id: runId,
          source_id: source.id,
          peptide_id: pep.id,
          change_type: "new_data",
          field_name: "sequence",
          old_value: null,
          new_value: uniSeq, // full sequence
          severity: "low",
        });
        added++;
      }

      await sleep(500);
    } catch (e: any) {
      console.warn(`UniProt sync error for ${pep.name}:`, e.message);
      errors++;
      await upsertSourceCheck(sb, pep.id, "uniprot", "error", 0);
    }
  }

  return { processed, added, updated, conflicts, errors };
}

// ── PubMed Adapter ──

async function syncPubMed(sb: SupabaseClient, source: any, peptides: any[], runId: string | null) {
  let processed = 0, added = 0, updated = 0, conflicts = 0, errors = 0;

  for (const pep of peptides.slice(0, 30)) {
    try {
      const terms = [pep.name, ...(pep.alternative_names || [])].filter(Boolean);
      const query = terms.map(t => `"${t}"[Title/Abstract]`).join(" OR ");
      const searchUrl = `${NCBI_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query + " AND peptide")}&retmax=5&retmode=json&sort=relevance&mindate=2024/01/01&datetype=pdat`;

      const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
      if (!searchRes.ok) { await searchRes.text(); errors++; continue; }
      const searchData = await searchRes.json();
      const ids: string[] = searchData?.esearchresult?.idlist || [];
      processed++;

      if (ids.length === 0) {
        await upsertSourceCheck(sb, pep.id, "pubmed", "no_match", 0);
        continue;
      }

      // Record source check — found articles
      await upsertSourceCheck(sb, pep.id, "pubmed", "strong_match", 80, ids[0], `${ids.length} artigo(s)`);

      // Check which PMIDs are new
      const { data: existingRefs } = await sb.from("peptide_references")
        .select("pmid")
        .eq("peptide_id", pep.id)
        .in("pmid", ids);

      const existingPmids = new Set((existingRefs || []).map((r: any) => r.pmid));
      const newPmids = ids.filter(id => !existingPmids.has(id));

      if (newPmids.length > 0) {
        for (const pmid of newPmids) {
          await recordChange(sb, {
            sync_run_id: runId,
            source_id: source.id,
            peptide_id: pep.id,
            change_type: "new_reference",
            field_name: "scientific_reference",
            old_value: null,
            new_value: `PMID: ${pmid}`,
            severity: "low",
            metadata: { pmid },
          });
          added++;
        }
      }

      await sleep(400);
    } catch (e: any) {
      errors++;
    }
  }

  return { processed, added, updated, conflicts, errors };
}

// ── PDB Adapter ──

async function syncPDB(sb: SupabaseClient, source: any, peptides: any[], runId: string | null) {
  let processed = 0, added = 0, updated = 0, conflicts = 0, errors = 0;

  for (const pep of peptides.slice(0, 30)) {
    try {
      const searchBody = {
        query: {
          type: "terminal",
          service: "text",
          parameters: {
            attribute: "struct.title",
            operator: "contains_words",
            value: pep.name,
          },
        },
        return_type: "entry",
        request_options: { results_content_type: ["experimental"], paginate: { start: 0, rows: 3 } },
      };

      const res = await fetch(`${PDB_BASE}/../search/v2/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchBody),
        signal: AbortSignal.timeout(10000),
      });

      processed++;

      if (!res.ok) {
        await res.text();
        await upsertSourceCheck(sb, pep.id, "pdb", "no_match", 0);
        continue;
      }
      const data = await res.json();
      const hits = data?.result_set || [];

      if (hits.length === 0) {
        await upsertSourceCheck(sb, pep.id, "pdb", "no_match", 0);
        continue;
      }

      const pdbIds = hits.map((h: any) => h.identifier).filter(Boolean);
      await upsertSourceCheck(sb, pep.id, "pdb", "strong_match", 70, pdbIds[0], `${pdbIds.length} estrutura(s)`);

      const currentStructure = pep.structure_info;
      if (!currentStructure || !currentStructure.pdb_ids?.length) {
        await recordChange(sb, {
          sync_run_id: runId,
          source_id: source.id,
          peptide_id: pep.id,
          change_type: "structure_update",
          field_name: "structure_info",
          old_value: null,
          new_value: pdbIds.join(", "),
          severity: "low",
          metadata: { pdb_ids: pdbIds },
        });
        added++;
      } else {
        const existingIds = new Set(currentStructure.pdb_ids || []);
        const newIds = pdbIds.filter((id: string) => !existingIds.has(id));
        if (newIds.length > 0) {
          await recordChange(sb, {
            sync_run_id: runId,
            source_id: source.id,
            peptide_id: pep.id,
            change_type: "structure_update",
            field_name: "structure_info",
            old_value: (currentStructure.pdb_ids || []).join(", "),
            new_value: [...(currentStructure.pdb_ids || []), ...newIds].join(", "),
            severity: "low",
            metadata: { new_pdb_ids: newIds },
          });
          added++;
        }
      }

      await sleep(300);
    } catch (e: any) {
      errors++;
    }
  }

  return { processed, added, updated, conflicts, errors };
}

// ── openFDA Adapter ──

async function syncOpenFDA(sb: SupabaseClient, source: any, peptides: any[], runId: string | null) {
  let processed = 0, added = 0, updated = 0, conflicts = 0, errors = 0;

  for (const pep of peptides.slice(0, 20)) {
    try {
      const encodedName = encodeURIComponent(`"${pep.name}"`);
      const res = await fetch(
        `${OPENFDA_BASE}/drug/event.json?search=patient.drug.openfda.generic_name:${encodedName}&limit=1`,
        { signal: AbortSignal.timeout(10000) }
      );

      processed++;

      if (res.status === 404) {
        await res.text();
        await upsertSourceCheck(sb, pep.id, "openfda", "no_match", 0);
        continue;
      }
      if (!res.ok) {
        await res.text();
        await upsertSourceCheck(sb, pep.id, "openfda", "no_match", 0);
        continue;
      }

      const data = await res.json();
      const results = data?.results || [];

      if (results.length > 0) {
        const event = results[0];
        const reactions = event?.patient?.reaction?.map((r: any) => r.reactionmeddrapt).filter(Boolean) || [];

        await upsertSourceCheck(sb, pep.id, "openfda", reactions.length > 0 ? "strong_match" : "weak_match", reactions.length > 0 ? 60 : 20);

        if (reactions.length > 0) {
          await recordChange(sb, {
            sync_run_id: runId,
            source_id: source.id,
            peptide_id: pep.id,
            change_type: "regulatory_update",
            field_name: "adverse_events",
            old_value: null,
            new_value: reactions.slice(0, 10).join(", "), // no truncation on individual items
            severity: "medium",
            metadata: { source: "openFDA", reaction_count: reactions.length },
          });
          added++;
        }
      } else {
        await upsertSourceCheck(sb, pep.id, "openfda", "no_match", 0);
      }

      await sleep(500);
    } catch (e: any) {
      errors++;
    }
  }

  return { processed, added, updated, conflicts, errors };
}

// ── Helpers ──

async function recordChange(sb: SupabaseClient, change: Record<string, any>) {
  // No truncation — store full values
  const { error } = await sb.from("detected_changes").insert(change);
  if (error) console.error("Failed to record change:", error.message);
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
