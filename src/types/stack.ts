export interface Stack {
  id: string;
  name: string;
  subtitle: string | null;
  category: string;
  description: string | null;
  peptides: StackPeptide[];
  duration: string | null;
  timing: string | null;
  benefits: string[] | null;
  warnings: string[] | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface StackPeptide {
  name: string;
  dose: string;
}

export const STACK_CATEGORIES = [
  "Todos",
  "Recuperação",
  "Emagrecimento",
  "Cognição",
  "Longevidade",
  "Performance",
  "Imunidade",
  "Estética",
  "Anti-aging",
  "Cardiovascular",
  "Hormonal",
  "Neuroproteção",
  "Sono / Recuperação",
  "Definição",
] as const;

export type StackCategory = (typeof STACK_CATEGORIES)[number];
