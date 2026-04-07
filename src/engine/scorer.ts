/**
 * Engine Scorer — Scores and ranks peptides considering interactions and constraints.
 */

import { INTERACTION_RULES, type InteractionRule } from "./rules";
import type { AnalyzedPeptide } from "./analyzer";

export interface ScoredPeptide extends AnalyzedPeptide {
  finalScore: number;
  warnings: string[];
  synergies: string[];
}

/**
 * Score peptides considering interactions between them.
 * Returns top N peptides with warnings and synergies.
 */
export function scorePeptides(
  peptides: AnalyzedPeptide[],
  maxResults = 6
): ScoredPeptide[] {
  const scored: ScoredPeptide[] = peptides.map((p) => ({
    ...p,
    finalScore: p.adjustedScore,
    warnings: [],
    synergies: [],
  }));

  // Check pairwise interactions
  for (let i = 0; i < scored.length; i++) {
    for (let j = i + 1; j < scored.length; j++) {
      const interaction = findInteraction(scored[i].slug, scored[j].slug);
      if (!interaction) continue;

      if (interaction.type === "synergic") {
        scored[i].synergies.push(`Sinérgico com ${scored[j].name}: ${interaction.description}`);
        scored[j].synergies.push(`Sinérgico com ${scored[i].name}: ${interaction.description}`);
        // Boost both
        scored[i].finalScore = Math.min(100, scored[i].finalScore + 5);
        scored[j].finalScore = Math.min(100, scored[j].finalScore + 5);
      } else if (interaction.type === "caution") {
        scored[i].warnings.push(`⚠ Cautela com ${scored[j].name}: ${interaction.description}`);
        scored[j].warnings.push(`⚠ Cautela com ${scored[i].name}: ${interaction.description}`);
      } else if (interaction.type === "avoid") {
        // Penalize the lower-scored one
        const lower = scored[i].finalScore < scored[j].finalScore ? scored[i] : scored[j];
        lower.finalScore = Math.max(0, lower.finalScore - 30);
        lower.warnings.push(`❌ Evitar com ${scored[i] === lower ? scored[j].name : scored[i].name}: ${interaction.description}`);
      }
    }
  }

  return scored.sort((a, b) => b.finalScore - a.finalScore).slice(0, maxResults);
}

function findInteraction(slugA: string, slugB: string): InteractionRule | null {
  return (
    INTERACTION_RULES.find(
      (r) =>
        (r.peptideA === slugA && r.peptideB === slugB) ||
        (r.peptideA === slugB && r.peptideB === slugA)
    ) ?? null
  );
}
