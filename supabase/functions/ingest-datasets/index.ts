import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Updated URLs from official download pages
const DRAMP_GENERAL_URL = "https://dramp.cpu-bioinfor.org/downloads/download.php?filename=download_data/DRAMP3.0_new/general_amps.txt";
const DRAMP_CLINICAL_URL = "https://dramp.cpu-bioinfor.org/downloads/download.php?filename=download_data/DRAMP3.0_new/clinical_amps.xlsx";
const PEPTIPEDIA_API = "https://app.peptipedia.cl/api";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const source = body.source || "all";

    const results: Record<string, any> = {};

    if (source === "all" || source === "dramp") {
      results.dramp = await ingestDRAMP(sb);
    }

    if (source === "all" || source === "peptipedia") {
      results.peptipedia = await ingestPeptipedia(sb);
    }

    // APD has SSL certificate issues; skip for now and log
    if (source === "all" || source === "apd") {
      results.apd = { processed: 0, matched: 0, updated: 0, errors: 0, note: "APD server has invalid SSL certificate; skipped" };
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

// ── DRAMP Ingestion (TSV from DRAMP 3.0) ──

async function ingestDRAMP(sb: any) {
  const { data: logRow } = await sb.from("sync_log").insert({
    source: "DRAMP", status: "running",
  }).select("id").single();

  let processed = 0, matched = 0, updated = 0;
  const errors: string[] = [];

  try {
    console.log("Fetching DRAMP general_amps.txt...");
    const res = await fetch(DRAMP_GENERAL_URL);
    if (!res.ok) throw new Error(`DRAMP download failed: ${res.status}`);
    const text = await res.text();
    console.log(`DRAMP data size: ${text.length} bytes`);

    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      throw new Error(`DRAMP data appears empty or malformed (${lines.length} lines)`);
    }

    // Parse header to find column indices
    const header = lines[0].split("\t").map((h) => h.trim().toLowerCase());
    console.log("DRAMP columns:", JSON.stringify(header.slice(0, 15)));

    const colMap: Record<string, number> = {};
    header.forEach((h, i) => {
      if (h.includes("dramp") && h.includes("id")) colMap.id = i;
      if (h === "name" || h === "peptide_name" || h === "peptide name") colMap.name = i;
      if (h === "sequence" || h === "seq") colMap.sequence = i;
      if (h.includes("activity") || h.includes("function")) colMap.activity = i;
      if (h.includes("source") || h.includes("organism") || h.includes("origin")) colMap.organism = i;
      if (h.includes("length") || h === "len") colMap.length = i;
      if (h.includes("structure") || h.includes("3d")) colMap.structure = i;
      if (h.includes("target")) colMap.target = i;
      if (h.includes("reference") || h.includes("pubmed") || h.includes("pmid")) colMap.ref = i;
    });
    console.log("DRAMP column map:", JSON.stringify(colMap));

    // Get existing peptides for matching
    const { data: existing } = await sb.from("peptides")
      .select("id, name, slug, alternative_names, dramp_id, sequence, biological_activity, source_origins");

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split("\t");
      if (cols.length < 3) continue;

      const drampName = (colMap.name !== undefined ? cols[colMap.name] : cols[1] || "").trim();
      const drampSeq = colMap.sequence !== undefined ? cols[colMap.sequence]?.trim() : null;
      const drampActivity = colMap.activity !== undefined ? cols[colMap.activity]?.trim() : null;
      const drampOrganism = colMap.organism !== undefined ? cols[colMap.organism]?.trim() : null;
      const drampId = colMap.id !== undefined ? cols[colMap.id]?.trim() : null;

      if (!drampName) continue;
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

      if (drampSeq && drampSeq.length > 0 && !match.sequence) {
        updates.sequence = drampSeq;
        updates.sequence_length = drampSeq.length;
      }
      if (drampActivity) {
        updates.biological_activity = parseActivities(drampActivity);
      }
      if (drampOrganism && drampOrganism !== "-" && drampOrganism !== "NA") {
        updates.organism = drampOrganism;
      }

      const { error } = await sb.from("peptides").update(updates).eq("id", match.id);
      if (error) errors.push(`DRAMP ${drampName}: ${error.message}`);
      else updated++;
    }

    console.log(`DRAMP: processed=${processed}, matched=${matched}, updated=${updated}`);
    await updateLog(sb, logRow?.id, "success", processed, 0, updated, errors);
  } catch (e) {
    console.error("DRAMP error:", e.message);
    await updateLog(sb, logRow?.id, "error", processed, 0, updated, [e.message]);
  }

  return { processed, matched, updated, errors: errors.length };
}

// ── Peptipedia Ingestion ──

async function ingestPeptipedia(sb: any) {
  const { data: logRow } = await sb.from("sync_log").insert({
    source: "Peptipedia", status: "running",
  }).select("id").single();

  let processed = 0, matched = 0, updated = 0;
  const errors: string[] = [];

  try {
    const { data: existing } = await sb.from("peptides")
      .select("id, name, slug, alternative_names, peptipedia_id, sequence, biological_activity, source_origins");

    // Try different Peptipedia API endpoints
    const apiEndpoints = [
      `${PEPTIPEDIA_API}/search`,
      `${PEPTIPEDIA_API}/peptide/search`,
      `https://peptipedia.cl/api/search`,
      `https://peptipedia.cl/api/peptides/search`,
    ];

    let workingEndpoint: string | null = null;

    // Test endpoints
    for (const ep of apiEndpoints) {
      try {
        const testRes = await fetch(`${ep}?query=BPC-157&limit=1`, {
          signal: AbortSignal.timeout(5000),
        });
        if (testRes.ok) {
          workingEndpoint = ep;
          console.log(`Peptipedia working endpoint: ${ep}`);
          break;
        }
        await testRes.text(); // consume
      } catch {
        continue;
      }
    }

    // Also try POST-based search
    if (!workingEndpoint) {
      for (const ep of [`${PEPTIPEDIA_API}/search`, `https://peptipedia.cl/api/search`]) {
        try {
          const testRes = await fetch(ep, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: "BPC-157", limit: 1 }),
            signal: AbortSignal.timeout(5000),
          });
          if (testRes.ok) {
            workingEndpoint = ep;
            console.log(`Peptipedia working POST endpoint: ${ep}`);
            break;
          }
          await testRes.text();
        } catch {
          continue;
        }
      }
    }

    if (!workingEndpoint) {
      const msg = "Peptipedia API: no working endpoint found";
      console.error(msg);
      await updateLog(sb, logRow?.id, "error", 0, 0, 0, [msg]);
      return { processed: 0, matched: 0, updated: 0, errors: 1, note: msg };
    }

    for (const pep of (existing || [])) {
      try {
        // Try GET first, then POST
        let items: any[] = [];
        try {
          const searchRes = await fetch(`${workingEndpoint}?query=${encodeURIComponent(pep.name)}&limit=3`, {
            signal: AbortSignal.timeout(8000),
          });
          if (searchRes.ok) {
            const json = await searchRes.json();
            items = Array.isArray(json) ? json : json?.data || json?.results || json?.peptides || [];
          } else {
            await searchRes.text();
          }
        } catch {
          // Try POST
          try {
            const searchRes = await fetch(workingEndpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ query: pep.name, limit: 3 }),
              signal: AbortSignal.timeout(8000),
            });
            if (searchRes.ok) {
              const json = await searchRes.json();
              items = Array.isArray(json) ? json : json?.data || json?.results || json?.peptides || [];
            } else {
              await searchRes.text();
            }
          } catch {
            // skip
          }
        }

        processed++;

        if (!items || items.length === 0) continue;

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

        await sleep(600);
      } catch (e) {
        errors.push(`Peptipedia ${pep.name}: ${e.message}`);
      }
    }

    await updateLog(sb, logRow?.id, errors.length > 0 ? "partial" : "success", processed, 0, updated, errors);
  } catch (e) {
    console.error("Peptipedia error:", e.message);
    await updateLog(sb, logRow?.id, "error", processed, 0, updated, [e.message]);
  }

  return { processed, matched, updated, errors: errors.length };
}

// ── Helpers ──

function findMatch(peptides: any[], name: string) {
  const normalized = name.toLowerCase().trim();
  return peptides.find((p) => {
    if (p.name.toLowerCase() === normalized) return true;
    if (p.name.toLowerCase().includes(normalized) || normalized.includes(p.name.toLowerCase())) return true;
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
  return text.split(/[;,|]/).map((s) => s.trim()).filter((s) => s && s !== "-" && s !== "NA");
}

async function updateLog(sb: any, logId: string | null, status: string, processed: number, added: number, updated: number, errors: string[]) {
  if (!logId) return;
  await sb.from("sync_log").update({
    status,
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
