/**
 * PeptiLab Engine — Main entry point.
 * 
 * Usage:
 *   import { runEngine } from "@/engine";
 *   const result = runEngine({ goals: ["Recuperação & Cicatrização"], weight: 80, experience: "intermediate" });
 */

export { analyzePeptides, getAvailableGoals, type AnalysisInput, type AnalyzedPeptide } from "./analyzer";
export { scorePeptides, type ScoredPeptide } from "./scorer";
export { generateProtocol, type GeneratedProtocol } from "./generator";
export { GOAL_RULES, INTERACTION_RULES } from "./rules";

import { analyzePeptides, type AnalysisInput } from "./analyzer";
import { scorePeptides } from "./scorer";
import { generateProtocol, type GeneratedProtocol } from "./generator";

/**
 * Run the full engine pipeline:
 * 1. Analyze goals → matched peptides
 * 2. Score with interactions → ranked peptides
 * 3. Generate protocol → complete protocol
 */
export function runEngine(input: AnalysisInput, maxPeptides = 5): GeneratedProtocol {
  const analyzed = analyzePeptides(input);
  const scored = scorePeptides(analyzed, maxPeptides);
  return generateProtocol(scored, input.goals);
}
