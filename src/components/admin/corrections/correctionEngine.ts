/**
 * Correction Engine
 * =================
 * Confidence scoring, source priority, and correction proposal logic
 * for the audit finding correction system.
 */

// ── Confidence Levels ──

export type ConfidenceLevel = "high" | "medium" | "low";
export type CorrectionType = "add" | "replace" | "merge" | "remove" | "manual_assist";

export interface CorrectionProposal {
  field: string;
  correctionType: CorrectionType;
  oldValue: any;
  newValue: any;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  sourceProvider: string | null;
  description: string;
  impact: string;
  requiresManualReview: boolean;
}

// ── Source Priority by Field ──

const SOURCE_PRIORITY: Record<string, string[]> = {
  sequence: ["UniProt", "PDB", "DRAMP", "APD", "Peptipedia"],
  scientific_references: ["PubMed", "Crossref"],
  structure_info: ["PDB", "UniProt"],
  regulatory: ["openFDA"],
  source_origins: ["UniProt", "PDB", "PubMed", "DRAMP", "APD", "Peptipedia"],
  description: ["internal", "PubMed", "UniProt"],
  mechanism: ["internal", "PubMed", "UniProt"],
  benefits: ["internal", "PubMed"],
  dosage_info: ["internal", "PubMed"],
  protocol_phases: ["internal"],
  dosage_table: ["internal"],
};

// ── Finding Category → Confidence Rules ──

interface ConfidenceRule {
  autoCorrectible: boolean;
  defaultLevel: ConfidenceLevel;
  getLevel: (context: FindingContext) => ConfidenceLevel;
  requiresManualReview: boolean;
}

interface FindingContext {
  category: string;
  severity: string;
  hasSourceMatch: boolean;
  sourceCount: number;
  peptideName: string;
  currentValue: any;
  proposedValue: any;
}

const CONFIDENCE_RULES: Record<string, ConfidenceRule> = {
  missing_sequence: {
    autoCorrectible: true,
    defaultLevel: "medium",
    requiresManualReview: false,
    getLevel: (ctx) => {
      if (ctx.hasSourceMatch && ctx.sourceCount === 1) return "high";
      if (ctx.hasSourceMatch) return "medium";
      return "low";
    },
  },
  no_references: {
    autoCorrectible: true,
    defaultLevel: "medium",
    requiresManualReview: false,
    getLevel: (ctx) => {
      if (ctx.hasSourceMatch && ctx.sourceCount >= 3) return "high";
      if (ctx.hasSourceMatch) return "medium";
      return "low";
    },
  },
  incomplete_data: {
    autoCorrectible: true,
    defaultLevel: "medium",
    requiresManualReview: false,
    getLevel: (ctx) => {
      if (ctx.hasSourceMatch) return "high";
      return "medium";
    },
  },
  no_source: {
    autoCorrectible: true,
    defaultLevel: "medium",
    requiresManualReview: false,
    getLevel: (ctx) => {
      if (ctx.hasSourceMatch) return "high";
      return "medium";
    },
  },
  no_protocol: {
    autoCorrectible: false,
    defaultLevel: "low",
    requiresManualReview: true,
    getLevel: () => "low",
  },
  data_inconsistency: {
    autoCorrectible: true,
    defaultLevel: "high",
    requiresManualReview: false,
    getLevel: () => "high",
  },
  cross_source_conflict: {
    autoCorrectible: false,
    defaultLevel: "low",
    requiresManualReview: true,
    getLevel: () => "low",
  },
  multi_source: {
    autoCorrectible: false,
    defaultLevel: "low",
    requiresManualReview: true,
    getLevel: () => "low",
  },
  stale_changes: {
    autoCorrectible: false,
    defaultLevel: "low",
    requiresManualReview: true,
    getLevel: () => "low",
  },
  stale_imports: {
    autoCorrectible: false,
    defaultLevel: "low",
    requiresManualReview: true,
    getLevel: () => "low",
  },
};

// ── Generate Correction Proposal ──

export function generateProposal(
  finding: {
    category: string;
    severity: string;
    title: string;
    description: string | null;
    value_a: string | null;
    value_b: string | null;
    source_a: string | null;
    source_b: string | null;
    peptide_id: string | null;
  },
  peptide: Record<string, any> | null
): CorrectionProposal | null {
  if (!peptide || !finding.peptide_id) return null;

  const rule = CONFIDENCE_RULES[finding.category];
  if (!rule) return null;

  const ctx: FindingContext = {
    category: finding.category,
    severity: finding.severity,
    hasSourceMatch: !!finding.value_b,
    sourceCount: 1,
    peptideName: peptide.name || "",
    currentValue: finding.value_a,
    proposedValue: finding.value_b,
  };

  const confidenceLevel = rule.getLevel(ctx);
  const confidenceScore = confidenceLevel === "high" ? 85 : confidenceLevel === "medium" ? 60 : 30;

  switch (finding.category) {
    case "missing_sequence":
      return {
        field: "sequence",
        correctionType: "add",
        oldValue: peptide.sequence || null,
        newValue: finding.value_b || null,
        confidenceScore,
        confidenceLevel,
        sourceProvider: finding.source_b || null,
        description: `Adicionar sequência peptídica para ${peptide.name}`,
        impact: "A sequência aparecerá na seção de informações moleculares da página do peptídeo",
        requiresManualReview: rule.requiresManualReview,
      };

    case "no_references":
      return {
        field: "scientific_references",
        correctionType: "merge",
        oldValue: peptide.scientific_references || [],
        newValue: null, // Will be populated from peptide_references
        confidenceScore,
        confidenceLevel,
        sourceProvider: "PubMed",
        description: `Vincular referências científicas ao ${peptide.name}`,
        impact: "As referências aparecerão no bloco 'Referências Científicas' da aba Pesquisa",
        requiresManualReview: rule.requiresManualReview,
      };

    case "incomplete_data": {
      const missingFields = extractMissingFields(finding.description, peptide);
      const field = missingFields[0] || "description";
      return {
        field,
        correctionType: "add",
        oldValue: peptide[field] || null,
        newValue: finding.value_b || null,
        confidenceScore,
        confidenceLevel,
        sourceProvider: finding.source_b || null,
        description: `Preencher campo "${fieldLabel(field)}" para ${peptide.name}`,
        impact: `O campo preenchido aparecerá na seção correspondente da página do peptídeo`,
        requiresManualReview: rule.requiresManualReview,
      };
    }

    case "no_source":
      return {
        field: "source_origins",
        correctionType: "merge",
        oldValue: peptide.source_origins || [],
        newValue: finding.value_b ? [finding.value_b] : [],
        confidenceScore,
        confidenceLevel,
        sourceProvider: finding.source_b || null,
        description: `Adicionar origem verificável para ${peptide.name}`,
        impact: "A origem será registrada nos metadados de rastreabilidade do peptídeo",
        requiresManualReview: rule.requiresManualReview,
      };

    case "data_inconsistency":
      return {
        field: "slug",
        correctionType: "replace",
        oldValue: peptide.slug,
        newValue: peptide.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        confidenceScore: 95,
        confidenceLevel: "high",
        sourceProvider: "internal",
        description: `Corrigir slug inconsistente de ${peptide.name}`,
        impact: "O slug será atualizado para refletir o nome correto. Links antigos podem ser afetados.",
        requiresManualReview: false,
      };

    case "no_protocol":
      return {
        field: "protocol_phases",
        correctionType: "add",
        oldValue: null,
        newValue: null,
        confidenceScore: 20,
        confidenceLevel: "low",
        sourceProvider: null,
        description: `Protocolo ausente para ${peptide.name}`,
        impact: "Necessário preencher manualmente com dados validados da literatura",
        requiresManualReview: true,
      };

    case "cross_source_conflict":
      return {
        field: finding.source_a || "unknown",
        correctionType: "replace",
        oldValue: finding.value_a,
        newValue: finding.value_b,
        confidenceScore: 20,
        confidenceLevel: "low",
        sourceProvider: finding.source_b || null,
        description: `Conflito entre fontes para ${peptide.name}`,
        impact: "Revisão manual obrigatória. Escolha a fonte mais confiável.",
        requiresManualReview: true,
      };

    default:
      return null;
  }
}

// ── Helpers ──

function extractMissingFields(description: string | null, peptide: Record<string, any>): string[] {
  if (!description) return [];
  const fields = ["description", "mechanism", "category", "benefits", "dosage_info"];
  return fields.filter((f) => {
    if (description.toLowerCase().includes(f)) return true;
    const val = peptide[f];
    if (val === null || val === undefined) return true;
    if (Array.isArray(val) && val.length === 0) return true;
    return false;
  });
}

export function fieldLabel(field: string): string {
  const labels: Record<string, string> = {
    description: "Descrição",
    mechanism: "Mecanismo de Ação",
    benefits: "Benefícios",
    dosage_info: "Informações de Dosagem",
    dosage_table: "Tabela de Dosagem",
    protocol_phases: "Fases do Protocolo",
    sequence: "Sequência",
    scientific_references: "Referências Científicas",
    source_origins: "Origens Verificáveis",
    slug: "Slug/URL",
    half_life: "Meia-Vida",
    reconstitution: "Reconstituição",
    classification: "Classificação",
    evidence_level: "Nível de Evidência",
    side_effects: "Efeitos Colaterais",
    interactions: "Interações",
    stacks: "Stacks",
    structure_info: "Informação Estrutural",
    alternative_names: "Nomes Alternativos",
    organism: "Organismo",
    biological_activity: "Atividade Biológica",
  };
  return labels[field] || field;
}

export function confidenceBadgeColor(level: ConfidenceLevel): string {
  switch (level) {
    case "high": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
    case "medium": return "text-amber-400 bg-amber-400/10 border-amber-400/30";
    case "low": return "text-red-400 bg-red-400/10 border-red-400/30";
  }
}

export function correctionTypeBadge(type: CorrectionType): { label: string; color: string } {
  switch (type) {
    case "add": return { label: "Adicionando", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" };
    case "replace": return { label: "Substituindo", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" };
    case "merge": return { label: "Mesclando", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" };
    case "remove": return { label: "Removendo", color: "text-red-400 bg-red-400/10 border-red-400/30" };
    case "manual_assist": return { label: "Revisão Manual", color: "text-purple-400 bg-purple-400/10 border-purple-400/30" };
  }
}

export function isAutoCorrectible(category: string): boolean {
  const rule = CONFIDENCE_RULES[category];
  return rule?.autoCorrectible ?? false;
}

export function getSourcePriority(field: string): string[] {
  return SOURCE_PRIORITY[field] || [];
}
