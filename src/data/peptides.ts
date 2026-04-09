export interface Peptide {
  id: number;
  name: string;
  category: string;
  description: string;
  isPro: boolean;
  isNew?: boolean;
  image: string;
}

export const categories = [
  "Todos", "Anti-aging", "Antioxidante", "Biorregulador", "Cardiovascular",
  "Emagrecimento", "Estética", "GH / Secretagogos", "Hormonal", "Imunidade",
  "Metabolismo", "Neuroproteção", "Nootrópicos", "Performance", "Recuperação",
  "Sexual", "Sono / Recuperação",
];

export const categoryGradients: Record<string, string> = {
  "Anti-aging": "from-purple-500 to-pink-500",
  "Antioxidante": "from-green-400 to-emerald-600",
  "Biorregulador": "from-blue-400 to-indigo-600",
  "Cardiovascular": "from-red-400 to-rose-600",
  "Emagrecimento": "from-orange-400 to-amber-600",
  "Estética": "from-fuchsia-400 to-pink-600",
  "GH / Secretagogos": "from-cyan-400 to-teal-600",
  "Hormonal": "from-violet-400 to-purple-600",
  "Imunidade": "from-lime-400 to-green-600",
  "Metabolismo": "from-yellow-400 to-orange-600",
  "Neuroproteção": "from-sky-400 to-blue-600",
  "Nootrópicos": "from-indigo-400 to-violet-600",
  "Performance": "from-red-500 to-orange-500",
  "Recuperação": "from-teal-400 to-cyan-600",
  "Sexual": "from-pink-400 to-rose-600",
  "Sono / Recuperação": "from-slate-400 to-blue-800",
  "Longevidade": "from-amber-400 to-yellow-600",
  "Fundamentos": "from-gray-400 to-slate-600",
  "Segurança": "from-red-400 to-orange-500",
  "Neuro / Cognitivo": "from-indigo-400 to-blue-600",
};

export const peptides: Peptide[] = [
  { id: 1, name: "5-Amino-1MQ", category: "Metabolismo", description: "Aumento do metabolismo · Redução de gordura", isPro: true, image: "" },
  { id: 2, name: "Adamax", category: "Nootrópicos", description: "Melhora cognitiva · Neuroproteção", isPro: true, image: "" },
  { id: 3, name: "AICAR", category: "Performance", description: "Resistência física · Oxidação de gordura", isPro: true, image: "" },
  { id: 4, name: "AOD-9604", category: "Emagrecimento", description: "Queima de gordura · Sem efeito no IGF-1", isPro: true, image: "" },
  { id: 5, name: "Ara-290", category: "Neuroproteção", description: "Neuroproteção · Redução de dor neuropática", isPro: true, image: "" },
  { id: 6, name: "BPC-157", category: "Recuperação", description: "Cicatrização acelerada · Proteção gástrica", isPro: true, image: "" },
  { id: 7, name: "BPC-157 para Neuroproteção", category: "Nootrópicos", description: "Neuroproteção · Reparo neural", isPro: true, image: "" },
  { id: 8, name: "Cagrilintide", category: "Emagrecimento", description: "Supressão do apetite · Perda de peso", isPro: true, image: "" },
  { id: 9, name: "Cardiogen", category: "Cardiovascular", description: "Proteção cardíaca · Regulação do ritmo", isPro: true, image: "" },
  { id: 10, name: "Cartalax", category: "Anti-aging", description: "Saúde articular · Anti-aging", isPro: true, image: "" },
  { id: 11, name: "Cerebrolysin - Neurotrófico Peptídico", category: "Nootrópicos", description: "Neuroplasticidade · Recuperação pós-AVC", isPro: true, image: "" },
  { id: 12, name: "Cerebrolysin", category: "Nootrópicos", description: "Neuroplasticidade · Melhora de memória", isPro: true, image: "" },
  { id: 13, name: "Chonluten", category: "Biorregulador", description: "Saúde pulmonar · Anti-inflamatório respiratório", isPro: true, image: "" },
  { id: 14, name: "CJC-1295 DAC", category: "GH / Secretagogos", description: "Liberação pulsátil de GH · Aumento de IGF-1", isPro: true, image: "" },
  { id: 15, name: "CJC-1295 NO DAC", category: "GH / Secretagogos", description: "Pulsos naturais de GH · Menos retenção hídrica", isPro: true, image: "" },
  { id: 16, name: "Cortagen", category: "Nootrópicos", description: "Função cortical · Neuroproteção", isPro: true, image: "" },
  { id: 17, name: "Crystagen", category: "Imunidade", description: "Imunomodulação · Função tímica", isPro: true, image: "" },
  { id: 18, name: "Dihexa - Potenciador Cognitivo", category: "Nootrópicos", description: "Potência cognitiva extrema · Sinaptogênese", isPro: true, image: "" },
  { id: 19, name: "DSIP", category: "Sono / Recuperação", description: "Qualidade do sono · Recuperação noturna", isPro: true, image: "" },
  { id: 20, name: "Epithalon", category: "Anti-aging", description: "Extensão de telômeros · Regulação do ciclo circadiano", isPro: true, image: "" },
  { id: 21, name: "FOXO4-DRI", category: "Anti-aging", description: "Eliminação de células senescentes · Rejuvenescimento celular", isPro: true, image: "" },
  { id: 22, name: "GHK-Cu", category: "Anti-aging", description: "Rejuvenescimento da pele · Crescimento capilar", isPro: true, image: "" },
  { id: 23, name: "GHRP-2", category: "GH / Secretagogos", description: "Forte liberação de GH · Aumento do apetite", isPro: true, image: "" },
  { id: 24, name: "GHRP-6", category: "GH / Secretagogos", description: "Liberação de GH · Estímulo do apetite", isPro: true, image: "" },
  { id: 25, name: "Glutathione", category: "Antioxidante", description: "Desintoxicação · Proteção celular", isPro: true, image: "" },
  { id: 26, name: "Gonadorelin", category: "Hormonal", description: "Estimulação de LH/FSH · Preservação da fertilidade", isPro: true, image: "" },
  { id: 27, name: "HCG (5000IU Vial)", category: "Hormonal", description: "Estimulação hormonal · Fertilidade", isPro: false, image: "" },
  { id: 28, name: "HGH 191AA (10IU Vial)", category: "GH / Secretagogos", description: "Crescimento muscular · Queima de gordura", isPro: true, image: "" },
  { id: 29, name: "HMG (75IU Vial)", category: "Hormonal", description: "Estimulação gonadal · Fertilidade", isPro: true, image: "" },
  { id: 30, name: "IGF-1 LR3", category: "GH / Secretagogos", description: "Crescimento muscular · Recuperação", isPro: true, image: "" },
  { id: 31, name: "Ipamorelin", category: "GH / Secretagogos", description: "Aumento de GH · Melhora do sono", isPro: true, image: "" },
  { id: 32, name: "Kisspeptin", category: "Hormonal", description: "Regulação hormonal · Função reprodutiva", isPro: true, image: "" },
  { id: 33, name: "KLOW", category: "Recuperação", description: "Recuperação avançada · Anti-inflamatório", isPro: true, isNew: true, image: "" },
  { id: 34, name: "KPV", category: "Imunidade", description: "Anti-inflamatório · Saúde intestinal", isPro: true, image: "" },
  { id: 35, name: "L-Carnitine", category: "Metabolismo", description: "Oxidação de gordura · Energia celular", isPro: true, image: "" },
  { id: 36, name: "Livagen", category: "Biorregulador", description: "Saúde hepática · Desintoxicação", isPro: true, image: "" },
  { id: 37, name: "LL-37", category: "Imunidade", description: "Atividade antimicrobiana · Imunomodulação", isPro: true, image: "" },
  { id: 38, name: "Mazdutide", category: "Emagrecimento", description: "Perda de peso · Controle glicêmico", isPro: true, image: "" },
  { id: 39, name: "Melanotan II", category: "Estética", description: "Bronzeamento · Função sexual", isPro: true, image: "" },
  { id: 40, name: "MGF", category: "Recuperação", description: "Reparo muscular · Hipertrofia", isPro: true, image: "" },
  { id: 41, name: "MOTS-C", category: "Metabolismo", description: "Sensibilidade à insulina · Metabolismo energético", isPro: true, image: "" },
  { id: 42, name: "NAD+", category: "Anti-aging", description: "Energia celular · Reparo de DNA", isPro: true, image: "" },
  { id: 43, name: "Ovagen", category: "Biorregulador", description: "Saúde hepática · Saúde gastrointestinal", isPro: true, image: "" },
  { id: 44, name: "Oxytocin", category: "Hormonal", description: "Vínculo social · Redução de ansiedade", isPro: true, image: "" },
  { id: 45, name: "P21 (Cerebrolysin Mimético)", category: "Nootrópicos", description: "Neurogênese · Melhora cognitiva", isPro: true, image: "" },
  { id: 46, name: "PE-22-28", category: "Nootrópicos", description: "Melhora de memória · Foco", isPro: true, image: "" },
  { id: 47, name: "Pinealon", category: "Nootrópicos", description: "Regulação circadiana · Neuroproteção", isPro: true, image: "" },
  { id: 48, name: "PNC-27", category: "Anti-aging", description: "Atividade antitumoral · Seletividade celular", isPro: true, image: "" },
  { id: 49, name: "Prostamax", category: "Biorregulador", description: "Saúde prostática · Anti-inflamatório", isPro: true, image: "" },
  { id: 50, name: "PT-141", category: "Sexual", description: "Função sexual · Libido", isPro: true, image: "" },
  { id: 51, name: "Retatrutide", category: "Emagrecimento", description: "Perda de peso superior · Controle glicêmico", isPro: true, isNew: true, image: "" },
  { id: 52, name: "Selank - Ansiolítico Peptídico", category: "Nootrópicos", description: "Redução da ansiedade · Estabilidade emocional", isPro: true, image: "" },
  { id: 53, name: "Selank", category: "Nootrópicos", description: "Redução da ansiedade · Melhora do humor", isPro: true, image: "" },
  { id: 54, name: "Semaglutide", category: "Emagrecimento", description: "Supressão do apetite · Perda de peso", isPro: true, image: "" },
  { id: 55, name: "Semax - Peptídeo Nootrópico", category: "Nootrópicos", description: "Melhora cognitiva · Neuroproteção", isPro: true, image: "" },
  { id: 56, name: "Semax", category: "Nootrópicos", description: "Melhora cognitiva · Neuroproteção", isPro: true, image: "" },
  { id: 57, name: "Sermorelin", category: "GH / Secretagogos", description: "Liberação natural de GH · Melhora do sono", isPro: true, image: "" },
  { id: 58, name: "SLU-PP-332", category: "Metabolismo", description: "Mimetiza exercício · Oxidação de gordura", isPro: true, image: "" },
  { id: 59, name: "SNAP-8", category: "Estética", description: "Redução de rugas · Anti-aging tópico", isPro: true, image: "" },
  { id: 60, name: "HGH Fragment 176-191", category: "Emagrecimento", description: "Queima de gordura localizada · Sem impacto na glicemia", isPro: true, isNew: true, image: "" },
  { id: 61, name: "Survodutide", category: "Emagrecimento", description: "Perda de peso · Saúde hepática", isPro: true, image: "" },
  { id: 62, name: "TB-500", category: "Recuperação", description: "Cicatrização · Redução de inflamação", isPro: true, image: "" },
  { id: 63, name: "Tesamorelin", category: "GH / Secretagogos", description: "Redução de gordura visceral · Aumento de GH", isPro: true, image: "" },
  { id: 64, name: "Testagen", category: "Hormonal", description: "Saúde testicular · Suporte hormonal", isPro: true, image: "" },
  { id: 65, name: "Thymosin Alpha-1", category: "Imunidade", description: "Fortalecimento imune · Atividade antiviral", isPro: true, image: "" },
  { id: 66, name: "Tirzepatide", category: "Emagrecimento", description: "4 variantes · 5mg Vial · 10mg Vial · 15mg Vial · 30mg Vial", isPro: false, image: "" },
  { id: 67, name: "Vesugen", category: "Cardiovascular", description: "Saúde vascular · Proteção endotelial", isPro: true, image: "" },
  { id: 68, name: "Vilon", category: "Imunidade", description: "Imunomodulação · Função tímica", isPro: true, image: "" },
  { id: 69, name: "Tesamorelin + Ipamorelin (Blend 10mg)", category: "GH / Secretagogos", description: "Secreção pulsátil de GH · Redução de gordura visceral", isPro: true, isNew: true, image: "" },
  { id: 70, name: "SS-31 (Elamipretide)", category: "Anti-aging", description: "Otimização de ATP mitocondrial · Antioxidante mitocondrial", isPro: true, isNew: true, image: "" },
  { id: 71, name: "Thymalin", category: "Imunidade", description: "Restauração tímica · Modulação de células T", isPro: true, isNew: true, image: "" },
  { id: 72, name: "Hexarelin", category: "GH / Secretagogos", description: "Forte liberação de GH · Cardioproteção", isPro: true, isNew: true, image: "" },
  { id: 73, name: "VIP (Peptídeo Vasoativo Intestinal)", category: "Imunidade", description: "Anti-inflamatório potente · Tratamento de CIRS", isPro: true, isNew: true, image: "" },
  { id: 74, name: "Liraglutide (Saxenda)", category: "Emagrecimento", description: "Supressão de apetite · GLP-1 aprovado FDA", isPro: true, isNew: true, image: "" },
  { id: 75, name: "Matrixyl (Palmitoyl Pentapeptide-4)", category: "Estética", description: "Estimulação de colágeno · Redução de rugas", isPro: true, isNew: true, image: "" },
  { id: 76, name: "Argireline (Acetyl Hexapeptide-3)", category: "Estética", description: "Botox tópico · Inibidor SNARE", isPro: true, isNew: true, image: "" },
  { id: 77, name: "Humanin", category: "Anti-aging", description: "Peptídeo mitocondrial · Citoproteção", isPro: true, isNew: true, image: "" },
  { id: 78, name: "BPC-157 Oral", category: "Recuperação", description: "Proteção gástrica oral · Cicatrização GI", isPro: true, isNew: true, image: "" },
];

export interface Guide {
  title: string;
  slug: string;
  description: string;
  category: string;
  date: string;
  isPro: boolean;
  tab: "guias" | "estudos" | "seguranca";
}

export const guides: Guide[] = [
  { slug: "caneta-peptideos", title: "Como Carregar uma Caneta de Peptídeos: Guia Passo a Passo", description: "Aprenda a reconstituir peptídeos liofilizados, carregar um cartucho estéril e administrar a dose usando uma caneta reutilizável.", category: "Recuperação", date: "05 de março de 2026", isPro: true, tab: "guias" },
  { slug: "spray-nasal-selank-semax", title: "Preparo de Spray Nasal: Selank & Semax (Fórmula Conforto)", description: "Técnica de diluição mista para spray nasal de Selank/Semax que reduz irritação nasal e mantém a eficácia do peptídeo.", category: "Nootrópicos", date: "09 de março de 2026", isPro: true, tab: "guias" },
  { slug: "ghk-cu-pele-cabelo", title: "GHK-Cu: Protocolos Tópicos para Pele e Cabelo", description: "Protocolos detalhados de GHK-Cu tópico para rejuvenescimento facial, crescimento capilar e tratamento de dano solar severo.", category: "Estética", date: "01 de março de 2026", isPro: true, tab: "guias" },
  { slug: "hgh-dose-guia", title: "Guia HGH por Dose: O que Esperar de 1 a 10 UI Diárias", description: "Guia completo sobre dosagem de HGH — cada faixa de dose (1-2, 2-4, 4-8, 6-10+ UI) serve a um propósito diferente.", category: "Performance", date: "01 de março de 2026", isPro: true, tab: "guias" },
  { slug: "reconstituicao-peptideos", title: "Reconstituição de Peptídeos: Guia Completo em 10 Etapas", description: "Passo a passo técnico para reconstituir peptídeos liofilizados com segurança: diluentes, volumes, erros comuns e armazenamento.", category: "Recuperação", date: "15 de março de 2026", isPro: true, tab: "guias" },
  { slug: "injecao-subcutanea-rotacao", title: "Guia Completo de Injeção Subcutânea (SubQ) e Rotação de Locais", description: "Técnica detalhada de aplicação subcutânea, mapa corporal de locais, rotação semanal e assepsia para peptídeos injetáveis.", category: "Recuperação", date: "15 de março de 2026", isPro: true, tab: "guias" },
  { slug: "stacking-top-10", title: "Stacking de Peptídeos: Top 10 Combinações Comprovadas", description: "As melhores combinações de peptídeos por objetivo: recuperação, emagrecimento, cognição, longevidade, imunidade e mais.", category: "Performance", date: "15 de março de 2026", isPro: true, tab: "guias" },
  { slug: "seguranca-efeitos-monitoramento", title: "Segurança, Efeitos Colaterais e Monitoramento Bioquímico", description: "Efeitos colaterais por peptídeo, exames de sangue essenciais, contraindicações absolutas e como monitorar seu ciclo com segurança.", category: "Longevidade", date: "15 de março de 2026", isPro: true, tab: "guias" },
  { slug: "spray-nasal-aplicacao", title: "Guia de Aplicação por Spray Nasal: Selank, Semax e Oxitocina", description: "Como preparar e aplicar peptídeos nasais para máxima absorção cerebral: técnica, diluente, dosagem e cuidados.", category: "Neuro / Cognitivo", date: "15 de março de 2026", isPro: true, tab: "guias" },
  { slug: "o-que-sao-peptideos", title: "O Que São Peptídeos? Guia para Iniciantes", description: "Entenda o que são peptídeos, como funcionam no corpo, a história desde a insulina até os neuropeptídeos modernos e por que são diferentes de esteroides e suplementos convencionais.", category: "Fundamentos", date: "15 de março de 2025", isPro: false, tab: "guias" },
  { slug: "7-erros-fatais", title: "7 Erros Fatais com Peptídeos (e Como Evitá-los)", description: "Os erros mais comuns que podem desperdiçar seu dinheiro ou causar problemas de saúde. Aprenda como comprar, misturar, armazenar e injetar peptídeos corretamente.", category: "Segurança", date: "15 de março de 2025", isPro: true, tab: "seguranca" },
  { slug: "equilibrio-redox-101", title: "Equilíbrio Redox 101: A Base dos Peptídeos Mitocondriais", description: "Entenda o equilíbrio redox, como a glicose vira ATP, e por que isso é fundamental antes de usar peptídeos mitocondriais como MOTS-c, SS-31 e NAD+.", category: "Fundamentos", date: "15 de março de 2025", isPro: true, tab: "estudos" },
];

export const finderGoals = [
  { emoji: "💚", label: "Recuperação & Cicatrização" },
  { emoji: "⚖️", label: "Emagrecimento & Composição Corporal" },
  { emoji: "🧠", label: "Desempenho Cognitivo" },
  { emoji: "⏰", label: "Anti-aging & Longevidade" },
  { emoji: "🌙", label: "Sono & Recuperação Noturna" },
  { emoji: "🛡️", label: "Imunidade & Anti-inflamatório" },
  { emoji: "❤️", label: "Saúde Hormonal & Sexual" },
  { emoji: "📈", label: "Hormônio do Crescimento (GH)" },
  { emoji: "✨", label: "Estética & Pele" },
  { emoji: "💓", label: "Saúde Cardiovascular" },
];
