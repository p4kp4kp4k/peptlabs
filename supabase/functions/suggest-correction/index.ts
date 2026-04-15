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

// ── Valid peptide DB columns ──
const VALID_PEPTIDE_FIELDS = new Set([
  "name","slug","category","description","benefits","dosage_info","side_effects",
  "mechanism","classification","half_life","reconstitution","alternative_names",
  "timeline","dosage_table","protocol_phases","reconstitution_steps","mechanism_points",
  "interactions","stacks","scientific_references","goals","application","sequence",
  "sequence_length","organism","biological_activity","structure_info","source_origins",
  "confidence_score","ncbi_protein_id","dramp_id","apd_id","peptipedia_id",
  "tier","access_level","evidence_level",
]);

// ── Field mapping: external field names → valid DB columns ──
const FIELD_MAP: Record<string, string> = {
  "adverse_events": "side_effects",
  "regulatory_update": "side_effects",
};

// ── Smart name cleaning ──
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

  const baseName = name.replace(/\s*\(.*?\)\s*/g, " ").trim();
  addTerm(baseName);

  const parenMatch = name.match(/\(([^)]+)\)/);
  if (parenMatch) addTerm(parenMatch[1]);

  addTerm(name);

  for (const alias of aliases) {
    if (alias) addTerm(alias);
  }

  const coreParts = baseName.split(/\s+/);
  if (coreParts.length > 1) {
    addTerm(coreParts[0]);
    if (coreParts.length > 2) addTerm(`${coreParts[0]} ${coreParts[1]}`);
  }

  return terms;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { peptide_name, peptide_id, category, aliases, finding_data } = await req.json();

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
      case "cross_source_conflict":
        result = handleCrossSourceConflict(finding_data, searchTerms);
        break;
      case "no_protocol":
        result = await searchProtocol(searchTerms);
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

// ── Cross-source conflict handler ──
function handleCrossSourceConflict(findingData: any, terms: string[]): any {
  if (!findingData) return null;
  
  const { value_a, value_b, source_a, source_b, title, description } = findingData;
  if (!value_b || !source_b) return null;

  // Determine which field is conflicting from the title
  let field = "sequence"; // default
  if (title?.includes("adverse_events") || title?.includes("regulatory_update")) {
    field = "side_effects";
  } else if (title?.includes("sequence")) {
    field = "sequence";
  } else if (title?.includes("mechanism")) {
    field = "mechanism";
  } else if (title?.includes("description")) {
    field = "description";
  }

  // Map invalid external field names to valid ones
  const mappedField = FIELD_MAP[field] || field;
  
  // Ensure mapped field is valid
  if (!VALID_PEPTIDE_FIELDS.has(mappedField)) {
    console.log(`[suggest-correction] Cross-source conflict: field "${field}" → "${mappedField}" is invalid, skipping`);
    return null;
  }

  // For sequence conflicts from authoritative sources (UniProt, NCBI), propose the external value
  const isAuthoritative = ["UniProt", "NCBI", "NCBI_Protein"].some(s => 
    source_b?.toLowerCase().includes(s.toLowerCase())
  );

  // For adverse_events/regulatory from openFDA → map to side_effects
  const isRegulatoryUpdate = title?.includes("regulatory_update") || title?.includes("adverse_events");
  
  if (isRegulatoryUpdate) {
    // Append to side_effects rather than replace
    return {
      field: "side_effects",
      proposed_value: value_b,
      source: source_b,
      source_id: null,
      confidence: 65,
      confidence_level: "medium",
      change_type: "replace",
      description: `Atualização regulatória de ${source_b}: efeitos adversos reportados`,
      impact: "Os efeitos colaterais serão atualizados com dados regulatórios",
      extra: { original_field: "adverse_events", source: source_b },
    };
  }

  if (mappedField === "sequence" && isAuthoritative) {
    const seqLength = value_b?.length || 0;
    return {
      field: "sequence",
      proposed_value: value_b,
      source: source_b,
      source_id: null,
      confidence: 75,
      confidence_level: "medium",
      change_type: "replace",
      description: `Sequência de ${source_b} (${seqLength} aa) difere da atual. Fonte autoritativa priorizada.`,
      impact: "A sequência será atualizada com a versão da fonte autoritativa",
      extra: { current_length: value_a?.length || 0, proposed_length: seqLength, source: source_b },
    };
  }

  // Generic conflict: propose external value with moderate confidence
  return {
    field: mappedField,
    proposed_value: value_b,
    source: source_b,
    source_id: null,
    confidence: 60,
    confidence_level: "medium",
    change_type: "replace",
    description: `Conflito entre ${source_a || "PeptLabs"} e ${source_b}: valor externo proposto`,
    impact: `O campo "${mappedField}" será atualizado com o valor de ${source_b}`,
    extra: { source_a, source_b },
  };
}

// ── Protocol search via PubMed ──
async function searchProtocol(terms: string[]): Promise<any> {
  for (const term of terms) {
    try {
      const query = encodeURIComponent(`${term} peptide dosage protocol`);
      console.log(`[suggest-correction] PubMed protocol search: "${term}"`);

      const searchUrl = `${PUBMED_BASE}/esearch.fcgi?db=pubmed&term=${query}&retmax=3&retmode=json&sort=relevance`;
      const searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
      if (!searchRes.ok) continue;

      const searchData = await searchRes.json();
      const ids = searchData.esearchresult?.idlist || [];
      if (ids.length === 0) continue;

      // Found protocol-related articles — suggest adding references as a starting point
      const summaryUrl = `${PUBMED_BASE}/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
      const summaryRes = await fetch(summaryUrl, { signal: AbortSignal.timeout(10000) });
      if (!summaryRes.ok) continue;

      const summaryData = await summaryRes.json();
      const articles = ids
        .map((id: string) => {
          const article = summaryData.result?.[id];
          if (!article || !article.title) return null;
          return {
            title: article.title.replace(/<[^>]*>/g, ""),
            journal: article.fulljournalname || article.source || null,
            year: parseInt((article.pubdate || "").substring(0, 4)) || null,
            pmid: id,
          };
        })
        .filter(Boolean);

      if (articles.length > 0) {
        return {
          field: "scientific_references",
          proposed_value: articles,
          source: "PubMed",
          source_id: null,
          confidence: 55,
          confidence_level: "medium",
          change_type: "merge",
          description: `${articles.length} artigo(s) sobre protocolo/dosagem encontrado(s) no PubMed`,
          impact: "Referências sobre protocolo serão adicionadas para embasar futuras adições de protocolo",
          extra: { count: articles.length, search_type: "protocol" },
        };
      }
    } catch (e) {
      console.log(`[suggest-correction] Protocol search error:`, e.message);
    }
  }
  return null;
}

// ── Name relevance check ──
function isRelevantMatch(searchTerm: string, resultName: string, allTerms: string[]): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedResult = normalize(resultName);

  for (const term of [searchTerm, ...allTerms]) {
    const normalizedTerm = normalize(term);
    if (!normalizedTerm) continue;
    if (normalizedResult.includes(normalizedTerm) || normalizedTerm.includes(normalizedResult)) return true;
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

  for (const term of terms) {
    if (origins.find(o => o.source === "UniProt")) break;
    try {
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

  for (const term of terms) {
    if (origins.find(o => o.source === "PubMed")) break;
    try {
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

  for (const term of terms) {
    if (origins.find(o => o.source === "PubChem")) break;
    try {
      const res = await fetch(`${PUBCHEM_BASE}/compound/name/${encodeURIComponent(term)}/JSON`, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const cid = (await res.json())?.PC_Compounds?.[0]?.id?.id?.cid;
        if (cid) origins.push({ source: "PubChem", id: `CID:${cid}`, detail: `Composto identificado (CID:${cid})` });
      }
    } catch {}
  }

  for (const term of terms) {
    if (origins.find(o => o.source === "NCBI Protein")) break;
    try {
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