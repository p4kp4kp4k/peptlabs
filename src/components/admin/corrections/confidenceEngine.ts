/**
 * Confidence Engine
 * =================
 * Multi-factor scientific confidence scoring for peptide data suggestions.
 * 
 * Factors:
 *   1. Source reliability (authority weight)
 *   2. Recency of data
 *   3. Match strength (name/alias/ID)
 *   4. Cross-source consistency
 *   5. Data completeness/integrity
 *   6. Prior validation history
 *   7. Field risk level
 * 
 * Output: 0–1 confidence score + level + reasoning + safety decision
 */

// ── Source Authority Weights (0–1) ──

const SOURCE_AUTHORITY: Record<string, number> = {
  UniProt:     0.95,
  PDB:         0.93,
  PubMed:      0.92,
  openFDA:     0.95,
  NCBI:        0.90,
  DRAMP:       0.80,
  APD:         0.78,
  Peptipedia:  0.75,
  Crossref:    0.70,
  Internal:    0.60,
  Manual:      0.50,
  Unknown:     0.30,
};

// ── Field-specific authoritative sources ──

const FIELD_AUTHORITATIVE_SOURCES: Record<string, string[]> = {
  sequence:              ["UniProt", "PDB", "NCBI"],
  scientific_references: ["PubMed", "Crossref"],
  structure_info:        ["PDB", "UniProt"],
  side_effects:          ["openFDA"],
  regulatory:            ["openFDA"],
  mechanism:             ["UniProt", "PubMed"],
  benefits:              ["PubMed"],
  description:           ["UniProt", "PubMed"],
  source_origins:        ["UniProt", "PDB", "PubMed", "NCBI"],
  slug:                  ["Internal"],
  dosage_info:           ["openFDA", "PubMed"],
  half_life:             ["PubMed", "UniProt"],
  classification:        ["UniProt"],
};

// ── Field Risk Levels ──

export type FieldRisk = "critical" | "high" | "medium" | "low";

const FIELD_RISK: Record<string, FieldRisk> = {
  sequence:       "critical",
  side_effects:   "critical",
  regulatory:     "critical",
  dosage_info:    "high",
  half_life:      "high",
  protocol_phases:"high",
  mechanism:      "medium",
  benefits:       "medium",
  description:    "medium",
  classification: "medium",
  scientific_references: "low",
  source_origins: "low",
  slug:           "low",
  structure_info: "medium",
  alternative_names: "low",
};

// ── Confidence Levels ──

export type ConfidenceLevel = "very_high" | "high" | "medium" | "low" | "very_low";

export function scoreToLevel(score: number): ConfidenceLevel {
  if (score >= 0.90) return "very_high";
  if (score >= 0.75) return "high";
  if (score >= 0.55) return "medium";
  if (score >= 0.30) return "low";
  return "very_low";
}

export function levelLabel(level: ConfidenceLevel): string {
  const map: Record<ConfidenceLevel, string> = {
    very_high: "Muito Alta",
    high: "Alta",
    medium: "Média",
    low: "Baixa",
    very_low: "Muito Baixa",
  };
  return map[level];
}

export function levelColor(level: ConfidenceLevel): string {
  const map: Record<ConfidenceLevel, string> = {
    very_high: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    high: "text-green-400 bg-green-400/10 border-green-400/30",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    low: "text-orange-400 bg-orange-400/10 border-orange-400/30",
    very_low: "text-red-400 bg-red-400/10 border-red-400/30",
  };
  return map[level];
}

// ── Decision Types ──

export type Decision = "auto_apply" | "manual_review" | "blocked";

export interface ConfidenceResult {
  score: number;               // 0–1
  level: ConfidenceLevel;
  decision: Decision;
  reasoning: string;           // human-readable explanation
  factors: ConfidenceFactor[]; // breakdown
  blockedReason: string | null;
  fieldRisk: FieldRisk;
  isSafeToApply: boolean;
  requiresManualReview: boolean;
}

export interface ConfidenceFactor {
  name: string;
  weight: number;     // how much this factor contributes (0–1)
  value: number;      // the computed value for this factor (0–1)
  detail: string;
}

// ── Input for scoring ──

export interface ScoringInput {
  fieldName: string;
  sourceProvider: string;
  changeType: "add" | "replace" | "merge" | "remove";
  severity: string;

  // Optional enrichment
  sourceRecency?: Date | string | null;   // when the source data was last updated
  matchStrength?: number;                 // 0–1, how strong the name/alias match was
  crossSourceAgreement?: number;          // 0–1, how many other sources agree
  dataCompleteness?: number;              // 0–1, how complete the proposed data is
  hasBeenManuallyValidated?: boolean;     // was the current value validated by admin?
  priorSuccessfulUpdates?: number;        // times this peptide+field was auto-updated before
  hasConflict?: boolean;                  // does another strong source disagree?
  conflictSeverity?: "none" | "minor" | "major" | "critical";
  currentValueExists?: boolean;           // does the peptide already have a value?

  // Auto-update threshold (configurable)
  autoApplyThreshold?: number;            // default 0.75
}

// ── Main Scoring Function ──

export function calculateConfidence(input: ScoringInput): ConfidenceResult {
  const factors: ConfidenceFactor[] = [];
  const threshold = input.autoApplyThreshold ?? 0.75;
  const fieldRisk = FIELD_RISK[input.fieldName] || "medium";

  // --- Factor 1: Source Authority (weight: 0.30) ---
  const authorityWeight = 0.30;
  const normalizedSource = normalizeSourceName(input.sourceProvider);
  const sourceAuth = SOURCE_AUTHORITY[normalizedSource] ?? SOURCE_AUTHORITY.Unknown;
  const authSources = FIELD_AUTHORITATIVE_SOURCES[input.fieldName] || [];
  const isAuthoritative = authSources.includes(normalizedSource);
  const authorityValue = isAuthoritative ? Math.min(1, sourceAuth + 0.05) : sourceAuth * 0.85;
  
  factors.push({
    name: "Autoridade da Fonte",
    weight: authorityWeight,
    value: authorityValue,
    detail: `${normalizedSource} ${isAuthoritative ? "(autoritativa para este campo)" : "(não-autoritativa)"} — peso ${(authorityValue * 100).toFixed(0)}%`,
  });

  // --- Factor 2: Recency (weight: 0.10) ---
  const recencyWeight = 0.10;
  let recencyValue = 0.5; // default neutral
  if (input.sourceRecency) {
    const recencyDate = typeof input.sourceRecency === "string" ? new Date(input.sourceRecency) : input.sourceRecency;
    const daysSince = Math.max(0, (Date.now() - recencyDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince < 30) recencyValue = 1.0;
    else if (daysSince < 180) recencyValue = 0.85;
    else if (daysSince < 365) recencyValue = 0.7;
    else if (daysSince < 730) recencyValue = 0.5;
    else recencyValue = 0.3;
  }
  factors.push({
    name: "Recência",
    weight: recencyWeight,
    value: recencyValue,
    detail: input.sourceRecency ? `Dados de ${recencyValue >= 0.85 ? "fonte recente" : "fonte antiga"}` : "Sem informação de recência",
  });

  // --- Factor 3: Match Strength (weight: 0.15) ---
  const matchWeight = 0.15;
  const matchValue = input.matchStrength ?? 0.7;
  factors.push({
    name: "Força do Match",
    weight: matchWeight,
    value: matchValue,
    detail: matchValue >= 0.9 ? "Match muito forte (nome + ID)" : matchValue >= 0.7 ? "Match forte (nome)" : "Match fraco",
  });

  // --- Factor 4: Cross-Source Consistency (weight: 0.15) ---
  const crossWeight = 0.15;
  const crossValue = input.crossSourceAgreement ?? 0.5;
  factors.push({
    name: "Consistência Cross-Source",
    weight: crossWeight,
    value: crossValue,
    detail: crossValue >= 0.8 ? "Múltiplas fontes concordam" : crossValue >= 0.5 ? "Sem divergência detectada" : "Fontes divergentes",
  });

  // --- Factor 5: Data Completeness (weight: 0.10) ---
  const completenessWeight = 0.10;
  const completenessValue = input.dataCompleteness ?? 0.6;
  factors.push({
    name: "Completude do Dado",
    weight: completenessWeight,
    value: completenessValue,
    detail: completenessValue >= 0.9 ? "Dado completo e estruturado" : completenessValue >= 0.6 ? "Dado parcialmente completo" : "Dado incompleto",
  });

  // --- Factor 6: Prior Validation (weight: 0.10) ---
  const validationWeight = 0.10;
  let validationValue = 0.5;
  if (input.hasBeenManuallyValidated && input.changeType === "replace") {
    validationValue = 0.2; // penalize overwriting manually validated data
  } else if (input.priorSuccessfulUpdates && input.priorSuccessfulUpdates > 0) {
    validationValue = Math.min(1, 0.6 + input.priorSuccessfulUpdates * 0.1);
  }
  factors.push({
    name: "Histórico de Validação",
    weight: validationWeight,
    value: validationValue,
    detail: input.hasBeenManuallyValidated
      ? "Dado atual validado manualmente — overwrite penalizado"
      : input.priorSuccessfulUpdates
        ? `${input.priorSuccessfulUpdates} updates anteriores bem-sucedidos`
        : "Sem histórico de validação",
  });

  // --- Factor 7: Field Risk (weight: 0.10) ---
  const riskWeight = 0.10;
  const riskPenalty: Record<FieldRisk, number> = {
    critical: 0.3,
    high: 0.5,
    medium: 0.7,
    low: 0.9,
  };
  const riskValue = riskPenalty[fieldRisk];
  // Only penalize replacements; additions to empty fields are safer
  const adjustedRiskValue = input.changeType === "add" ? Math.min(1, riskValue + 0.2) : riskValue;
  factors.push({
    name: "Risco do Campo",
    weight: riskWeight,
    value: adjustedRiskValue,
    detail: `Campo "${input.fieldName}" — risco ${fieldRisk} ${input.changeType === "add" ? "(adição, risco atenuado)" : ""}`,
  });

  // --- Compute weighted score ---
  let rawScore = 0;
  for (const f of factors) {
    rawScore += f.weight * f.value;
  }

  // --- Conflict penalty (multiplicative) ---
  let conflictMultiplier = 1.0;
  if (input.hasConflict) {
    switch (input.conflictSeverity) {
      case "critical": conflictMultiplier = 0.3; break;
      case "major":    conflictMultiplier = 0.5; break;
      case "minor":    conflictMultiplier = 0.75; break;
      default:         conflictMultiplier = 0.6; break;
    }
  }

  const finalScore = Math.max(0, Math.min(1, rawScore * conflictMultiplier));
  const level = scoreToLevel(finalScore);

  // --- Decision Logic ---
  let decision: Decision;
  let blockedReason: string | null = null;

  // Hard blocks (regardless of score)
  if (input.severity === "critical") {
    decision = "blocked";
    blockedReason = "Severidade crítica requer revisão manual obrigatória";
  } else if (fieldRisk === "critical" && input.changeType === "replace") {
    decision = "blocked";
    blockedReason = `Substituição em campo crítico (${input.fieldName}) bloqueada`;
  } else if (input.hasConflict && input.conflictSeverity === "critical") {
    decision = "blocked";
    blockedReason = "Conflito crítico entre fontes fortes";
  } else if (input.hasBeenManuallyValidated && input.changeType === "replace" && finalScore < 0.90) {
    decision = "blocked";
    blockedReason = "Dado atual validado manualmente — overwrite bloqueado sem confiança muito alta";
  } else if (!isAuthoritative && fieldRisk !== "low" && input.changeType === "replace") {
    decision = "manual_review";
    blockedReason = "Fonte não-autoritativa para este campo sensível";
  } else if (finalScore >= threshold) {
    decision = "auto_apply";
  } else if (finalScore >= 0.45) {
    decision = "manual_review";
  } else {
    decision = "blocked";
    blockedReason = `Confiança muito baixa (${(finalScore * 100).toFixed(0)}%)`;
  }

  // Build reasoning string
  const topFactors = [...factors].sort((a, b) => (b.weight * b.value) - (a.weight * a.value)).slice(0, 3);
  const reasoningParts = topFactors.map(f => f.detail);
  if (input.hasConflict) {
    reasoningParts.push(`Conflito ${input.conflictSeverity || "detectado"} — penalização aplicada`);
  }
  const reasoning = reasoningParts.join(". ");

  return {
    score: Math.round(finalScore * 100) / 100,
    level,
    decision,
    reasoning,
    factors,
    blockedReason,
    fieldRisk,
    isSafeToApply: decision === "auto_apply",
    requiresManualReview: decision === "manual_review",
  };
}

// ── Helpers ──

function normalizeSourceName(source: string): string {
  if (!source) return "Unknown";
  const s = source.trim();
  const map: Record<string, string> = {
    uniprot: "UniProt",
    pubmed: "PubMed",
    pdb: "PDB",
    openfda: "openFDA",
    ncbi: "NCBI",
    dramp: "DRAMP",
    apd: "APD",
    peptipedia: "Peptipedia",
    crossref: "Crossref",
    internal: "Internal",
    manual: "Manual",
  };
  return map[s.toLowerCase()] || s;
}

// ── Convenience: score for suggestion engine ──

export function scoreSuggestion(opts: {
  fieldName: string;
  sourceProvider: string;
  changeType: "add" | "replace" | "merge";
  severity?: string;
  currentValueExists: boolean;
  matchStrength?: number;
  hasConflict?: boolean;
}): ConfidenceResult {
  return calculateConfidence({
    fieldName: opts.fieldName,
    sourceProvider: opts.sourceProvider,
    changeType: opts.changeType,
    severity: opts.severity || "low",
    matchStrength: opts.matchStrength ?? 0.75,
    currentValueExists: opts.currentValueExists,
    hasConflict: opts.hasConflict ?? false,
    conflictSeverity: opts.hasConflict ? "minor" : "none",
    crossSourceAgreement: opts.hasConflict ? 0.3 : 0.6,
    dataCompleteness: 0.7,
  });
}

// ── For edge function (simplified, no imports needed) ──

export function evaluateChangeConfidence(
  fieldName: string,
  changeType: string,
  severity: string,
  sourceName: string,
  sourcePriority: number,
  currentValue: any,
  newValue: any,
): ConfidenceResult {
  const hasCurrentValue = currentValue !== null && currentValue !== undefined && currentValue !== "";
  return calculateConfidence({
    fieldName,
    sourceProvider: sourceName,
    changeType: hasCurrentValue ? "replace" : "add",
    severity,
    matchStrength: 0.75,
    currentValueExists: hasCurrentValue,
    crossSourceAgreement: 0.5,
    dataCompleteness: newValue ? (typeof newValue === "string" ? Math.min(1, newValue.length / 100) : 0.7) : 0.3,
  });
}
