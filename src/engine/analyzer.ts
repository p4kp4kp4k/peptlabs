/**
 * Engine Analyzer — Receives user goals and returns relevant peptides from rules.
 */

import { GOAL_RULES, type PeptideRule, type GoalRule } from "./rules";

export interface AnalysisInput {
  goals: string[];
  weight?: number; // kg
  experience?: "beginner" | "intermediate" | "advanced";
}

export interface AnalyzedPeptide extends PeptideRule {
  matchedGoals: string[];
  adjustedScore: number;
}

/**
 * Analyze user input and return matched peptides from all selected goals.
 */
export function analyzePeptides(input: AnalysisInput): AnalyzedPeptide[] {
  const { goals, experience = "intermediate" } = input;

  // Collect all peptides from matched goals
  const peptideMap = new Map<string, AnalyzedPeptide>();

  for (const goalName of goals) {
    const rule = GOAL_RULES.find((r) => r.goal === goalName);
    if (!rule) continue;

    for (const peptide of rule.peptides) {
      const existing = peptideMap.get(peptide.slug);
      if (existing) {
        // Boost score for peptides matching multiple goals
        existing.adjustedScore = Math.min(100, existing.adjustedScore + peptide.score * 0.3);
        existing.matchedGoals.push(goalName);
      } else {
        peptideMap.set(peptide.slug, {
          ...peptide,
          matchedGoals: [goalName],
          adjustedScore: peptide.score,
        });
      }
    }
  }

  // Apply experience modifier
  const expModifier = experience === "beginner" ? 0.8 : experience === "advanced" ? 1.1 : 1.0;
  for (const p of peptideMap.values()) {
    p.adjustedScore = Math.round(p.adjustedScore * expModifier);
  }

  return Array.from(peptideMap.values()).sort((a, b) => b.adjustedScore - a.adjustedScore);
}

/**
 * Get all available goals
 */
export function getAvailableGoals(): { goal: string; emoji: string }[] {
  return GOAL_RULES.map((r) => ({ goal: r.goal, emoji: r.emoji }));
}
