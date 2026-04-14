/**
 * NO_CHANGE Filter & Semantic Comparison Engine
 * ==============================================
 * Normalizes and compares data before/after to detect false positives
 * in the audit/suggestion pipeline.
 */

// ── Text Normalization ──

export function normalizeText(val: string | null | undefined): string {
  if (!val) return "";
  return val
    .trim()
    .replace(/\s+/g, " ")          // collapse whitespace
    .replace(/\r\n/g, "\n")        // normalize line breaks
    .replace(/\n{3,}/g, "\n\n")    // collapse excessive newlines
    .toLowerCase();
}

export function normalizeSequence(val: string | null | undefined): string {
  if (!val) return "";
  return val
    .trim()
    .replace(/[\s\n\r\t-]/g, "")   // remove spaces, breaks, dashes
    .toUpperCase();
}

export function normalizeArray(arr: any[] | null | undefined): string[] {
  if (!arr || !Array.isArray(arr)) return [];
  return arr
    .map(item => typeof item === "string" ? normalizeText(item) : JSON.stringify(item))
    .filter(Boolean)
    .sort();
}

// ── Reference Normalization (by PMID) ──

interface RefLike {
  pmid?: string | null;
  title?: string;
  source?: string;
  year?: number;
  [key: string]: any;
}

export function normalizeReferences(refs: RefLike[] | null | undefined): string[] {
  if (!refs || !Array.isArray(refs)) return [];
  return refs
    .map(r => {
      if (r.pmid) return `pmid:${r.pmid}`;
      return `title:${normalizeText(r.title)}|year:${r.year || 0}`;
    })
    .sort();
}

// ── Similarity (Levenshtein-based, 0-100) ──

function levenshteinDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

export function textSimilarity(a: string, b: string): number {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na === nb) return 100;
  if (!na || !nb) return 0;
  const maxLen = Math.max(na.length, nb.length);
  // For very long texts, use a sampled comparison
  if (maxLen > 500) {
    const sa = na.slice(0, 500);
    const sb = nb.slice(0, 500);
    const dist = levenshteinDistance(sa, sb);
    return Math.round(((500 - dist) / 500) * 100);
  }
  const dist = levenshteinDistance(na, nb);
  return Math.round(((maxLen - dist) / maxLen) * 100);
}

// ── Main: isNoChange ──

export interface NoChangeResult {
  isNoChange: boolean;
  reason: string;
  similarity?: number;
}

/**
 * Determines if an old→new change is actually meaningless.
 * Returns { isNoChange: true } if the values are semantically identical.
 */
export function isNoChange(
  fieldName: string,
  oldValue: any,
  newValue: any,
  options?: { similarityThreshold?: number }
): NoChangeResult {
  const threshold = options?.similarityThreshold ?? 95;

  // Both null/empty
  if (isEmpty(oldValue) && isEmpty(newValue)) {
    return { isNoChange: true, reason: "Ambos os valores estão vazios" };
  }

  // One is empty — this IS a real change
  if (isEmpty(oldValue) || isEmpty(newValue)) {
    return { isNoChange: false, reason: "Um dos valores está vazio — alteração real" };
  }

  // ── Field-specific comparisons ──

  // Sequence
  if (fieldName === "sequence") {
    const normA = normalizeSequence(oldValue);
    const normB = normalizeSequence(newValue);
    if (normA === normB) {
      return { isNoChange: true, reason: "Sequências idênticas após normalização", similarity: 100 };
    }
    return { isNoChange: false, reason: "Sequências diferentes", similarity: textSimilarity(normA, normB) };
  }

  // References (compare by PMID set)
  if (fieldName === "scientific_references") {
    const refsA = normalizeReferences(parseJsonSafe(oldValue));
    const refsB = normalizeReferences(parseJsonSafe(newValue));
    // Check if B is a subset of A (no new refs)
    const setA = new Set(refsA);
    const newRefs = refsB.filter(r => !setA.has(r));
    if (newRefs.length === 0) {
      return { isNoChange: true, reason: "Todas as referências propostas já existem (comparação por PMID)" };
    }
    return { isNoChange: false, reason: `${newRefs.length} referência(s) nova(s) detectada(s)` };
  }

  // Arrays (benefits, source_origins, etc.)
  if (fieldName === "benefits" || fieldName === "source_origins" || fieldName === "alternative_names"
    || fieldName === "biological_activity" || fieldName === "mechanism_points"
    || fieldName === "reconstitution_steps" || fieldName === "goals") {
    const arrA = normalizeArray(parseJsonSafe(oldValue));
    const arrB = normalizeArray(parseJsonSafe(newValue));
    if (arraysEqual(arrA, arrB)) {
      return { isNoChange: true, reason: "Arrays idênticos após normalização e ordenação" };
    }
    // Check if B is subset of A
    const setA = new Set(arrA);
    const newItems = arrB.filter(b => !setA.has(b));
    if (newItems.length === 0) {
      return { isNoChange: true, reason: "Todos os itens propostos já existem" };
    }
    return { isNoChange: false, reason: `${newItems.length} item(ns) novo(s)` };
  }

  // Slug
  if (fieldName === "slug") {
    if (normalizeText(oldValue) === normalizeText(newValue)) {
      return { isNoChange: true, reason: "Slugs idênticos", similarity: 100 };
    }
    return { isNoChange: false, reason: "Slugs diferentes" };
  }

  // Text fields (mechanism, description, dosage_info, etc.)
  const strA = typeof oldValue === "string" ? oldValue : JSON.stringify(oldValue);
  const strB = typeof newValue === "string" ? newValue : JSON.stringify(newValue);
  const sim = textSimilarity(strA, strB);
  if (sim >= threshold) {
    return { isNoChange: true, reason: `Similaridade ${sim}% ≥ ${threshold}% — sem alteração significativa`, similarity: sim };
  }
  return { isNoChange: false, reason: `Similaridade ${sim}% — alteração detectada`, similarity: sim };
}

// ── Helpers ──

function isEmpty(val: any): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === "string" && val.trim() === "") return true;
  if (Array.isArray(val) && val.length === 0) return true;
  return false;
}

function parseJsonSafe(val: any): any {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
