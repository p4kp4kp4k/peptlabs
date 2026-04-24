/**
 * Medical term translations (EN → PT-BR)
 * =======================================
 * Used to translate adverse events, side effects and other clinical terms
 * coming from external sources (openFDA, FAERS, MedDRA) before showing
 * them in the audit/review interface, which is fully Portuguese.
 */

const TERM_MAP: Record<string, string> = {
  // Gastrointestinal
  "nausea": "Náusea",
  "vomiting": "Vômito",
  "diarrhoea": "Diarreia",
  "diarrhea": "Diarreia",
  "constipation": "Constipação",
  "abdominal pain": "Dor abdominal",
  "abdominal discomfort": "Desconforto abdominal",
  "dyspepsia": "Dispepsia",
  "gastritis": "Gastrite",
  "gastroesophageal reflux disease": "Doença do refluxo gastroesofágico",
  "decreased appetite": "Diminuição do apetite",
  "loss of appetite": "Perda de apetite",
  "flatulence": "Flatulência",
  "eructation": "Eructação",
  "bloating": "Inchaço abdominal",

  // Neurological
  "headache": "Cefaleia",
  "migraine": "Enxaqueca",
  "dizziness": "Tontura",
  "fatigue": "Fadiga",
  "asthenia": "Astenia",
  "somnolence": "Sonolência",
  "insomnia": "Insônia",
  "tremor": "Tremor",
  "seizure": "Convulsão",
  "epilepsy": "Epilepsia",
  "generalised tonic-clonic seizure": "Convulsão tônico-clônica generalizada",
  "idiopathic intracranial hypertension": "Hipertensão intracraniana idiopática",
  "paresthesia": "Parestesia",

  // Trauma / events
  "fall": "Queda",
  "head injury": "Traumatismo craniano",
  "injury": "Lesão",

  // Cardiovascular
  "tachycardia": "Taquicardia",
  "hypertension": "Hipertensão",
  "hypotension": "Hipotensão",
  "palpitations": "Palpitações",
  "chest pain": "Dor torácica",

  // Endocrine / metabolic
  "hypoglycaemia": "Hipoglicemia",
  "hypoglycemia": "Hipoglicemia",
  "hyperglycaemia": "Hiperglicemia",
  "weight decreased": "Perda de peso",
  "weight increased": "Ganho de peso",
  "dehydration": "Desidratação",

  // Skin / injection site
  "injection site pain": "Dor no local da injeção",
  "injection site reaction": "Reação no local da injeção",
  "injection site erythema": "Eritema no local da injeção",
  "injection site swelling": "Inchaço no local da injeção",
  "rash": "Erupção cutânea",
  "pruritus": "Prurido",
  "urticaria": "Urticária",
  "erythema": "Eritema",

  // Respiratory
  "dyspnoea": "Dispneia",
  "dyspnea": "Dispneia",
  "cough": "Tosse",

  // Renal / hepatic
  "pancreatitis": "Pancreatite",
  "acute pancreatitis": "Pancreatite aguda",
  "cholelithiasis": "Colelitíase",
  "cholecystitis": "Colecistite",
  "renal impairment": "Insuficiência renal",
  "hepatic impairment": "Insuficiência hepática",

  // Generic
  "death": "Óbito",
  "drug ineffective": "Medicamento ineficaz",
  "off label use": "Uso off-label",
  "product use issue": "Problema no uso do produto",
  "malaise": "Mal-estar",
  "pain": "Dor",
  "fever": "Febre",
  "pyrexia": "Febre",
  "chills": "Calafrios",
};

const PHRASE_MAP: Array<[RegExp, string]> = [
  [/\bconsult (your |a )?(healthcare|health) (professional|provider)\b/gi, "Consultar profissional de saúde"],
  [/\beffects (may|can) vary (with|by|according to) (dose|dosage)( and individual protocol)?/gi, "Efeitos podem variar conforme dosagem e protocolo individual"],
  [/\bbased on individual response\b/gi, "com base na resposta individual"],
];

/** Detect if a string looks like English (very heuristic) */
function looksEnglish(s: string): boolean {
  if (!s) return false;
  // If it contains accented PT chars, assume PT
  if (/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(s)) return false;
  // Common english function words
  return /\b(the|and|of|with|may|can|should|use|effects?|professional|individual)\b/i.test(s);
}

/** Translate a single term (case-insensitive) */
function translateTerm(term: string): string {
  const key = term.trim().toLowerCase();
  if (TERM_MAP[key]) return TERM_MAP[key];
  return term.trim();
}

/**
 * Translate a free-form medical text from English to Portuguese.
 * Strategy:
 *  1. If the value is a comma/semicolon-separated list of MedDRA terms,
 *     translate each term independently.
 *  2. Otherwise, run phrase replacements and return.
 *  3. If nothing matches, return original.
 */
export function translateMedicalText(input: string | null | undefined): string {
  if (!input) return "";
  const text = String(input).trim();
  if (!text) return "";

  // List of terms (commas / semicolons / line breaks)
  if (/[,;\n]/.test(text) && text.length < 600) {
    const parts = text.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const translated = parts.map((p) => translateTerm(p));
      return translated.join(", ");
    }
  }

  // Single term direct hit
  const direct = TERM_MAP[text.toLowerCase()];
  if (direct) return direct;

  // Phrase rewrites
  let out = text;
  for (const [re, repl] of PHRASE_MAP) {
    out = out.replace(re, repl);
  }

  // Inline word-by-word replacement for known terms (whole-word, case-insensitive)
  if (looksEnglish(out)) {
    for (const [en, pt] of Object.entries(TERM_MAP)) {
      const re = new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      out = out.replace(re, pt);
    }
  }

  return out;
}
