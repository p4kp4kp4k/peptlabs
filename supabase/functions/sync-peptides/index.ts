import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const BATCH_SIZE = 5; // respect NCBI rate limits (3 req/s without API key)

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const source = body.source || "all"; // "pubmed" | "ncbi_protein" | "all"
    const slugFilter = body.slug || null; // optional: sync single peptide
    const offset = body.offset || 0;
    const limit = body.limit || 10; // process in small chunks to avoid timeout

    // Get peptides to sync
    let query = sb.from("peptides").select("id, name, slug, alternative_names, ncbi_protein_id, sequence").order("name").range(offset, offset + limit - 1);
    if (slugFilter) query = query.eq("slug", slugFilter);
    const { data: peptides, error: pErr } = await query;
    if (pErr) throw pErr;

    // Create sync log
    const { data: logRow } = await sb.from("sync_log").insert({
      source: source === "all" ? "pubmed+ncbi_protein" : source,
      status: "running",
      records_processed: 0,
    }).select("id").single();
    const logId = logRow?.id;

    let processed = 0, added = 0, updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < peptides!.length; i += BATCH_SIZE) {
      const batch = peptides!.slice(i, i + BATCH_SIZE);

      for (const pep of batch) {
        try {
          const searchTerms = [pep.name, ...(pep.alternative_names || [])].filter(Boolean);

          // ── PubMed references ──
          if (source === "all" || source === "pubmed") {
            const refs = await fetchPubMedRefs(searchTerms, pep.name);
            for (const ref of refs) {
              const { error: upsertErr } = await sb.from("peptide_references").upsert(
                { peptide_id: pep.id, pmid: ref.pmid, ...ref },
                { onConflict: "peptide_id,pmid" }
              );
              if (upsertErr) errors.push(`Ref ${ref.pmid}: ${upsertErr.message}`);
              else added++;
            }
          }

          // ── NCBI Protein sequence ──
          if (source === "all" || source === "ncbi_protein") {
            const proteinData = await fetchNCBIProtein(searchTerms);
            if (proteinData) {
              const { error: upErr } = await sb.from("peptides").update({
                sequence: proteinData.sequence,
                sequence_length: proteinData.sequence?.length || null,
                ncbi_protein_id: proteinData.accession,
                organism: proteinData.organism || null,
                last_synced_at: new Date().toISOString(),
                source_origins: appendSource(pep, "NCBI_Protein"),
              }).eq("id", pep.id);
              if (upErr) errors.push(`Protein ${pep.name}: ${upErr.message}`);
              else updated++;
            }
          }

          processed++;
        } catch (e) {
          errors.push(`${pep.name}: ${e.message}`);
        }
      }

      // Rate limit pause between batches
      if (i + BATCH_SIZE < peptides!.length) await sleep(1100);
    }

    // Update sync log
    if (logId) {
      await sb.from("sync_log").update({
        status: errors.length > 0 ? "partial" : "success",
        records_processed: processed,
        records_added: added,
        records_updated: updated,
        error_message: errors.length > 0 ? errors.slice(0, 10).join("; ") : null,
        details: { total_errors: errors.length },
        completed_at: new Date().toISOString(),
      }).eq("id", logId);
    }

    return new Response(JSON.stringify({
      success: true, processed, added, updated, errors: errors.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("sync-peptides error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── PubMed search + fetch ──

async function fetchPubMedRefs(terms: string[], peptideName: string) {
  const query = terms.map((t) => `"${t}"[Title/Abstract]`).join(" OR ");
  const searchUrl = `${NCBI_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query + " AND peptide")}&retmax=15&retmode=json&sort=relevance`;

  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  const ids: string[] = searchData?.esearchresult?.idlist || [];
  if (ids.length === 0) return [];

  await sleep(350);

  // Fetch summaries
  const sumUrl = `${NCBI_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
  const sumRes = await fetch(sumUrl);
  const sumData = await sumRes.json();
  const results = sumData?.result || {};

  await sleep(350);

  // Fetch abstracts
  const fetchUrl = `${NCBI_BASE}/efetch.fcgi?db=pubmed&id=${ids.join(",")}&rettype=abstract&retmode=xml`;
  const fetchRes = await fetch(fetchUrl);
  const xmlText = await fetchRes.text();
  const abstractMap = parseAbstracts(xmlText, ids);

  const refs: any[] = [];
  for (const id of ids) {
    const art = results[id];
    if (!art || art.error) continue;

    // Filter: title must relate to peptide
    const title = art.title || "";
    const isRelevant = terms.some((t) =>
      title.toLowerCase().includes(t.toLowerCase())
    ) || title.toLowerCase().includes("peptid");
    if (!isRelevant) continue;

    const authors = (art.authors || []).map((a: any) => a.name).filter(Boolean);
    refs.push({
      pmid: id,
      title,
      authors,
      journal: art.fulljournalname || art.source || "",
      year: parseInt(art.pubdate?.split(" ")[0]) || null,
      abstract_text: abstractMap[id] || null,
      doi: extractDoi(art.articleids || []),
      source: "pubmed",
    });
  }

  return refs;
}

function parseAbstracts(xml: string, ids: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const id of ids) {
    const pmidPattern = `<PMID[^>]*>${id}</PMID>`;
    const idx = xml.search(new RegExp(pmidPattern));
    if (idx === -1) continue;

    const afterPmid = xml.substring(idx);
    const absMatch = afterPmid.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
    if (absMatch) {
      map[id] = absMatch[1].replace(/<[^>]+>/g, "").trim();
    }
  }
  return map;
}

function extractDoi(articleIds: any[]): string | null {
  const doi = articleIds.find((a: any) => a.idtype === "doi");
  return doi?.value || null;
}

// ── NCBI Protein search ──

async function fetchNCBIProtein(terms: string[]) {
  const query = terms.map((t) => `"${t}"`).join(" OR ");
  const searchUrl = `${NCBI_BASE}/esearch.fcgi?db=protein&term=${encodeURIComponent(query + " AND peptide")}&retmax=1&retmode=json&sort=relevance`;

  const res = await fetch(searchUrl);
  const data = await res.json();
  const ids = data?.esearchresult?.idlist || [];
  if (ids.length === 0) return null;

  await sleep(350);

  // Fetch protein details in FASTA
  const fastaUrl = `${NCBI_BASE}/efetch.fcgi?db=protein&id=${ids[0]}&rettype=fasta&retmode=text`;
  const fastaRes = await fetch(fastaUrl);
  const fastaText = await fastaRes.text();

  // Parse FASTA
  const lines = fastaText.split("\n");
  const header = lines[0] || "";
  const sequence = lines.slice(1).join("").replace(/\s/g, "");

  // Extract organism from header
  const orgMatch = header.match(/\[([^\]]+)\]/);

  await sleep(350);

  // Fetch summary for accession
  const sumUrl = `${NCBI_BASE}/esummary.fcgi?db=protein&id=${ids[0]}&retmode=json`;
  const sumRes = await fetch(sumUrl);
  const sumData = await sumRes.json();
  const result = sumData?.result?.[ids[0]];

  return {
    sequence: sequence || null,
    accession: result?.accessionversion || result?.caption || ids[0],
    organism: orgMatch?.[1] || result?.organism?.scientificname || null,
  };
}

// ── Helpers ──

function appendSource(pep: any, source: string): string[] {
  const existing: string[] = pep.source_origins || [];
  if (existing.includes(source)) return existing;
  return [...existing, source];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
