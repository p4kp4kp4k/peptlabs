import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UNIPROT_BASE = "https://rest.uniprot.org/uniprotkb";
const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { peptide_name, peptide_id, category, aliases } = await req.json();

    if (!peptide_name || !category) {
      return new Response(
        JSON.stringify({ error: "peptide_name and category required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[suggest-correction] Start: ${category} for "${peptide_name}"`);

    let result: any = null;

    switch (category) {
      case "missing_sequence":
        result = await searchSequence(peptide_name, aliases || []);
        break;
      case "no_references":
        result = await searchReferences(peptide_name);
        break;
      case "no_source":
        result = await searchSources(peptide_name, aliases || []);
        break;
      case "incomplete_data":
        result = await searchIncompleteData(peptide_name, aliases || []);
        break;
      default:
        result = null;
    }

    console.log(`[suggest-correction] Result:`, result ? "found" : "not found");

    return new Response(JSON.stringify({ suggestion: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[suggest-correction] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── UniProt sequence search ──
async function searchSequence(name: string, aliases: string[]): Promise<any> {
  const searchTerms = [name, ...aliases].filter(Boolean);

  for (const term of searchTerms) {
    try {
      const cleanTerm = term.replace(/[^a-zA-Z0-9\s-]/g, "").trim();
      const query = encodeURIComponent(cleanTerm);
      const url = `${UNIPROT_BASE}/search?query=${query}&size=3&format=json`;

      console.log(`[suggest-correction] UniProt search: "${cleanTerm}"`);

      const res = await fetch(url, {
        signal: AbortSignal.timeout(12000),
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        console.log(`[suggest-correction] UniProt status: ${res.status}`);
        continue;
      }

      const data = await res.json();
      const results = data.results || [];

      if (results.length > 0) {
        const best = results[0];
        const seq = best.sequence?.value;
        if (seq) {
          const proteinName =
            best.proteinDescription?.recommendedName?.fullName?.value ||
            best.proteinDescription?.submittedName?.[0]?.fullName?.value ||
            cleanTerm;

          console.log(`[suggest-correction] UniProt found: ${proteinName} (${seq.length} aa)`);

          return {
            field: "sequence",
            proposed_value: seq,
            source: "UniProt",
            source_id: best.primaryAccession,
            confidence: results.length === 1 ? 85 : 70,
            confidence_level: results.length === 1 ? "high" : "medium",
            change_type: "add",
            description: `Sequência encontrada no UniProt (${proteinName}, ${seq.length} aminoácidos)`,
            impact: "A sequência aparecerá na seção de informações moleculares",
            extra: {
              accession: best.primaryAccession,
              protein_name: proteinName,
              organism: best.organism?.scientificName || null,
              length: seq.length,
            },
          };
        }
      }
    } catch (e) {
      console.log(`[suggest-correction] UniProt error for "${term}":`, e.message);
    }
  }

  return null;
}

// ── PubMed references search ──
async function searchReferences(name: string): Promise<any> {
  try {
    const cleanName = name.replace(/[^a-zA-Z0-9\s-]/g, "").trim();
    const query = encodeURIComponent(`${cleanName} peptide`);

    console.log(`[suggest-correction] PubMed search: "${cleanName}"`);

    // Step 1: Search for IDs
    const searchUrl = `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${query}&retmax=5&retmode=json&sort=relevance`;
    const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });

    if (!searchRes.ok) {
      console.log(`[suggest-correction] PubMed search status: ${searchRes.status}`);
      return null;
    }

    const searchData = await searchRes.json();
    const ids = searchData.esearchresult?.idlist || [];

    if (ids.length === 0) {
      console.log(`[suggest-correction] PubMed: no results`);
      return null;
    }

    console.log(`[suggest-correction] PubMed found ${ids.length} articles`);

    // Step 2: Get summaries
    const summaryUrl = `${PUBMED_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
    const summaryRes = await fetch(summaryUrl, { signal: AbortSignal.timeout(10000) });

    if (!summaryRes.ok) return null;

    const summaryData = await summaryRes.json();
    const articles = ids
      .map((id: string) => {
        const article = summaryData.result?.[id];
        if (!article || !article.title) return null;

        // Extract journal and year
        const pubDate = article.pubdate || "";
        const year = parseInt(pubDate.substring(0, 4)) || null;

        return {
          title: article.title.replace(/<[^>]*>/g, ""),
          journal: article.fulljournalname || article.source || null,
          year,
          pmid: id,
          authors: article.authors
            ?.slice(0, 3)
            .map((a: any) => a.name)
            .join(", ") || null,
        };
      })
      .filter(Boolean);

    if (articles.length === 0) return null;

    return {
      field: "scientific_references",
      proposed_value: articles,
      source: "PubMed",
      source_id: null,
      confidence: articles.length >= 3 ? 80 : 65,
      confidence_level: articles.length >= 3 ? "high" : "medium",
      change_type: "merge",
      description: `${articles.length} referência(s) científica(s) encontrada(s) no PubMed para "${cleanName}"`,
      impact: "As referências aparecerão no bloco 'Referências Científicas' da aba Pesquisa",
      extra: { count: articles.length },
    };
  } catch (e) {
    console.log(`[suggest-correction] PubMed error:`, e.message);
    return null;
  }
}

// ── Source origins search ──
async function searchSources(name: string, aliases: string[]): Promise<any> {
  const origins: string[] = [];

  // Check UniProt
  try {
    const cleanName = name.replace(/[^a-zA-Z0-9\s-]/g, "").trim();
    const query = encodeURIComponent(cleanName);
    const res = await fetch(
      `${UNIPROT_BASE}/search?query=${query}&size=1&format=json`,
      { signal: AbortSignal.timeout(8000), headers: { Accept: "application/json" } }
    );
    if (res.ok) {
      const data = await res.json();
      if ((data.results || []).length > 0) origins.push("UniProt");
    }
  } catch {}

  // Check PubMed
  try {
    const cleanName = name.replace(/[^a-zA-Z0-9\s-]/g, "").trim();
    const query = encodeURIComponent(`${cleanName} peptide`);
    const res = await fetch(
      `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${query}&retmax=1&retmode=json`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const data = await res.json();
      if ((data.esearchresult?.idlist || []).length > 0) origins.push("PubMed");
    }
  } catch {}

  if (origins.length === 0) return null;

  return {
    field: "source_origins",
    proposed_value: origins,
    source: origins.join(", "),
    source_id: null,
    confidence: 80,
    confidence_level: "high",
    change_type: "merge",
    description: `${origins.length} origem(ns) verificável(is) encontrada(s) para "${name}"`,
    impact: "As origens serão registradas nos metadados de rastreabilidade",
    extra: { origins },
  };
}

// ── Incomplete data search (description, mechanism from UniProt) ──
async function searchIncompleteData(name: string, aliases: string[]): Promise<any> {
  try {
    const cleanName = name.replace(/[^a-zA-Z0-9\s-]/g, "").trim();
    const query = encodeURIComponent(cleanName);
    const res = await fetch(
      `${UNIPROT_BASE}/search?query=${query}&size=1&format=json`,
      { signal: AbortSignal.timeout(10000), headers: { Accept: "application/json" } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const results = data.results || [];
    if (results.length === 0) return null;

    const best = results[0];
    const functionComment = best.comments?.find(
      (c: any) => c.commentType === "FUNCTION"
    );
    const functionText = functionComment?.texts?.[0]?.value;

    if (functionText) {
      return {
        field: "mechanism",
        proposed_value: functionText,
        source: "UniProt",
        source_id: best.primaryAccession,
        confidence: 70,
        confidence_level: "medium",
        change_type: "add",
        description: `Mecanismo de ação encontrado no UniProt para "${name}"`,
        impact: "O mecanismo aparecerá na seção correspondente da página",
        extra: { accession: best.primaryAccession },
      };
    }
  } catch (e) {
    console.log(`[suggest-correction] Incomplete data error:`, e.message);
  }

  return null;
}
