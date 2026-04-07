/**
 * Engine Generator — Generates a complete protocol from scored peptides.
 */

import type { ScoredPeptide } from "./scorer";
import type { ProtocolPeptide } from "@/types";

export interface GeneratedProtocol {
  name: string;
  description: string;
  peptides: ProtocolPeptide[];
  duration: string;
  goals: string[];
  warnings: string[];
  synergies: string[];
  totalScore: number;
}

/** Dosage templates per known peptide slug */
const DOSAGE_TEMPLATES: Record<string, { dose: string; frequency: string; duration: string }> = {
  "bpc-157": { dose: "250 mcg/dia", frequency: "1x ao dia (subcutâneo)", duration: "4-6 semanas" },
  "tb-500": { dose: "2.5 mg 2x/semana (carga) → 750 mcg 2x/semana (manutenção)", frequency: "2x por semana", duration: "6-8 semanas" },
  "tirzepatide": { dose: "2.5 mg/semana (escalonar)", frequency: "1x por semana", duration: "12-24 semanas" },
  "semaglutide": { dose: "0.25 mg/semana (escalonar)", frequency: "1x por semana", duration: "12-24 semanas" },
  "retatrutide": { dose: "1 mg/semana (escalonar)", frequency: "1x por semana", duration: "12-24 semanas" },
  "ipamorelin": { dose: "200-300 mcg/dia", frequency: "1-2x ao dia (jejum)", duration: "8-12 semanas" },
  "cjc-1295-dac": { dose: "1-2 mg/semana", frequency: "1x por semana", duration: "8-12 semanas" },
  "cjc-1295-no-dac": { dose: "100 mcg/dia", frequency: "1-3x ao dia com GHRP", duration: "8-12 semanas" },
  "ghk-cu": { dose: "200 mcg/dia (SC) ou tópico", frequency: "1x ao dia", duration: "4-8 semanas" },
  "epithalon": { dose: "5 mg/dia", frequency: "1x ao dia por 10-20 dias", duration: "10-20 dias (ciclo)" },
  "semax": { dose: "200-600 mcg/dia (nasal)", frequency: "1-2x ao dia", duration: "4-8 semanas" },
  "selank": { dose: "200-400 mcg/dia (nasal)", frequency: "1-2x ao dia", duration: "4-8 semanas" },
  "pt-141": { dose: "1.75 mg (sob demanda)", frequency: "Conforme necessidade (max 2x/semana)", duration: "Sob demanda" },
  "thymosin-alpha-1": { dose: "1.6 mg 2x/semana", frequency: "2x por semana", duration: "8-12 semanas" },
  "ll-37": { dose: "100 mcg/dia", frequency: "1x ao dia", duration: "4-6 semanas" },
  "kpv": { dose: "500 mcg/dia", frequency: "1x ao dia", duration: "4-8 semanas" },
  "dsip": { dose: "100 mcg antes de dormir", frequency: "Noturno", duration: "4-6 semanas" },
  "foxo4-dri": { dose: "500 mcg/dia por 3 dias", frequency: "Ciclo de 3 dias a cada 2 semanas", duration: "3-6 ciclos" },
  "aod-9604": { dose: "250-500 mcg/dia", frequency: "1x ao dia (jejum)", duration: "8-12 semanas" },
  "mots-c": { dose: "5 mg 3x/semana", frequency: "3x por semana", duration: "4-8 semanas" },
  "gonadorelin": { dose: "100 mcg 2x/semana", frequency: "2x por semana", duration: "Contínuo (durante TRT)" },
  "dihexa": { dose: "500 mcg/dia", frequency: "1x ao dia (nasal ou SC)", duration: "2-4 semanas" },
};

const DEFAULT_DOSAGE = { dose: "Consulte referência", frequency: "Conforme protocolo", duration: "4-8 semanas" };

/**
 * Generate a complete protocol from scored peptides and user goals.
 */
export function generateProtocol(
  scoredPeptides: ScoredPeptide[],
  goals: string[]
): GeneratedProtocol {
  const peptides: ProtocolPeptide[] = scoredPeptides.map((sp) => {
    const template = DOSAGE_TEMPLATES[sp.slug] ?? DEFAULT_DOSAGE;
    return {
      name: sp.name,
      slug: sp.slug,
      dose: template.dose,
      frequency: template.frequency,
      duration: template.duration,
      notes: sp.reason,
    };
  });

  const allWarnings = [...new Set(scoredPeptides.flatMap((p) => p.warnings))];
  const allSynergies = [...new Set(scoredPeptides.flatMap((p) => p.synergies))];
  const avgScore = Math.round(
    scoredPeptides.reduce((sum, p) => sum + p.finalScore, 0) / scoredPeptides.length
  );

  // Determine protocol duration (longest peptide)
  const durations = peptides.map((p) => p.duration);
  const longestDuration = durations.includes("12-24 semanas")
    ? "12-24 semanas"
    : durations.includes("8-12 semanas")
    ? "8-12 semanas"
    : "4-8 semanas";

  return {
    name: `Protocolo ${goals.join(" + ")}`,
    description: `Protocolo personalizado para ${goals.join(", ").toLowerCase()} com ${peptides.length} peptídeos selecionados pela engine inteligente.`,
    peptides,
    duration: longestDuration,
    goals,
    warnings: allWarnings,
    synergies: allSynergies,
    totalScore: avgScore,
  };
}
