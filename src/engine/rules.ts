/**
 * Engine Rules — Mappings between user goals and peptide recommendations.
 * Each rule maps a goal to peptides with a relevance score (0-100) and reason.
 */

export interface PeptideRule {
  slug: string;
  name: string;
  score: number;
  reason: string;
}

export interface GoalRule {
  goal: string;
  emoji: string;
  peptides: PeptideRule[];
}

export const GOAL_RULES: GoalRule[] = [
  {
    goal: "Recuperação & Cicatrização",
    emoji: "💚",
    peptides: [
      { slug: "bpc-157", name: "BPC-157", score: 95, reason: "Padrão-ouro para cicatrização de tendões, ligamentos e tecidos. Ação sistêmica e local." },
      { slug: "tb-500", name: "TB-500", score: 90, reason: "Promove angiogênese e migração celular. Sinérgico com BPC-157." },
      { slug: "mgf", name: "MGF", score: 75, reason: "Fator de crescimento mecânico para reparo muscular pós-lesão." },
      { slug: "ghk-cu", name: "GHK-Cu", score: 70, reason: "Estimula colágeno, reduz inflamação e acelera cicatrização." },
      { slug: "klow", name: "KLOW", score: 65, reason: "Recuperação avançada com propriedades anti-inflamatórias." },
    ],
  },
  {
    goal: "Emagrecimento & Composição Corporal",
    emoji: "⚖️",
    peptides: [
      { slug: "tirzepatide", name: "Tirzepatide", score: 98, reason: "Agonista duplo GIP/GLP-1. Perda de peso de até 22% em estudos clínicos." },
      { slug: "semaglutide", name: "Semaglutide", score: 95, reason: "Agonista GLP-1 aprovado para obesidade. Redução de 15-17% do peso." },
      { slug: "retatrutide", name: "Retatrutide", score: 90, reason: "Tri-agonista GIP/GLP-1/Glucagon. Resultados superiores em fase 2." },
      { slug: "aod-9604", name: "AOD-9604", score: 75, reason: "Fragmento de HGH que queima gordura sem afetar IGF-1." },
      { slug: "hgh-fragment-176-191", name: "HGH Fragment 176-191", score: 70, reason: "Lipólise sem efeitos colaterais do GH completo." },
      { slug: "5-amino-1mq", name: "5-Amino-1MQ", score: 65, reason: "Inibidor de NNMT que aumenta metabolismo celular." },
      { slug: "mots-c", name: "MOTS-C", score: 60, reason: "Peptídeo mitocondrial que melhora sensibilidade à insulina." },
    ],
  },
  {
    goal: "Desempenho Cognitivo",
    emoji: "🧠",
    peptides: [
      { slug: "semax", name: "Semax", score: 90, reason: "Nootrópico com evidência forte. Melhora BDNF e cognição." },
      { slug: "selank", name: "Selank", score: 85, reason: "Ansiolítico peptídico que melhora foco e estabilidade emocional." },
      { slug: "dihexa", name: "Dihexa", score: 80, reason: "Potenciador sináptico 10 milhões de vezes mais potente que BDNF." },
      { slug: "pe-22-28", name: "PE-22-28", score: 75, reason: "Melhora memória de trabalho e consolidação." },
      { slug: "cortagen", name: "Cortagen", score: 65, reason: "Biorregulador do córtex cerebral." },
      { slug: "pinealon", name: "Pinealon", score: 60, reason: "Regulação circadiana e neuroproteção." },
    ],
  },
  {
    goal: "Anti-aging & Longevidade",
    emoji: "⏰",
    peptides: [
      { slug: "epithalon", name: "Epithalon", score: 95, reason: "Ativa telomerase e estende telômeros. Evidência em estudos humanos." },
      { slug: "ghk-cu", name: "GHK-Cu", score: 90, reason: "Reset de 4.000+ genes para padrão jovem. Múltiplos mecanismos." },
      { slug: "foxo4-dri", name: "FOXO4-DRI", score: 85, reason: "Elimina células senescentes (senolítico peptídico)." },
      { slug: "nad-plus", name: "NAD+", score: 80, reason: "Cofator essencial para reparo de DNA e metabolismo energético." },
      { slug: "ss-31", name: "SS-31", score: 75, reason: "Otimização mitocondrial e proteção contra estresse oxidativo." },
      { slug: "mots-c", name: "MOTS-C", score: 70, reason: "Peptídeo mitocondrial que mimetiza exercício." },
    ],
  },
  {
    goal: "Sono & Recuperação Noturna",
    emoji: "🌙",
    peptides: [
      { slug: "dsip", name: "DSIP", score: 90, reason: "Delta Sleep Inducing Peptide — melhora arquitetura do sono." },
      { slug: "ipamorelin", name: "Ipamorelin", score: 80, reason: "Pulso de GH noturno melhora qualidade do sono e recuperação." },
      { slug: "selank", name: "Selank", score: 70, reason: "Reduz ansiedade que interfere no sono." },
      { slug: "pinealon", name: "Pinealon", score: 65, reason: "Regulação do ritmo circadiano via glândula pineal." },
    ],
  },
  {
    goal: "Imunidade & Anti-inflamatório",
    emoji: "🛡️",
    peptides: [
      { slug: "thymosin-alpha-1", name: "Thymosin Alpha-1", score: 95, reason: "Imunomodulador aprovado em 35+ países. Ativa NK e T cells." },
      { slug: "ll-37", name: "LL-37", score: 85, reason: "Peptídeo antimicrobiano natural com ação anti-biofilm." },
      { slug: "kpv", name: "KPV", score: 80, reason: "Tripeptídeo anti-inflamatório derivado de alfa-MSH." },
      { slug: "thymalin", name: "Thymalin", score: 75, reason: "Restauração da função tímica e regulação imunológica." },
      { slug: "bpc-157", name: "BPC-157", score: 65, reason: "Anti-inflamatório sistêmico com proteção de mucosa." },
    ],
  },
  {
    goal: "Saúde Hormonal & Sexual",
    emoji: "❤️",
    peptides: [
      { slug: "pt-141", name: "PT-141", score: 90, reason: "Agonista MC4R para função sexual em homens e mulheres." },
      { slug: "kisspeptin", name: "Kisspeptin", score: 80, reason: "Regulador central do eixo HPG e fertilidade." },
      { slug: "gonadorelin", name: "Gonadorelin", score: 75, reason: "Estimula LH/FSH natural. Preserva fertilidade em TRT." },
      { slug: "oxytocin", name: "Oxytocin", score: 65, reason: "Vínculo social e função sexual." },
    ],
  },
  {
    goal: "Hormônio do Crescimento (GH)",
    emoji: "📈",
    peptides: [
      { slug: "ipamorelin", name: "Ipamorelin", score: 95, reason: "GHRP seletivo. Pulso limpo de GH sem efeitos colaterais." },
      { slug: "cjc-1295-dac", name: "CJC-1295 DAC", score: 90, reason: "Elevação sustentada de GH por 7-10 dias." },
      { slug: "cjc-1295-no-dac", name: "CJC-1295 NO DAC", score: 85, reason: "Pulsos naturais sem elevação contínua." },
      { slug: "tesamorelin", name: "Tesamorelin", score: 85, reason: "GHRH sintético. Reduz gordura visceral." },
      { slug: "sermorelin", name: "Sermorelin", score: 75, reason: "GHRH clássico com perfil de segurança excelente." },
      { slug: "hgh-191aa", name: "HGH 191AA", score: 70, reason: "GH recombinante direto. Gold standard." },
    ],
  },
  {
    goal: "Estética & Pele",
    emoji: "✨",
    peptides: [
      { slug: "ghk-cu", name: "GHK-Cu", score: 95, reason: "Estimula colágeno I/III, elastina e glicosaminoglicanos." },
      { slug: "snap-8", name: "SNAP-8", score: 80, reason: "Botox-like tópico. Reduz profundidade de rugas." },
      { slug: "melanotan-ii", name: "Melanotan II", score: 70, reason: "Bronzeamento sem UV. Proteção contra dano solar." },
      { slug: "bpc-157", name: "BPC-157", score: 65, reason: "Acelera cicatrização de pele e reduz cicatrizes." },
    ],
  },
  {
    goal: "Saúde Cardiovascular",
    emoji: "💓",
    peptides: [
      { slug: "vesugen", name: "Vesugen", score: 85, reason: "Biorregulador vascular para proteção endotelial." },
      { slug: "cardiogen", name: "Cardiogen", score: 80, reason: "Biorregulador cardíaco para regulação do ritmo." },
      { slug: "bpc-157", name: "BPC-157", score: 70, reason: "Proteção vascular e formação de novos vasos." },
      { slug: "ss-31", name: "SS-31", score: 65, reason: "Proteção mitocondrial cardíaca." },
    ],
  },
];

/** Interaction rules between peptides */
export interface InteractionRule {
  peptideA: string;
  peptideB: string;
  type: "synergic" | "caution" | "avoid";
  description: string;
}

export const INTERACTION_RULES: InteractionRule[] = [
  { peptideA: "bpc-157", peptideB: "tb-500", type: "synergic", description: "Sinergia clássica para recuperação. BPC-157 sistêmico + TB-500 local." },
  { peptideA: "ipamorelin", peptideB: "cjc-1295-no-dac", type: "synergic", description: "Combo padrão-ouro para GH. Pulsos amplificados." },
  { peptideA: "tirzepatide", peptideB: "semaglutide", type: "avoid", description: "Não combinar dois GLP-1 agonistas. Risco de hipoglicemia e efeitos GI severos." },
  { peptideA: "ghrp-2", peptideB: "ghrp-6", type: "caution", description: "Redundância de mecanismo. Escolha um ou outro." },
  { peptideA: "semax", peptideB: "selank", type: "synergic", description: "Combinação nootrópica complementar: cognição + ansiolítico." },
  { peptideA: "epithalon", peptideB: "ghk-cu", type: "synergic", description: "Anti-aging dual: telômeros + expressão gênica." },
  { peptideA: "thymosin-alpha-1", peptideB: "ll-37", type: "synergic", description: "Imunidade potencializada: modulação + antimicrobiano." },
];
