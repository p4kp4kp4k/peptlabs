import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const UNIPROT_BASE = "https://rest.uniprot.org/uniprotkb";
const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const NCBI_PROTEIN_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const PUBCHEM_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";

// ── Smart name cleaning: normalize accents instead of stripping, remove parenthetical content ──
function buildSearchTerms(name: string, aliases: string[]): string[] {
  const terms: string[] = [];
  const seen = new Set<string>();

  const normalize = (s: string): string =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const addTerm = (t: string) => {
    const cleaned = normalize(t).replace(/[^a-zA-Z0-9\s\-]/g, "").trim();
    if (cleaned && cleaned.length >= 2 && !seen.has(cleaned.toLowerCase())) {
      seen.add(cleaned.toLowerCase());
      terms.push(cleaned);
    }
  };

  // Full name without parentheses content
  const baseName = name.replace(/\s*\(.*?\)\s*/g, " ").trim();
  addTerm(baseName);

  // Parenthetical content as separate term
  const parenMatch = name.match(/\(([^)]+)\)/);
  if (parenMatch) addTerm(parenMatch[1]);

  // Full name as-is
  addTerm(name);

  // Each alias
  for (const alias of aliases) {
    if (alias) addTerm(alias);
  }

  // Core identifier (e.g. "BPC-157" from "BPC-157 Oral")
  const coreParts = baseName.split(/\s+/);
  if (coreParts.length > 1) {
    addTerm(coreParts[0]); // first word often is the identifier
    // Also try first two words for compound names
    if (coreParts.length > 2) addTerm(`${coreParts[0]} ${coreParts[1]}`);
  }

  return terms;
}

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

    const searchTerms = buildSearchTerms(peptide_name, aliases || []);
    console.log(`[suggest-correction] Start: ${category} for "${peptide_name}" → terms: ${searchTerms.join(", ")}`);

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

// ── Name relevance check to avoid false positives ──
function isRelevantMatch(searchTerm: string, resultName: string, allTerms: string[]): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedResult = normalize(resultName);

  for (const term of [searchTerm, ...allTerms]) {
    const normalizedTerm = normalize(term);
    if (!normalizedTerm) continue;
    // Direct substring match
    if (normalizedResult.includes(normalizedTerm) || normalizedTerm.includes(normalizedResult)) return true;
    // Core name match (e.g. "bpc157" in "bodyprotectioncompound157")
    const core = normalizedTerm.replace(/oral|injectable|nasal|subcutaneous/g, "").trim();
    if (core && normalizedResult.includes(core)) return true;
  }
  return false;
}

// ── Multi-source sequence search ──
async function searchSequence(name: string, aliases: string[]): Promise<any> {
  const result =
    (await searchSequenceUniProt(name, aliases)) ||
    (await searchSequenceNCBI(name, aliases)) ||
    (await searchSequencePubChem(name, aliases));
  return result;
}

// ── UniProt ──
async function searchSequenceUniProt(name: string, aliases: string[]): Promise<any> {
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

          // ── Relevance check: reject false positives ──
          if (!isRelevantMatch(cleanTerm, proteinName, searchTerms)) {
            console.log(`[suggest-correction] UniProt SKIPPED: "${proteinName}" not relevant to "${cleanTerm}"`);
            continue;
          }

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

// ── NCBI Protein (via ESearch + EFetch) ──
async function searchSequenceNCBI(name: string, aliases: string[]): Promise<any> {
  const searchTerms = [name, ...aliases].filter(Boolean);

  for (const term of searchTerms) {
    try {
      const cleanTerm = term.replace(/[^a-zA-Z0-9\s-]/g, "").trim();
      const query = encodeURIComponent(`${cleanTerm} peptide`);

      console.log(`[suggest-correction] NCBI Protein search: "${cleanTerm}"`);

      // Step 1: Search for protein IDs
      const searchUrl = `${NCBI_PROTEIN_BASE}/esearch.fcgi?db=protein&term=${query}&retmax=3&retmode=json`;
      const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
      if (!searchRes.ok) { await searchRes.text(); continue; }

      const searchData = await searchRes.json();
      const ids = searchData.esearchresult?.idlist || [];
      if (ids.length === 0) continue;

      console.log(`[suggest-correction] NCBI Protein found ${ids.length} IDs`);

      // Step 2: Fetch FASTA for first result
      const fastaUrl = `${NCBI_PROTEIN_BASE}/efetch.fcgi?db=protein&id=${ids[0]}&rettype=fasta&retmode=text`;
      const fastaRes = await fetch(fastaUrl, { signal: AbortSignal.timeout(10000) });
      if (!fastaRes.ok) { await fastaRes.text(); continue; }

      const fastaText = await fastaRes.text();
      const lines = fastaText.split("\n");
      const header = lines[0] || "";
      const seq = lines.slice(1).join("").replace(/\s/g, "");

      if (seq && seq.length >= 3 && /^[A-Za-z]+$/.test(seq)) {
        // ── Relevance check ──
        if (!isRelevantMatch(cleanTerm, header, searchTerms)) {
          console.log(`[suggest-correction] NCBI SKIPPED: header not relevant to "${cleanTerm}"`);
          continue;
        }

        console.log(`[suggest-correction] NCBI Protein found sequence (${seq.length} aa)`);

        return {
          field: "sequence",
          proposed_value: seq,
          source: "NCBI Protein",
          source_id: `GI:${ids[0]}`,
          confidence: 70,
          confidence_level: "medium",
          change_type: "add",
          description: `Sequência encontrada no NCBI Protein (${seq.length} aminoácidos)`,
          impact: "A sequência aparecerá na seção de informações moleculares",
          extra: {
            ncbi_id: ids[0],
            header: header.substring(0, 200),
            length: seq.length,
          },
        };
      }
    } catch (e) {
      console.log(`[suggest-correction] NCBI Protein error for "${term}":`, e.message);
    }
  }

  return null;
}

// ── PubChem (compound search → canonical SMILES or IUPAC, fallback for small peptides) ──
async function searchSequencePubChem(name: string, aliases: string[]): Promise<any> {
  const searchTerms = [name, ...aliases].filter(Boolean);

  for (const term of searchTerms) {
    try {
      const cleanTerm = term.replace(/[^a-zA-Z0-9\s-]/g, "").trim();

      console.log(`[suggest-correction] PubChem search: "${cleanTerm}"`);

      // Search compound by name
      const url = `${PUBCHEM_BASE}/compound/name/${encodeURIComponent(cleanTerm)}/JSON`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

      if (!res.ok) {
        await res.text();
        continue;
      }

      const data = await res.json();
      const compound = data?.PC_Compounds?.[0];
      if (!compound) continue;

      const cid = compound.id?.id?.cid;
      if (!cid) continue;

      // Try to get amino acid sequence from compound properties
      const propsUrl = `${PUBCHEM_BASE}/compound/cid/${cid}/property/IUPACName,MolecularFormula,CanonicalSMILES/JSON`;
      const propsRes = await fetch(propsUrl, { signal: AbortSignal.timeout(8000) });
      if (!propsRes.ok) { await propsRes.text(); continue; }

      const propsData = await propsRes.json();
      const props = propsData?.PropertyTable?.Properties?.[0];
      if (!props) continue;

      const iupacName = props.IUPACName || "";
      const formula = props.MolecularFormula || "";

      // PubChem doesn't give amino acid sequences directly,
      // but we can report the molecular identity as useful metadata
      if (iupacName || formula) {
        console.log(`[suggest-correction] PubChem found CID:${cid} for "${cleanTerm}"`);

        return {
          field: "source_origins",
          proposed_value: ["PubChem"],
          source: "PubChem",
          source_id: `CID:${cid}`,
          confidence: 55,
          confidence_level: "medium",
          change_type: "merge",
          description: `Composto encontrado no PubChem (CID:${cid}) — identidade molecular confirmada`,
          impact: "O PubChem CID será adicionado às origens rastreadas",
          extra: {
            cid,
            iupac_name: iupacName.substring(0, 300),
            molecular_formula: formula,
          },
        };
      }
    } catch (e) {
      console.log(`[suggest-correction] PubChem error for "${term}":`, e.message);
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

// ── Source origins search (REQUIRES real evidence, not just search hits) ──
async function searchSources(name: string, aliases: string[]): Promise<any> {
  const origins: Array<{ source: string; id: string; detail: string }> = [];
  const searchTerms = [name, ...aliases].filter(Boolean);

  // Check UniProt — try all terms, only count if we get an accession ID
  for (const term of searchTerms) {
    if (origins.find(o => o.source === "UniProt")) break;
    try {
      const cleanTerm = term.replace(/[^a-zA-Z0-9\s-]/g, "").trim();
      if (!cleanTerm) continue;
      const query = encodeURIComponent(cleanTerm);
      console.log(`[suggest-correction] Source UniProt search: "${cleanTerm}"`);
      const res = await fetch(
        `${UNIPROT_BASE}/search?query=${query}&size=3&format=json`,
        { signal: AbortSignal.timeout(8000), headers: { Accept: "application/json" } }
      );
      if (res.ok) {
        const data = await res.json();
        const results = data.results || [];
        for (const best of results) {
          if (best?.primaryAccession) {
            const proteinName = best.proteinDescription?.recommendedName?.fullName?.value || cleanTerm;
            if (isRelevantMatch(cleanTerm, proteinName, searchTerms)) {
              origins.push({
                source: "UniProt",
                id: best.primaryAccession,
                detail: proteinName,
              });
              break;
            }
          }
        }
      }
    } catch {}
  }

  // Check PubMed — try all terms, only count if we get at least one real PMID
  for (const term of searchTerms) {
    if (origins.find(o => o.source === "PubMed")) break;
    try {
      const cleanTerm = term.replace(/[^a-zA-Z0-9\s-]/g, "").trim();
      if (!cleanTerm) continue;
      const query = encodeURIComponent(`${cleanTerm} peptide`);
      console.log(`[suggest-correction] Source PubMed search: "${cleanTerm}"`);
      const res = await fetch(
        `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${query}&retmax=5&retmode=json`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = await res.json();
        const ids = data.esearchresult?.idlist || [];
        if (ids.length > 0) {
          origins.push({
            source: "PubMed",
            id: `PMID:${ids[0]}`,
            detail: `${ids.length} artigo(s) encontrado(s)`,
          });
        }
      }
    } catch {}
  }

  // Check PubChem — try to find compound CID
  for (const term of searchTerms) {
    if (origins.find(o => o.source === "PubChem")) break;
    try {
      const cleanTerm = term.replace(/[^a-zA-Z0-9\s-]/g, "").trim();
      if (!cleanTerm) continue;
      console.log(`[suggest-correction] Source PubChem search: "${cleanTerm}"`);
      const url = `${PUBCHEM_BASE}/compound/name/${encodeURIComponent(cleanTerm)}/JSON`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json();
        const cid = data?.PC_Compounds?.[0]?.id?.id?.cid;
        if (cid) {
          origins.push({
            source: "PubChem",
            id: `CID:${cid}`,
            detail: `Composto identificado (CID:${cid})`,
          });
        }
      }
    } catch {}
  }

  // Check NCBI Protein
  for (const term of searchTerms) {
    if (origins.find(o => o.source === "NCBI Protein")) break;
    try {
      const cleanTerm = term.replace(/[^a-zA-Z0-9\s-]/g, "").trim();
      if (!cleanTerm) continue;
      const query = encodeURIComponent(`${cleanTerm} peptide`);
      console.log(`[suggest-correction] Source NCBI search: "${cleanTerm}"`);
      const searchUrl = `${NCBI_PROTEIN_BASE}/esearch.fcgi?db=protein&term=${query}&retmax=1&retmode=json`;
      const res = await fetch(searchUrl, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json();
        const ids = data.esearchresult?.idlist || [];
        if (ids.length > 0) {
          origins.push({
            source: "NCBI Protein",
            id: `GI:${ids[0]}`,
            detail: `Proteína encontrada`,
          });
        }
      }
    } catch {}
  }

  if (origins.length === 0) return null;

  // Return structured origins with evidence, not just names
  return {
    field: "source_origins",
    proposed_value: origins.map(o => o.source),
    source: origins.map(o => o.source).join(", "),
    source_id: origins.map(o => o.id).join(", "),
    confidence: origins.length >= 3 ? 90 : origins.length >= 2 ? 80 : 65,
    confidence_level: origins.length >= 2 ? "high" : "medium",
    change_type: "merge",
    description: `${origins.length} origem(ns) com evidência real para "${name}"`,
    impact: "As origens serão registradas nos metadados de rastreabilidade",
    extra: {
      origins: origins.map(o => ({
        source: o.source,
        id: o.id,
        detail: o.detail,
      })),
    },
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