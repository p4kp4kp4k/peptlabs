import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.1/cors";

/**
 * Ingest datasets from DRAMP, APD, and Peptipedia
 * 
 * Strategy:
 * - DRAMP: Download from official bulk data (TSV/CSV exports)
 * - APD: Download from official dataset files
 * - Peptipedia: Download from official dataset/API
 * 
 * All sources provide downloadable datasets that don't require scraping.
 */

const DRAMP_DOWNLOAD_URL = "https://dramp.cpu-bioinfor.org/downloads/download.php?filename=general_amps.txt";
const APD_DOWNLOAD_URL = "https://aps.unmc.edu/assets/sequences/APD_sequence_release_09142020.fasta";
const PEPTIPEDIA_API = "https://peptipedia.cl/api";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const source = body.source || "all"; // "dramp" | "apd" | "peptipedia" | "all"

    const results: Record<string, any> = {};

    if (source === "all" || source === "dramp") {
      results.dramp = await ingestDRAMP(sb);
    }

    if (source === "all" || source === "apd") {
      results.apd = await ingestAPD(sb);
    }

    if (source === "all" || source === "peptipedia") {
      results.peptipedia = await ingestPeptipedia(sb);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ingest-datasets error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── DRAMP Ingestion ──

async function ingestDRAMP(sb: any) {
  const { data: logRow } = await sb.from("sync_log").insert({
    source: "DRAMP", status: "running",
  }).select("id").single();

  let processed = 0, matched = 0, updated = 0;
  const errors: string[] = [];

  try {
    const res = await fetch(DRAMP_DOWNLOAD_URL);
    if (!res.ok) throw new Error(`DRAMP download failed: ${res.status}`);
    const text = await res.text();

    const lines = text.split("\n");
    const header = lines[0]?.split("\t") || [];
    const nameIdx = header.findIndex((h) => h.toLowerCase().includes("name"));
    const seqIdx = header.findIndex((h) => h.toLowerCase().includes("sequence"));
    const actIdx = header.findIndex((h) => h.toLowerCase().includes("activity") || h.toLowerCase().includes("function"));
    const srcIdx = header.findIndex((h) => h.toLowerCase().includes("source") || h.toLowerCase().includes("organism"));
    const idIdx = header.findIndex((h) => h.toLowerCase().includes("dramp_id") || h.toLowerCase() === "id");

    // Get existing peptides for matching
    const { data: existing } = await sb.from("peptides").select("id, name, slug, alternative_names, dramp_id");

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i]?.split("\t");
      if (!cols || cols.length < 2) continue;

      const drampName = cols[nameIdx] || "";
      const drampSeq = seqIdx >= 0 ? cols[seqIdx] : null;
      const drampActivity = actIdx >= 0 ? cols[actIdx] : null;
      const drampOrganism = srcIdx >= 0 ? cols[srcIdx] : null;
      const drampId = idIdx >= 0 ? cols[idIdx] : null;

      processed++;

      // Match to existing peptide
      const match = findMatch(existing || [], drampName);
      if (!match) continue;

      matched++;

      const updates: Record<string, any> = {
        dramp_id: drampId || match.dramp_id,
        last_synced_at: new Date().toISOString(),
        source_origins: appendSource(match, "DRAMP"),
      };

      if (drampSeq && !match.sequence) {
        updates.sequence = drampSeq;
        updates.sequence_length = drampSeq.length;
      }
      if (drampActivity) {
        updates.biological_activity = parseActivities(drampActivity);
      }
      if (drampOrganism) {
        updates.organism = drampOrganism;
      }

      const { error } = await sb.from("peptides").update(updates).eq("id", match.id);
      if (error) errors.push(`DRAMP ${drampName}: ${error.message}`);
      else updated++;
    }

    await updateLog(sb, logRow?.id, "success", processed, 0, updated, errors);
  } catch (e) {
    await updateLog(sb, logRow?.id, "error", processed, 0, updated, [e.message]);
    throw e;
  }

  return { processed, matched, updated, errors: errors.length };
}

// ── APD Ingestion (FASTA format) ──

async function ingestAPD(sb: any) {
  const { data: logRow } = await sb.from("sync_log").insert({
    source: "APD", status: "running",
  }).select("id").single();

  let processed = 0, matched = 0, updated = 0;
  const errors: string[] = [];

  try {
    const res = await fetch(APD_DOWNLOAD_URL);
    if (!res.ok) throw new Error(`APD download failed: ${res.status}`);
    const text = await res.text();

    // Parse FASTA entries
    const entries = parseFASTA(text);

    const { data: existing } = await sb.from("peptides").select("id, name, slug, alternative_names, apd_id, sequence");

    for (const entry of entries) {
      processed++;
      const match = findMatch(existing || [], entry.name);
      if (!match) continue;

      matched++;

      const updates: Record<string, any> = {
        apd_id: entry.id || match.apd_id,
        last_synced_at: new Date().toISOString(),
        source_origins: appendSource(match, "APD"),
      };

      if (entry.sequence && !match.sequence) {
        updates.sequence = entry.sequence;
        updates.sequence_length = entry.sequence.length;
      }

      const { error } = await sb.from("peptides").update(updates).eq("id", match.id);
      if (error) errors.push(`APD ${entry.name}: ${error.message}`);
      else updated++;
    }

    await updateLog(sb, logRow?.id, "success", processed, 0, updated, errors);
  } catch (e) {
    await updateLog(sb, logRow?.id, "error", processed, 0, updated, [e.message]);
    throw e;
  }

  return { processed, matched, updated, errors: errors.length };
}

// ── Peptipedia Ingestion (API) ──

async function ingestPeptipedia(sb: any) {
  const { data: logRow } = await sb.from("sync_log").insert({
    source: "Peptipedia", status: "running",
  }).select("id").single();

  let processed = 0, matched = 0, updated = 0;
  const errors: string[] = [];

  try {
    // Peptipedia provides a REST API for searching peptides
    const { data: existing } = await sb.from("peptides").select("id, name, slug, alternative_names, peptipedia_id, sequence, biological_activity");

    for (const pep of (existing || [])) {
      try {
        const searchRes = await fetch(`${PEPTIPEDIA_API}/peptides/search?query=${encodeURIComponent(pep.name)}&limit=3`);
        if (!searchRes.ok) {
          // API might not be available; log and skip
          if (searchRes.status === 404 || searchRes.status === 503) {
            errors.push(`Peptipedia API unavailable (${searchRes.status})`);
            break;
          }
          continue;
        }

        const results = await searchRes.json();
        const items = Array.isArray(results) ? results : results?.data || results?.results || [];
        processed++;

        if (items.length === 0) continue;

        // Find best match
        const bestMatch = items.find((item: any) =>
          item.name?.toLowerCase() === pep.name.toLowerCase()
        ) || items[0];

        matched++;

        const updates: Record<string, any> = {
          peptipedia_id: bestMatch.id || bestMatch.peptipedia_id || pep.peptipedia_id,
          last_synced_at: new Date().toISOString(),
          source_origins: appendSource(pep, "Peptipedia"),
        };

        if (bestMatch.sequence && !pep.sequence) {
          updates.sequence = bestMatch.sequence;
          updates.sequence_length = bestMatch.sequence.length;
        }
        if (bestMatch.activity && !pep.biological_activity?.length) {
          updates.biological_activity = Array.isArray(bestMatch.activity) ? bestMatch.activity : [bestMatch.activity];
        }

        const { error } = await sb.from("peptides").update(updates).eq("id", pep.id);
        if (error) errors.push(`Peptipedia ${pep.name}: ${error.message}`);
        else updated++;

        // Rate limit
        await sleep(500);
      } catch (e) {
        errors.push(`Peptipedia ${pep.name}: ${e.message}`);
      }
    }

    await updateLog(sb, logRow?.id, "success", processed, 0, updated, errors);
  } catch (e) {
    await updateLog(sb, logRow?.id, "error", processed, 0, updated, [e.message]);
    throw e;
  }

  return { processed, matched, updated, errors: errors.length };
}

// ── Helpers ──

function findMatch(peptides: any[], name: string) {
  const normalized = name.toLowerCase().trim();
  return peptides.find((p) => {
    if (p.name.toLowerCase() === normalized) return true;
    if (p.slug === normalized.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")) return true;
    if (p.alternative_names?.some((alt: string) => alt.toLowerCase() === normalized)) return true;
    return false;
  });
}

function appendSource(pep: any, source: string): string[] {
  const existing: string[] = pep.source_origins || [];
  if (existing.includes(source)) return existing;
  return [...existing, source];
}

function parseActivities(text: string): string[] {
  return text.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
}

function parseFASTA(text: string) {
  const entries: { id: string; name: string; sequence: string }[] = [];
  const blocks = text.split(">").filter(Boolean);
  for (const block of blocks) {
    const lines = block.split("\n");
    const header = lines[0] || "";
    const sequence = lines.slice(1).join("").replace(/\s/g, "");
    const idMatch = header.match(/^(\S+)/);
    const nameMatch = header.match(/\|([^|]+)/) || header.match(/^(\S+)\s+(.+)/);
    entries.push({
      id: idMatch?.[1] || "",
      name: nameMatch?.[1]?.trim() || nameMatch?.[2]?.trim() || header.trim(),
      sequence,
    });
  }
  return entries;
}

async function updateLog(sb: any, logId: string | null, status: string, processed: number, added: number, updated: number, errors: string[]) {
  if (!logId) return;
  await sb.from("sync_log").update({
    status: errors.length > 0 && status !== "error" ? "partial" : status,
    records_processed: processed,
    records_added: added,
    records_updated: updated,
    error_message: errors.length > 0 ? errors.slice(0, 10).join("; ") : null,
    details: { total_errors: errors.length },
    completed_at: new Date().toISOString(),
  }).eq("id", logId);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
