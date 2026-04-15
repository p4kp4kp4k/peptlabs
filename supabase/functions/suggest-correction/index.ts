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
        result = await searchSequence(searchTerms);
        break;
      case "no_references":
        result = await searchReferences(searchTerms);
        break;
      case "no_source":
        result = await searchSources(searchTerms);
        break;
      case "incomplete_data":
        result = await searchIncompleteData(searchTerms);
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
async function searchSequence(terms: string[]): Promise<any> {
  return (await searchSequenceUniProt(terms)) ||
    (await searchSequenceNCBI(terms)) ||
    (await searchSequencePubChem(terms));
}

// ── UniProt ──
async function searchSequenceUniProt(terms: string[]): Promise<any> {
  for (const term of terms) {
    try {
      const query = encodeURIComponent(term);
      const url = `${UNIPROT_BASE}/search?query=${query}&size=3&format=json`;
      console.log(`[suggest-correction] UniProt search: "${term}"`);

      const res = await fetch(url, {
        signal: AbortSignal.timeout(12000),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) { console.log(`[suggest-correction] UniProt status: ${res.status}`); continue; }

      const data = await res.json();
      const results = data.results || [];
      if (results.length > 0) {
        const best = results[0];
        const seq = best.sequence?.value;
        if (seq) {
          const proteinName =
            best.proteinDescription?.recommendedName?.fullName?.value ||
            best.proteinDescription?.submittedName?.[0]?.fullName?.value || term;

          if (!isRelevantMatch(term, proteinName, terms)) {
            console.log(`[suggest-correction] UniProt SKIPPED: "${proteinName}" not relevant to "${term}"`);
            continue;
          }
          console.log(`[suggest-correction] UniProt found: ${proteinName} (${seq.length} aa)`);
          return {
            field: "sequence", proposed_value: seq, source: "UniProt",
            source_id: best.primaryAccession,
            confidence: results.length === 1 ? 85 : 70,
            confidence_level: results.length === 1 ? "high" : "medium",
            change_type: "add",
            description: `Sequência encontrada no UniProt (${proteinName}, ${seq.length} aminoácidos)`,
            impact: "A sequência aparecerá na seção de informações moleculares",
            extra: { accession: best.primaryAccession, protein_name: proteinName, organism: best.organism?.scientificName || null, length: seq.length },
          };
        }
      }
    } catch (e) { console.log(`[suggest-correction] UniProt error for "${term}":`, e.message); }
  }
  return null;
}

// ── NCBI Protein ──
async function searchSequenceNCBI(terms: string[]): Promise<any> {
  for (const term of terms) {
    try {
      const query = encodeURIComponent(`${term} peptide`);
      console.log(`[suggest-correction] NCBI Protein search: "${term}"`);

      const searchUrl = `${NCBI_PROTEIN_BASE}/esearch.fcgi?db=protein&term=${query}&retmax=3&retmode=json`;
      const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
      if (!searchRes.ok) { await searchRes.text(); continue; }

      const searchData = await searchRes.json();
      const ids = searchData.esearchresult?.idlist || [];
      if (ids.length === 0) continue;

      const fastaUrl = `${NCBI_PROTEIN_BASE}/efetch.fcgi?db=protein&id=${ids[0]}&rettype=fasta&retmode=text`;
      const fastaRes = await fetch(fastaUrl, { signal: AbortSignal.timeout(10000) });
      if (!fastaRes.ok) { await fastaRes.text(); continue; }

      const fastaText = await fastaRes.text();
      const lines = fastaText.split("\n");
      const header = lines[0] || "";
      const seq = lines.slice(1).join("").replace(/\s/g, "");

      if (seq && seq.length >= 3 && /^[A-Za-z]+$/.test(seq)) {
        if (!isRelevantMatch(term, header, terms)) {
          console.log(`[suggest-correction] NCBI SKIPPED: header not relevant to "${term}"`);
          continue;
        }
        console.log(`[suggest-correction] NCBI Protein found sequence (${seq.length} aa)`);
        return {
          field: "sequence", proposed_value: seq, source: "NCBI Protein",
          source_id: `GI:${ids[0]}`, confidence: 70, confidence_level: "medium", change_type: "add",
          description: `Sequência encontrada no NCBI Protein (${seq.length} aminoácidos)`,
          impact: "A sequência aparecerá na seção de informações moleculares",
          extra: { ncbi_id: ids[0], header: header.substring(0, 200), length: seq.length },
        };
      }
    } catch (e) { console.log(`[suggest-correction] NCBI Protein error for "${term}":`, e.message); }
  }
  return null;
}

// ── PubChem ──
async function searchSequencePubChem(terms: string[]): Promise<any> {
  for (const term of terms) {
    try {
      console.log(`[suggest-correction] PubChem search: "${term}"`);
      const url = `${PUBCHEM_BASE}/compound/name/${encodeURIComponent(term)}/JSON`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) { await res.text(); continue; }

      const data = await res.json();
      const compound = data?.PC_Compounds?.[0];
      if (!compound) continue;
      const cid = compound.id?.id?.cid;
      if (!cid) continue;

      const propsUrl = `${PUBCHEM_BASE}/compound/cid/${cid}/property/IUPACName,MolecularFormula,CanonicalSMILES/JSON`;
      const propsRes = await fetch(propsUrl, { signal: AbortSignal.timeout(8000) });
      if (!propsRes.ok) { await propsRes.text(); continue; }

      const propsData = await propsRes.json();
      const props = propsData?.PropertyTable?.Properties?.[0];
      if (!props) continue;

      if (props.IUPACName || props.MolecularFormula) {
        console.log(`[suggest-correction] PubChem found CID:${cid} for "${term}"`);
        return {
          field: "source_origins", proposed_value: ["PubChem"], source: "PubChem",
          source_id: `CID:${cid}`, confidence: 55, confidence_level: "medium", change_type: "merge",
          description: `Composto encontrado no PubChem (CID:${cid}) — identidade molecular confirmada`,
          impact: "O PubChem CID será adicionado às origens rastreadas",
          extra: { cid, iupac_name: (props.IUPACName || "").substring(0, 300), molecular_formula: props.MolecularFormula || "" },
        };
      }
    } catch (e) { console.log(`[suggest-correction] PubChem error for "${term}":`, e.message); }
  }
  return null;
}

// ── PubMed references search ──
async function searchReferences(terms: string[]): Promise<any> {
  for (const term of terms) {
    try {
      const query = encodeURIComponent(`${term} peptide`);
      console.log(`[suggest-correction] PubMed search: "${term}"`);

      const searchUrl = `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${query}&retmax=5&retmode=json&sort=relevance`;
      const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
      if (!searchRes.ok) continue;

      const searchData = await searchRes.json();
      const ids = searchData.esearchresult?.idlist || [];
      if (ids.length === 0) continue;

      console.log(`[suggest-correction] PubMed found ${ids.length} articles for "${term}"`);

      const summaryUrl = `${PUBMED_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
      const summaryRes = await fetch(summaryUrl, { signal: AbortSignal.timeout(10000) });
      if (!summaryRes.ok) continue;

      const summaryData = await summaryRes.json();
      const articles = ids
        .map((id: string) => {
          const article = summaryData.result?.[id];
          if (!article || !article.title) return null;
          const year = parseInt((article.pubdate || "").substring(0, 4)) || null;
          return {
            title: article.title.replace(/<[^>]*>/g, ""),
            journal: article.fulljournalname || article.source || null,
            year, pmid: id,
            authors: article.authors?.slice(0, 3).map((a: any) => a.name).join(", ") || null,
          };
        })
        .filter(Boolean);

      if (articles.length > 0) {
        return {
          field: "scientific_references", proposed_value: articles, source: "PubMed",
          source_id: null,
          confidence: articles.length >= 3 ? 80 : 65,
          confidence_level: articles.length >= 3 ? "high" : "medium",
          change_type: "merge",
          description: `${articles.length} referência(s) científica(s) encontrada(s) no PubMed para "${term}"`,
          impact: "As referências aparecerão no bloco 'Referências Científicas' da aba Pesquisa",
          extra: { count: articles.length },
        };
      }
    } catch (e) { console.log(`[suggest-correction] PubMed error:`, e.message); }
  }
  return null;
}

// ── Source origins search ──
async function searchSources(terms: string[]): Promise<any> {
  const origins: Array<{ source: string; id: string; detail: string }> = [];

  // Check UniProt
  for (const term of terms) {
    if (origins.find(o => o.source === "UniProt")) break;
    try {
      console.log(`[suggest-correction] Source UniProt search: "${term}"`);
      const res = await fetch(
        `${UNIPROT_BASE}/search?query=${encodeURIComponent(term)}&size=3&format=json`,
        { signal: AbortSignal.timeout(8000), headers: { Accept: "application/json" } }
      );
      if (res.ok) {
        const data = await res.json();
        for (const best of (data.results || [])) {
          if (best?.primaryAccession) {
            const proteinName = best.proteinDescription?.recommendedName?.fullName?.value || term;
            if (isRelevantMatch(term, proteinName, terms)) {
              origins.push({ source: "UniProt", id: best.primaryAccession, detail: proteinName });
              break;
            }
          }
        }
      }
    } catch {}
  }

  // Check PubMed
  for (const term of terms) {
    if (origins.find(o => o.source === "PubMed")) break;
    try {
      console.log(`[suggest-correction] Source PubMed search: "${term}"`);
      const res = await fetch(
        `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(`${term} peptide`)}&retmax=5&retmode=json`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const ids = (await res.json()).esearchresult?.idlist || [];
        if (ids.length > 0) origins.push({ source: "PubMed", id: `PMID:${ids[0]}`, detail: `${ids.length} artigo(s) encontrado(s)` });
      }
    } catch {}
  }

  // Check PubChem
  for (const term of terms) {
    if (origins.find(o => o.source === "PubChem")) break;
    try {
      console.log(`[suggest-correction] Source PubChem search: "${term}"`);
      const res = await fetch(`${PUBCHEM_BASE}/compound/name/${encodeURIComponent(term)}/JSON`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const cid = (await res.json())?.PC_Compounds?.[0]?.id?.id?.cid;
        if (cid) origins.push({ source: "PubChem", id: `CID:${cid}`, detail: `Composto identificado (CID:${cid})` });
      }
    } catch {}
  }

  // Check NCBI Protein
  for (const term of terms) {
    if (origins.find(o => o.source === "NCBI Protein")) break;
    try {
      console.log(`[suggest-correction] Source NCBI search: "${term}"`);
      const res = await fetch(
        `${NCBI_PROTEIN_BASE}/esearch.fcgi?db=protein&term=${encodeURIComponent(`${term} peptide`)}&retmax=1&retmode=json`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const ids = (await res.json()).esearchresult?.idlist || [];
        if (ids.length > 0) origins.push({ source: "NCBI Protein", id: `GI:${ids[0]}`, detail: `Proteína encontrada` });
      }
    } catch {}
  }

  if (origins.length === 0) return null;

  return {
    field: "source_origins",
    proposed_value: origins.map(o => o.source),
    source: origins.map(o => o.source).join(", "),
    source_id: origins.map(o => o.id).join(", "),
    confidence: origins.length >= 3 ? 90 : origins.length >= 2 ? 80 : 65,
    confidence_level: origins.length >= 2 ? "high" : "medium",
    change_type: "merge",
    description: `${origins.length} origem(ns) com evidência real`,
    impact: "As origens serão registradas nos metadados de rastreabilidade",
    extra: { origins: origins.map(o => ({ source: o.source, id: o.id, detail: o.detail })) },
  };
}

// ── Incomplete data search ──
async function searchIncompleteData(terms: string[]): Promise<any> {
  for (const term of terms) {
    try {
      const res = await fetch(
        `${UNIPROT_BASE}/search?query=${encodeURIComponent(term)}&size=1&format=json`,
        { signal: AbortSignal.timeout(10000), headers: { Accept: "application/json" } }
      );
      if (!res.ok) continue;

      const data = await res.json();
      const results = data.results || [];
      if (results.length === 0) continue;

      const best = results[0];
      const functionComment = best.comments?.find((c: any) => c.commentType === "FUNCTION");
      const functionText = functionComment?.texts?.[0]?.value;

      if (functionText) {
        return {
          field: "mechanism", proposed_value: functionText, source: "UniProt",
          source_id: best.primaryAccession, confidence: 70, confidence_level: "medium", change_type: "add",
          description: `Mecanismo de ação encontrado no UniProt para "${term}"`,
          impact: "O mecanismo aparecerá na seção correspondente da página",
          extra: { accession: best.primaryAccession },
        };
      }
    } catch (e) { console.log(`[suggest-correction] Incomplete data error:`, e.message); }
  }
  return null;
}