/**
 * Sequence Diff Engine
 * Compares two peptide sequences and provides intelligent analysis.
 */

export interface SequenceDiffResult {
  similarity: number;          // 0-100
  difference: number;          // 0-100
  lengthA: number;
  lengthB: number;
  conflictLevel: "low" | "moderate" | "critical";
  explanation: string;
  recommendation: string;
  requiresManualReview: boolean;
  alignedA: DiffChar[];
  alignedB: DiffChar[];
}

export interface DiffChar {
  char: string;
  type: "match" | "mismatch" | "gap";
}

/** Levenshtein distance */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Use two rows to save memory
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,      // deletion
        curr[j - 1] + 1,  // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/** Simple NW-like alignment for visualization (capped at 500 chars each) */
function align(a: string, b: string): { alignedA: DiffChar[]; alignedB: DiffChar[] } {
  const maxLen = 500;
  const sa = a.slice(0, maxLen);
  const sb = b.slice(0, maxLen);
  const m = sa.length, n = sb.length;

  // Build DP matrix
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = sa[i - 1] === sb[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  // Traceback
  const alignedA: DiffChar[] = [];
  const alignedB: DiffChar[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + (sa[i - 1] === sb[j - 1] ? 0 : 1)) {
      const match = sa[i - 1] === sb[j - 1];
      alignedA.unshift({ char: sa[i - 1], type: match ? "match" : "mismatch" });
      alignedB.unshift({ char: sb[j - 1], type: match ? "match" : "mismatch" });
      i--; j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      alignedA.unshift({ char: sa[i - 1], type: "gap" });
      alignedB.unshift({ char: "-", type: "gap" });
      i--;
    } else {
      alignedA.unshift({ char: "-", type: "gap" });
      alignedB.unshift({ char: sb[j - 1], type: "gap" });
      j--;
    }
  }

  return { alignedA, alignedB };
}

export function compareSequences(seqA: string | null, seqB: string | null): SequenceDiffResult {
  const a = (seqA || "").trim().toUpperCase();
  const b = (seqB || "").trim().toUpperCase();

  if (!a && !b) {
    return {
      similarity: 100, difference: 0, lengthA: 0, lengthB: 0,
      conflictLevel: "low",
      explanation: "Ambas as sequências estão vazias.",
      recommendation: "Buscar sequência em fonte externa.",
      requiresManualReview: false,
      alignedA: [], alignedB: [],
    };
  }

  if (!a || !b) {
    const { alignedA, alignedB } = a
      ? { alignedA: a.split("").map(c => ({ char: c, type: "match" as const })), alignedB: [] }
      : { alignedA: [], alignedB: b.split("").map(c => ({ char: c, type: "match" as const })) };
    return {
      similarity: 0, difference: 100, lengthA: a.length, lengthB: b.length,
      conflictLevel: "critical",
      explanation: "Uma das sequências está ausente. Não é possível comparar.",
      recommendation: "Adicionar a sequência ausente a partir da fonte disponível.",
      requiresManualReview: true,
      alignedA, alignedB,
    };
  }

  const maxLen = Math.max(a.length, b.length);
  const dist = levenshtein(a, b);
  const similarity = Math.round(((maxLen - dist) / maxLen) * 100);
  const difference = 100 - similarity;

  const conflictLevel: SequenceDiffResult["conflictLevel"] =
    similarity >= 80 ? "low" : similarity >= 40 ? "moderate" : "critical";

  let explanation: string;
  let recommendation: string;
  let requiresManualReview: boolean;

  if (similarity >= 90) {
    explanation = `Sequências quase idênticas (${similarity}% similaridade). Diferenças mínimas, possivelmente atualização de isoforma ou variante menor.`;
    recommendation = "Atualização segura possível. Verificar se a variante é relevante.";
    requiresManualReview = false;
  } else if (similarity >= 80) {
    explanation = `Alta similaridade (${similarity}%). Diferenças podem representar isoformas, truncamento ou modificações pós-traducionais.`;
    recommendation = "Atualização segura possível com revisão rápida.";
    requiresManualReview = false;
  } else if (similarity >= 40) {
    explanation = `Similaridade moderada (${similarity}%). As sequências compartilham regiões conservadas, mas apresentam diferenças significativas.`;
    recommendation = "Revisão manual recomendada. Verificar se representam o mesmo peptídeo.";
    requiresManualReview = true;
  } else {
    explanation = `Baixa similaridade (${similarity}%). Possível que representem peptídeos diferentes ou dados incorretos em uma das fontes.`;
    recommendation = "Revisão manual obrigatória. Verificar identidade do peptídeo em ambas as fontes.";
    requiresManualReview = true;
  }

  // Size difference warning
  const sizeRatio = Math.min(a.length, b.length) / maxLen;
  if (sizeRatio < 0.5) {
    explanation += ` Diferença de tamanho significativa (${a.length} vs ${b.length} aa).`;
    recommendation += " Verificar se uma das sequências é um fragmento.";
  }

  const { alignedA, alignedB } = align(a, b);

  return {
    similarity, difference, lengthA: a.length, lengthB: b.length,
    conflictLevel, explanation, recommendation, requiresManualReview,
    alignedA, alignedB,
  };
}
