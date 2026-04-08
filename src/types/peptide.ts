export interface Peptide {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  benefits: string[] | null;
  dosage_info: string | null;
  side_effects: string | null;
  mechanism: string | null;
  mechanism_points: string[] | null;
  classification: string | null;
  evidence_level: string | null;
  half_life: string | null;
  reconstitution: string | null;
  reconstitution_steps: string[] | null;
  alternative_names: string[] | null;
  timeline: PeptideTimeline[] | null;
  dosage_table: PeptideDosageEntry[] | null;
  protocol_phases: ProtocolPhase[] | null;
  interactions: PeptideInteraction[] | null;
  scientific_references: ScientificReference[] | null;
  stacks: PeptideStack[] | null;
  created_at: string;
  updated_at: string;
}

export interface PeptideTimeline {
  week: string;
  effects: string;
}

export interface PeptideDosageEntry {
  indication: string;
  dose: string;
  frequency: string;
  duration: string;
}

export interface ProtocolPhase {
  phase: string;
  duration: string;
  dose: string;
  frequency: string;
  notes?: string;
}

export interface PeptideInteraction {
  nome: string;
  status: string;
  descricao: string;
}

export interface ScientificReference {
  title: string;
  source: string;
  year: number;
  pmid?: string;
}

export interface PeptideStack {
  name: string;
  peptides: string[];
  objective: string;
}

/** Lightweight peptide for lists/cards */
export interface PeptideListItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  benefits: string[] | null;
}

/** Normalized interaction for the interactions page */
export interface NormalizedInteraction {
  nome: string;
  status: string;
  descricao: string;
  mecanismo?: string;
  consequencias?: string;
  fonte?: string;
}

export interface PeptideWithInteractions {
  name: string;
  slug: string;
  category: string;
  interactions: NormalizedInteraction[];
}

export type InteractionStatus = "SINÉRGICO" | "COMPLEMENTAR" | "MONITORAR" | "EVITAR";

export type StatusFilter = "all" | "synergic" | "complementary" | "caution" | "avoid";

export const STATUS_FILTER_MAP: Record<StatusFilter, string> = {
  all: "",
  synergic: "SINÉRGICO",
  complementary: "COMPLEMENTAR",
  caution: "MONITORAR",
  avoid: "EVITAR",
};
