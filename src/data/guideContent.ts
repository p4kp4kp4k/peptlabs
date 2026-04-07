export interface GuideStep {
  title: string;
  content: string[];
  tip?: string;
  warning?: string;
}

export interface GuideSection {
  title: string;
  icon?: string;
  items?: string[];
  table?: { label: string; value: string }[];
}

export interface GuideContent {
  intro: string;
  videoUrl?: string;
  steps?: GuideStep[];
  sections?: GuideSection[];
  precautions?: { label: string; value: string }[];
  recommendations?: { title: string; details: string[] }[];
  disclaimer?: string;
}

export const guideContents: Record<string, GuideContent> = {
  "caneta-peptideos": {
    intro: "Este guia ensina como reconstituir peptídeos liofilizados, carregar um cartucho corretamente e administrar a dose usando uma caneta reutilizável.",
    // videoUrl: undefined — adicione a URL real do vídeo quando disponível
    sections: [
      {
        title: "Checklist de Materiais",
        icon: "clipboard",
        items: [
          "Frasco de liofilização (ex: BPC-157, GH)",
          "Água bacteriostática (BAC)",
          "Seringa de 3 mL com agulha de aspiração",
          "Opcional: Agulha de ventilação (ex: seringa de insulina sem êmbolo)",
          "Swabs de álcool 70%",
          "Cartucho estéril de 3 mL para caneta",
          "Agulhas para caneta (29G-32G)",
        ],
      },
    ],
    steps: [
      {
        title: "Passo 1: Limpeza e Preparação",
        content: [
          "Lave as mãos cuidadosamente.",
          "Higienize o topo do frasco de peptídeo e do cartucho com swabs de álcool.",
          "Organize todos os materiais numa superfície limpa.",
        ],
      },
      {
        title: "Passo 2: Reconstituir o Peptídeo",
        content: [
          "Aspire a quantidade adequada de água bacteriostática com a seringa.",
          "Insira a agulha no frasco de peptídeo, direcionando-a para a lateral para evitar danificar o pó.",
          "Injete a água lentamente no frasco.",
          "Gire suavemente (nunca agite) o frasco até o peptídeo estar completamente dissolvido.",
        ],
        tip: "Use a Calculadora de Peptídeos da plataforma para determinar a quantidade exata de água e a concentração resultante.",
      },
      {
        title: "Passo 3: Carregar o Cartucho",
        content: [
          "Aspire a solução reconstituída do peptídeo com a seringa.",
          "Insira uma agulha de ventilação na lateral do êmbolo do cartucho para permitir a saída de ar.",
          "Injete a solução lentamente no cartucho.",
          "Remova a agulha de ventilação após o preenchimento.",
        ],
      },
      {
        title: "Passo 4: Montar a Caneta",
        content: [
          "Desrosqueie a caneta para inserir o cartucho preenchido no compartimento.",
          "Rosqueie a caneta novamente até ficar firme.",
        ],
      },
      {
        title: "Passo 5: Purgar a Caneta (Priming)",
        content: [
          "Conecte uma agulha nova à caneta.",
          "Segure a caneta com a agulha apontando para cima.",
          "Selecione uma dose pequena (ex: 2 unidades).",
          "Pressione até ver uma gota na ponta da agulha.",
        ],
        warning: "Sempre purgue antes da primeira aplicação ou ao trocar de agulha para garantir a precisão da dose.",
      },
      {
        title: "Passo 6: Administrar a Dose",
        content: [
          "Selecione a dose prescrita na caneta.",
          "Limpe o local de aplicação com um swab de álcool.",
          "Insira a agulha por via subcutânea em um ângulo de 90°.",
          "Pressione o botão e mantenha por 5-10 segundos.",
          "Descarte a agulha com segurança em um recipiente para perfurocortantes.",
        ],
        tip: "Alterne os locais de aplicação para evitar lipodistrofia.",
      },
      {
        title: "Passo 7: Armazenamento",
        content: [
          "Tampe a caneta e armazene na geladeira (2-8°C).",
          "Mantenha longe da luz direta e fora do alcance de crianças.",
          "A solução reconstituída é válida por até 30 dias sob refrigeração.",
        ],
      },
    ],
    precautions: [
      { label: "Higiene", value: "Sempre higienize mãos e superfícies antes do manuseio." },
      { label: "Agulhas", value: "Nunca reutilize agulhas — use uma nova a cada aplicação." },
      { label: "Agitação", value: "Nunca agite o frasco — gire suavemente para dissolver." },
      { label: "Temperatura", value: "Mantenha peptídeos reconstituídos refrigerados (2-8°C)." },
      { label: "Validade", value: "Descarte a solução após 30 dias da reconstituição." },
      { label: "Descarte", value: "Utilize recipiente para perfurocortantes para agulhas usadas." },
    ],
    recommendations: [
      {
        title: "HumaPen Ergo II (Eli Lilly)",
        details: [
          "Incrementos de 1 unidade (até 60 U)",
          "Design ergonômico antiderrapante para melhor controle",
          "Memória da última dose aplicada",
          "Compatível com cartuchos de 3 mL padrão",
        ],
      },
    ],
    disclaimer: "Este conteúdo é exclusivamente educacional e informativo. Não constitui conselho médico. Consulte um profissional de saúde antes de utilizar quaisquer peptídeos.",
  },

  "reconstituicao-peptideos": {
    intro: "A reconstituição é o processo de transformar o peptídeo liofilizado (pó) em uma solução líquida estável para aplicação. Erros nesta fase podem degradar o composto ou causar infecções. A qualidade do processo determina diretamente a eficácia e a segurança do peptídeo.",
    sections: [
      {
        title: "Escolha do Diluente por Tipo de Peptídeo",
        icon: "beaker",
        table: [
          { label: "Gerais (BPC, TB, GH)", value: "Água Bacteriostática — 28-30 dias de estabilidade" },
          { label: "Dose Única", value: "Água Estéril / Salina — < 24 horas, sem conservantes, uso imediato" },
          { label: "Peptídeos Ácidos (GHK-Cu)", value: "Solução Salina 0.9% — 15-20 dias, tampona pH e reduz ardência" },
        ],
      },
      {
        title: "Volume de Diluente por Concentração",
        icon: "calculator",
        table: [
          { label: "Frasco 2mg", value: "1ml BAC → 200mcg por 10 UI (0.1ml)" },
          { label: "Frasco 5mg", value: "2ml BAC → 250mcg por 10 UI (0.1ml)" },
          { label: "Frasco 10mg", value: "2ml BAC → 500mcg por 10 UI (0.1ml)" },
          { label: "Frasco 15mg", value: "3ml BAC → 500mcg por 10 UI (0.1ml)" },
          { label: "Frasco 30mg", value: "6ml BAC → 500mcg por 10 UI (0.1ml)" },
        ],
      },
    ],
    steps: [
      {
        title: "Etapa 1: Sanitização",
        content: [
          "Limpe a bancada com álcool 70%.",
        ],
      },
      {
        title: "Etapa 2: Separação",
        content: [
          "Limpe os frascos e borrachas com um novo swab de álcool.",
        ],
      },
      {
        title: "Etapa 3: Aspiração do Ar",
        content: [
          "Puxe o êmbolo da seringa de reconstituição até a marca do volume desejado (ex: 2ml).",
        ],
      },
      {
        title: "Etapa 4: Equalização de Pressão",
        content: [
          "Insira a agulha no frasco de água BAC, injete o ar e aspire o líquido.",
        ],
      },
      {
        title: "Etapa 5: Injeção Lenta",
        content: [
          "Insira a agulha no frasco do peptídeo.",
          "Incline o frasco para que a água escorra lentamente pela parede de vidro.",
          "Nunca injete diretamente sobre o pó.",
        ],
        warning: "A etapa mais crítica: a água deve escorrer pela parede de vidro. Injetar diretamente sobre o pó pode desnaturar o peptídeo.",
      },
      {
        title: "Etapa 6: Remoção de Vácuo",
        content: [
          "Se o frasco tiver vácuo forte, deixe a agulha sugar o líquido sozinha, controlando o fluxo com o dedo.",
        ],
      },
      {
        title: "Etapa 7: Dissolução",
        content: [
          "Retire a agulha. Deixe o frasco descansar por 5 minutos.",
        ],
      },
      {
        title: "Etapa 8: Homogeneização",
        content: [
          "Gire o frasco suavemente entre as palmas das mãos.",
          "NUNCA AGITE o frasco.",
        ],
      },
      {
        title: "Etapa 9: Inspeção",
        content: [
          "Verifique se a solução está límpida.",
          "Se estiver turva (cloudy), pode estar degradada.",
          "Exceção: Tesamorelin pode ter leve opacidade.",
        ],
      },
      {
        title: "Etapa 10: Rotulagem e Armazenamento",
        content: [
          "Anote a data de reconstituição no frasco.",
          "Coloque imediatamente na geladeira (porta não recomendada pela vibração).",
        ],
      },
    ],
    precautions: [
      { label: "\"O Agitador\"", value: "Agitar o frasco destrói as ligações de aminoácidos de peptídeos frágeis como HGH e IGF-1. Sempre gire suavemente entre as palmas." },
      { label: "\"O Esquecido\"", value: "Deixar o peptídeo reconstituído fora da geladeira por mais de 2 horas reduz a potência em até 30%." },
      { label: "\"Água Errada\"", value: "Usar água da torneira ou mineral causa infecções graves (abscessos). Use exclusivamente água bacteriostática ou estéril." },
    ],
    disclaimer: "Água da torneira, mineral ou filtrada NUNCA devem ser usadas para reconstituir peptídeos injetáveis. Este conteúdo é exclusivamente educacional — consulte um profissional de saúde.",
  },

  "injecao-subcutanea-rotacao": {
    intro: "A eficácia depende não apenas da dose, mas da técnica de entrega. Erros de aplicação causam perda de biodisponibilidade ou abscessos. O objetivo é depositar o líquido na camada de gordura logo abaixo da derme.",
    sections: [
      {
        title: "Técnica Detalhada de Injeção SubQ",
        icon: "syringe",
        items: [
          "Ângulo: 45° para pessoas magras ou 90° para quem tem mais tecido adiposo.",
          "Profundidade: Agulhas de 8mm (31G) ou 12.7mm (29G) são o padrão.",
          "Velocidade: Injeção lenta (2-3 segundos por 10 unidades) reduz a dor e o risco de hematomas.",
          "Finalização: Após injetar, conte 5 segundos antes de retirar a agulha para evitar o refluxo do peptídeo.",
        ],
      },
      {
        title: "Mapa Corporal e Locais de Aplicação",
        icon: "body",
        items: [
          "Abdômen — região periumbilical, boa absorção.",
          "Coxas — parte externa superior (vasto lateral), boa absorção e fácil acesso.",
          "Braços — face posterior.",
          "Glúteos — quadrante superior externo, excelente para volumes maiores.",
        ],
      },
      {
        title: "Esquema de Rotação Semanal",
        icon: "calendar",
        table: [
          { label: "Segunda", value: "Abdômen Inferior — Direito" },
          { label: "Terça", value: "Abdômen Inferior — Esquerdo" },
          { label: "Quarta", value: "Coxa Externa — Direito" },
          { label: "Quinta", value: "Coxa Externa — Esquerdo" },
          { label: "Sexta", value: "Tríceps Posterior — Direito" },
          { label: "Sábado", value: "Tríceps Posterior — Esquerdo" },
          { label: "Domingo", value: "Glúteo Superior — Direito" },
        ],
      },
    ],
    steps: [
      {
        title: "Higiene e Assepsia",
        content: [
          "Sempre use swabs de álcool 70% em movimentos circulares de dentro para fora no local de aplicação.",
          "Lave as mãos com água e sabão antes de manipular materiais.",
          "Nunca reutilize agulhas ou seringas.",
        ],
      },
    ],
    precautions: [
      { label: "Agulhas", value: "Use 29G-32G (8mm ou 12.7mm) para injeção subcutânea." },
      { label: "Velocidade", value: "2-3 segundos por 10 unidades para minimizar dor." },
      { label: "Refluxo", value: "Conte 5 segundos antes de retirar a agulha." },
    ],
    disclaimer: "Consulte um profissional de saúde para orientação sobre técnica de aplicação adequada.",
  },

  "spray-nasal-selank-semax": {
    intro: "Este guia utiliza uma técnica de diluição mista para reduzir a irritação nasal causada pelo álcool benzílico, mantendo a eficácia do peptídeo.",
    sections: [
      {
        title: "Itens Necessários",
        icon: "clipboard",
        items: [
          "Peptídeo: 1 frasco (vial) de Semax / Selank 10mg",
          "Diluente 1: 2ml de Água Bacteriostática (conservante)",
          "Diluente 2: 10ml de Soro Fisiológico (para diluição de conforto)",
          "Frasco Spray: Vidro âmbar",
          "Seringa de Insulina: Para medição precisa dos diluentes",
          "Álcool 70%: Para higienização de superfícies e frascos",
        ],
      },
      {
        title: "Tabela de Dosagem",
        icon: "table",
        table: [
          { label: "1 borrifada", value: "100mcg do peptídeo" },
          { label: "2 borrifadas", value: "200mcg (dose padrão sugerida)" },
          { label: "3 borrifadas", value: "300mcg" },
        ],
      },
    ],
    steps: [
      {
        title: "Higienização",
        content: [
          "Utilize algodão ou gaze com álcool 70%.",
          "Lave bem as mãos antes de iniciar o preparo.",
        ],
      },
      {
        title: "Reconstituição Inicial",
        content: [
          "Aspire 2ml de Água Bacteriostática com a seringa.",
          "Injete o líquido no frasco de Semax lentamente, deixando a água escorrer pela parede interna do vidro.",
        ],
        warning: "Nunca jogue o jato direto sobre o pó liofilizado para não degradar o peptídeo.",
      },
      {
        title: "Transferência e Complementação",
        content: [
          "Abra o frasco de soro fisiológico e adicione 10ml diretamente no frasco de spray para completar a mistura.",
          "Feche o frasco de spray e inverta-o suavemente duas ou três vezes para homogeneizar.",
        ],
        tip: "Com esta diluição (10mg em 12ml totais) e um spray de 12,5 µl, cada borrifada entrega ~100mcg do peptídeo.",
      },
      {
        title: "Armazenamento e Validade",
        content: [
          "Temperatura: Semax e Selank são termolábeis. Manter obrigatoriamente na geladeira (2°C a 8°C).",
          "Nunca deixe no congelador ou na porta da geladeira.",
          "Proteção: vidro âmbar protege contra a luz, mas mantenha o frasco dentro de uma caixa ou local escuro na geladeira.",
        ],
        warning: "A mistura com soro fisiológico reduz a validade para 10-20 dias na geladeira. Rotule com a data de preparo!",
      },
      {
        title: "Dicas de Uso e Higiene",
        content: [
          "Aplique uma borrifada em cada narina, inspirando levemente.",
          "Evite inspirar com muita força para que o líquido não desça para a garganta.",
          "Após cada aplicação, limpe o bico ejetor com álcool 70% antes de colocar a tampa protetora.",
          "Isso evita que bactérias da mucosa contaminem o restante da solução.",
        ],
      },
    ],
    disclaimer: "Este conteúdo é educacional. Consulte um médico antes de utilizar peptídeos nasais.",
  },

  "spray-nasal-aplicacao": {
    intro: "Como preparar e aplicar peptídeos nasais para máxima absorção cerebral: técnica, diluente, dosagem e cuidados.",
    steps: [
      {
        title: "Peptídeos Nasais Disponíveis",
        content: [
          "Selank — ansiolítico e imunomodulador (via GABA).",
          "Semax — nootrópico e neurotrófico (via BDNF).",
          "Oxitocina — modulação social e emocional.",
          "BPC-157 Nasal — neuroproteção via barreira hematoencefálica.",
        ],
      },
      {
        title: "Escolha do Diluente",
        content: [
          "Solução Salina 0.9% — padrão para peptídeos nasais.",
          "Evitar água bacteriostática (álcool benzílico irrita a mucosa).",
          "Evitar água estéril pura (causa ardência osmótica).",
        ],
        tip: "A solução salina isotônica é o diluente ideal — confortável, seguro e mantém a estabilidade do peptídeo.",
      },
      {
        title: "Preparação do Spray",
        content: [
          "Reconstituir o peptídeo com volume adequado de salina.",
          "Transferir para frasco spray nasal calibrado.",
          "Cada bomba deve liberar ~100mcg (calibrar conforme concentração).",
        ],
      },
      {
        title: "Técnica Correta",
        content: [
          "Limpar as narinas antes da aplicação.",
          "Cabeça levemente inclinada para frente.",
          "Ponta do spray direcionada para a parede lateral.",
          "Inspiração suave durante a aplicação.",
          "Evitar assoar o nariz por 10 minutos após a dose.",
        ],
      },
      {
        title: "Dosagens por Peptídeo",
        content: [
          "Selank: 200mcg 1-2x/dia (manhã ou manhã + tarde).",
          "Semax: 200-600mcg 1-2x/dia (manhã).",
          "Oxitocina: 24 UI 1x/dia (manhã).",
        ],
      },
    ],
    disclaimer: "Consulte um profissional de saúde antes de utilizar peptídeos por via nasal.",
  },

  "ghk-cu-pele-cabelo": {
    intro: "O GHK-Cu (cobre peptídeo) pode ser utilizado topicamente em formulações com ácido hialurônico para renovação cutânea e crescimento capilar.",
    sections: [
      {
        title: "Ingredientes Base",
        icon: "clipboard",
        items: [
          "1 ampola de 1 grama de GHK-Cu",
          "30 mL de ácido hialurônico (Produtos recomendados: The Ordinary Buffet Serum ou Neutrogena Hydroboost Hyaluronic Acid)",
        ],
      },
      {
        title: "Proporções de Mistura",
        icon: "table",
        table: [
          { label: "Rosto", value: "1 grama de GHK-Cu por 30 mL (1 oz) de sérum" },
          { label: "Corpo", value: "2 gramas de GHK-Cu por 30 mL (1 oz) de manteiga corporal" },
          { label: "Crescimento Capilar", value: "3 gramas de GHK-Cu por 30 mL (1 oz) de ácido hialurônico" },
        ],
      },
      {
        title: "Incompatibilidades Importantes",
        icon: "alert",
        items: [
          "Tretinoína / Retinol",
          "Vitamina C (ácido ascórbico)",
          "AHAs (ácido glicólico, lático, mandélico)",
          "BHAs (ácido salicílico)",
        ],
      },
      {
        title: "Pasta Intensiva — Parâmetros (Dano Solar Severo)",
        icon: "table",
        table: [
          { label: "Frequência", value: "Apenas ocasionalmente (não uso diário)" },
          { label: "Reação esperada", value: "Vermelhidão, irritação, coceira; pode formar crostas em dano solar severo" },
          { label: "Tempo de renovação", value: "A pele se renova em alguns dias" },
          { label: "Pós-tratamento", value: "Retomar o protocolo regular com GHK-Cu manhã e noite" },
        ],
      },
    ],
    steps: [
      {
        title: "Sérum Renovador de Pele",
        content: [
          "Aplicar na pele duas vezes ao dia (manhã e noite).",
          "Para crescimento capilar, aplicar com dispositivo de microagulhamento (dermaroller/dermapen).",
        ],
      },
      {
        title: "Rotina Recomendada",
        content: [
          "Manhã: Produtos ácidos + protetor solar.",
          "Noite: Sérum de GHK-Cu antes de dormir.",
        ],
        warning: "Qualquer ácido irá degradar o GHK-Cu e torná-lo ineficaz. Separe os horários de aplicação!",
      },
      {
        title: "Uso Corporal",
        content: [
          "O GHK-Cu também pode ser usado na pele do corpo com manteiga corporal.",
          "Certifique-se de que a manteiga não contenha ingredientes ácidos.",
        ],
      },
      {
        title: "Protocolo Especial: Dano Solar Severo",
        content: [
          "Para pele severamente danificada pelo sol (manchas solares), uma pasta intensiva pode ser preparada.",
          "Use ácido hialurônico em concentração de até 7% e aplique sobre a pele danificada.",
        ],
        warning: "Este protocolo é baseado em relatos de pesquisa e não constitui orientação médica. Consulte um profissional de saúde antes de qualquer aplicação.",
      },
    ],
    disclaimer: "Este conteúdo é exclusivamente educacional. Consulte um dermatologista antes de iniciar protocolos tópicos de GHK-Cu.",
  },

  "hgh-dose-guia": {
    intro: "Guia completo sobre dosagem de HGH — cada faixa de dose (1-2, 2-4, 4-8, 6-10+ UI) serve a um propósito diferente.",
    steps: [
      {
        title: "1-2 UI/dia — Anti-Aging & Bem-Estar",
        content: [
          "Melhora da qualidade do sono e energia.",
          "Pele mais hidratada e elástica.",
          "Recuperação muscular moderada.",
          "Dose segura para uso prolongado (6-12 meses).",
          "Mínimos efeitos colaterais.",
        ],
        tip: "Dose ideal para iniciantes. Aplique antes de dormir para imitar o pico fisiológico.",
      },
      {
        title: "2-4 UI/dia — Composição Corporal",
        content: [
          "Redução de gordura corporal (especialmente visceral).",
          "Aumento modesto de massa magra.",
          "Melhora na recuperação pós-treino.",
          "Necessário monitorar IGF-1 a cada 3 meses.",
          "Pode dividir dose: manhã + noite.",
        ],
      },
      {
        title: "4-8 UI/dia — Performance & Hipertrofia",
        content: [
          "Ganho significativo de massa muscular.",
          "Aceleração dramática da recuperação.",
          "Retenção hídrica moderada a significativa.",
          "Risco de resistência à insulina — monitorar HbA1c.",
          "Requer acompanhamento médico regular.",
        ],
        warning: "Doses acima de 4 UI/dia aumentam significativamente o risco de efeitos colaterais. Monitoramento bioquímico obrigatório.",
      },
      {
        title: "6-10+ UI/dia — Terapêutico/Avançado",
        content: [
          "Usado em contextos clínicos específicos.",
          "Alto risco de efeitos colaterais (síndrome do túnel do carpo, edema).",
          "Requer monitoramento rigoroso de IGF-1, glicose e insulina.",
          "Pode necessitar de metformina ou berberina como suporte.",
          "Apenas sob supervisão médica direta.",
        ],
      },
      {
        title: "Timing & Administração",
        content: [
          "Dose única: antes de dormir (pico fisiológico).",
          "Dose dividida: manhã em jejum + antes de dormir.",
          "Evitar carboidratos 2h antes e 1h após a injeção.",
          "Aplicação subcutânea no abdômen ou coxas.",
          "Rotacionar locais de aplicação.",
        ],
      },
      {
        title: "Exames de Monitoramento",
        content: [
          "IGF-1 — a cada 8-12 semanas.",
          "Glicose em jejum + HbA1c — a cada 12 semanas.",
          "Insulina em jejum (HOMA-IR).",
          "TSH e T4 Livre (GH pode afetar tireoide).",
          "Hemograma completo.",
        ],
      },
    ],
    disclaimer: "O uso de HGH exógeno requer prescrição médica. Este guia é educacional e não substitui orientação profissional.",
  },

  "stacking-top-10": {
    intro: "As melhores combinações de peptídeos por objetivo: recuperação, emagrecimento, cognição, longevidade, imunidade e mais.",
    steps: [
      {
        title: "1. The Wolverine — Recuperação de Lesão",
        content: [
          "BPC-157 (250mcg 2x/dia) + TB-500 (2.5mg 2x/semana).",
          "Taxa de sucesso de 85% em lesões de tecidos moles.",
          "Ação sinérgica local (BPC) + sistêmica (TB-500).",
          "Duração: 6-12 semanas.",
        ],
      },
      {
        title: "2. Metabolic Reset — Emagrecimento",
        content: [
          "Tirzepatida (2.5→15mg/semana) + MOTS-c (5mg 2x/semana).",
          "Perda de peso de 15-25% em 6 meses.",
          "Preservação de massa magra com MOTS-c.",
          "Duração: 12-24 semanas.",
        ],
      },
      {
        title: "3. Neuro Boost — Cognição",
        content: [
          "Selank (200mcg/dia nasal) + Semax (200mcg/dia nasal).",
          "Aumento de BDNF em até 200%.",
          "Estado de foco calmo sem estimulantes.",
          "Duração: 4-8 semanas.",
        ],
      },
      {
        title: "4. Fountain of Youth — Anti-Aging",
        content: [
          "GHK-Cu (2mg/dia SubQ) + Epithalon (5mg ciclos de 10-20 dias).",
          "Ativação da telomerase.",
          "Melhora na textura da pele.",
          "Ciclos anuais.",
        ],
      },
      {
        title: "5. GH Optimizer — Performance",
        content: [
          "CJC-1295 no DAC (100mcg) + Ipamorelin (200mcg) antes de dormir.",
          "Aumento de IGF-1 em 30-50%.",
          "Melhora no sono profundo.",
          "Regime 5on/2off por 3-6 meses.",
        ],
      },
      {
        title: "6. Iron Shield — Imunidade",
        content: [
          "Thymosin Alpha-1 (1.5mg 2x/semana SubQ).",
          "Aprovado clinicamente em 35+ países.",
          "Modula sem superestimular o sistema imune.",
          "Duração: 4-6 semanas.",
        ],
      },
      {
        title: "7. Gut Restore — Saúde Intestinal",
        content: [
          "BPC-157 Oral (500mcg 2x/dia) + KPV (500mcg/dia).",
          "Reparo direto da mucosa GI.",
          "Redução de inflamação intestinal.",
          "Duração: 8-12 semanas.",
        ],
      },
      {
        title: "8. Anabolic Edge — Massa Muscular",
        content: [
          "IGF-1 LR3 (50mcg pré-treino) + PEG-MGF (200mcg pós-treino).",
          "Hiperplasia + hipertrofia muscular.",
          "Ciclos curtos obrigatórios (4-6 semanas).",
        ],
        warning: "Risco de hipoglicemia — nunca combinar com insulina. Monitorar glicemia e IGF-1.",
      },
      {
        title: "9. Bioregulator Protocol — Longevidade Celular",
        content: [
          "Pinealon (10mg) + Vilon (10mg) — ciclos de 10-20 dias.",
          "Regulação epigenética.",
          "Pesquisa de 40+ anos na Rússia.",
          "Ciclos anuais.",
        ],
      },
      {
        title: "10. Sleep & Recovery — Sono Profundo",
        content: [
          "DSIP (100mcg antes de dormir) + CJC-1295/Ipamorelin.",
          "Aumento do sono de ondas lentas.",
          "Potencialização da liberação noturna de GH.",
          "Duração: 4-8 semanas.",
        ],
      },
    ],
    disclaimer: "Combinações de peptídeos devem ser supervisionadas por profissional de saúde qualificado.",
  },

  "seguranca-efeitos-monitoramento": {
    intro: "Efeitos colaterais por peptídeo, exames de sangue essenciais, contraindicações absolutas e como monitorar seu ciclo com segurança.",
    sections: [
      {
        title: "Efeitos Colaterais Comuns por Peptídeo",
        icon: "alert",
        items: [
          "BPC-157: Fadiga, Náusea leve | Raros: Anedonia, Alergia local",
          "TB-500: Letargia, Cefaleia | Raros: Nódulos de injeção",
          "CJC-1295/Ipamorelin: Flushing, Fome aumentada | Raros: Parestesia",
          "Tirzepatida: Náusea, Constipação | Raros: Pancreatite, Refluxo biliar",
          "MK-677: Fome extrema, Retenção hídrica | Raros: Resistência à insulina",
          "Melanotan II: Náusea, Ereções espontâneas | Raros: Escurecimento de pintas",
          "Semaglutida: Náusea, Diarreia | Raros: Pancreatite, Gastroparesia",
          "GHK-Cu: Irritação local | Raros: Hiperpigmentação local",
        ],
      },
      {
        title: "Exames de Monitoramento",
        icon: "clipboard",
        items: [
          "Hemograma completo — a cada 8 semanas (todos os peptídeos)",
          "Glicose + HbA1c — a cada 12 semanas (MK-677, Tirzepatida, Semaglutida)",
          "IGF-1 — a cada 8-12 semanas (GH Secretagogos)",
          "Função hepática (TGO/TGP) — a cada 12 semanas (injetáveis)",
          "Função renal (Creatinina/Ureia) — a cada 12 semanas (todos)",
          "TSH / T4 Livre — a cada 16 semanas (MK-677, Tesamorelin)",
          "Lipidograma — a cada 12 semanas (Tirzepatida, Semaglutida)",
          "Insulina em jejum — a cada 12 semanas (MK-677)",
        ],
      },
      {
        title: "Contraindicações Absolutas",
        icon: "shield",
        items: [
          "Câncer ativo — todos os secretagogos de GH",
          "Gravidez / Amamentação — todos os peptídeos",
          "Pancreatite ativa ou histórica — Tirzepatida, Semaglutida",
          "Diabetes tipo 1 descompensado — MK-677",
          "Insuficiência renal severa — todos os injetáveis (contraindicação relativa)",
          "Melanoma ou histórico familiar — Melanotan II",
          "Menores de 18 anos — todos os peptídeos",
        ],
      },
    ],
    disclaimer: "Este conteúdo é educacional. Sempre consulte um médico antes de iniciar ou modificar protocolos de peptídeos.",
  },

  "o-que-sao-peptideos": {
    intro: "Entenda o que são peptídeos, como funcionam no corpo, a história desde a insulina até os neuropeptídeos modernos e por que são diferentes de esteroides e suplementos convencionais.",
    steps: [
      {
        title: "O que são Peptídeos?",
        content: [
          "Peptídeos são cadeias curtas de aminoácidos (2-50 aminoácidos).",
          "Diferentes de proteínas, que possuem mais de 50 aminoácidos.",
          "Funcionam como mensageiros biológicos, sinalizando células específicas.",
          "O corpo produz milhares de peptídeos naturalmente.",
        ],
      },
      {
        title: "Como Funcionam?",
        content: [
          "Ligam-se a receptores específicos nas células-alvo.",
          "Ativam cascatas de sinalização intracelular.",
          "Efeitos altamente específicos com menos efeitos colaterais que fármacos tradicionais.",
          "Meia-vida curta — ação precisa e controlável.",
        ],
      },
      {
        title: "História dos Peptídeos",
        content: [
          "1921: Descoberta da Insulina (primeiro peptídeo terapêutico).",
          "1950s: Síntese de Oxitocina em laboratório.",
          "1970s: Descoberta de GHRH e peptídeos de liberação de GH.",
          "1990s: BPC-157, TB-500 entram em pesquisa pré-clínica.",
          "2020s: Tirzepatida, Semaglutida aprovados para uso clínico.",
        ],
      },
      {
        title: "Peptídeos vs. Esteroides vs. Suplementos",
        content: [
          "Peptídeos: sinalizam processos naturais, alta especificidade, meia-vida curta.",
          "Esteroides: substituem hormônios, efeitos sistêmicos amplos, suprimem eixo hormonal.",
          "Suplementos: biodisponibilidade variável, efeitos geralmente mais sutis.",
          "Peptídeos não suprimem a produção hormonal natural (na maioria dos casos).",
        ],
      },
      {
        title: "Categorias Principais",
        content: [
          "Recuperação: BPC-157, TB-500, GHK-Cu.",
          "Emagrecimento: Tirzepatida, Semaglutida, AOD-9604.",
          "Cognição: Selank, Semax, Dihexa.",
          "Anti-Aging: Epithalon, GHK-Cu, FOXO4-DRI.",
          "Performance: CJC-1295, Ipamorelin, IGF-1 LR3.",
          "Imunidade: Thymosin Alpha-1, LL-37.",
        ],
      },
    ],
    disclaimer: "Este conteúdo é educacional. Consulte um profissional de saúde antes de utilizar peptídeos.",
  },

  "7-erros-fatais": {
    intro: "Os erros mais comuns que podem desperdiçar seu dinheiro ou causar problemas de saúde. Aprenda como comprar, misturar, armazenar e injetar peptídeos corretamente.",
    steps: [
      {
        title: "Não Comprar de Fontes de Qualidade",
        content: [
          "Nem todos os peptídeos são criados iguais. Se você está comprando de uma fonte não confiável, está basicamente jogando na roleta.",
          "A fonte deve sempre fornecer testes de terceiros para verificar pureza e potência.",
          "O frasco deve conter um 'bolo' liofilizado sólido, não pó flutuando.",
          "Deve haver vácuo interno — a água deve ser sugada sem esforço ao reconstituir.",
          "Injeções subcutâneas devem ser indolores; se queimar e inchar, algo está errado.",
        ],
        warning: "Peptídeos adulterados podem conter impurezas, endotoxinas ou dosagens completamente diferentes do rótulo.",
      },
      {
        title: "Não Comprar Tudo que É Necessário",
        content: [
          "Peptídeos não são plug-and-play. Você precisa das ferramentas certas:",
          "Água bacteriostática para mistura segura (contém álcool benzílico para prevenir crescimento bacteriano).",
          "Seringas de insulina para dosagem precisa e higiênica.",
          "Álcool swabs para esterilização.",
          "Recipiente para descarte seguro de seringas.",
        ],
      },
      {
        title: "Não Entender Como Misturar e Armazenar",
        content: [
          "A dosagem de peptídeos varia — frascos de 1mg, 5mg, 10mg — então você precisa entender como reconstituí-los corretamente.",
          "Após misturado: refrigere (estável por 4-6 semanas).",
          "Antes de misturar: congele o pó seco para armazenamento de longo prazo.",
          "NUNCA congele uma vez que estejam misturados.",
        ],
        tip: "Exemplo: se adicionar 1 mL de água bacteriostática a um frasco de 1 mg, então 0.25 mL = 250 mcg.",
      },
      {
        title: "Não Entender Técnicas de Injeção",
        content: [
          "A maioria dos peptídeos é subcutânea — você injeta na camada de gordura, geralmente ao redor do abdômen, usando um ângulo de 45° com seringa de insulina.",
          "Para cicatrização de lesão específica (como BPC-157 ou TB-500), pode ser necessário injeções localizadas o mais próximo possível do local da lesão.",
        ],
      },
      {
        title: "Não Entender os Possíveis Efeitos Colaterais",
        content: [
          "Peptídeos podem causar efeitos colaterais. Todos respondem de forma diferente — monitore seu biofeedback.",
          "Desequilíbrio hormonal.",
          "Alterações de humor.",
          "Retenção de água.",
          "Resistência à insulina.",
          "Estresse pituitário a longo prazo (com secretagogos de GH).",
        ],
      },
      {
        title: "Pensar que São Drogas Milagrosas",
        content: [
          "Peptídeos são amplificadores, não substitutos.",
          "Você ainda precisa de dieta, sono, treino e gestão de estresse adequados.",
          "Sem uma base sólida, os resultados serão mínimos independente do peptídeo usado.",
        ],
      },
      {
        title: "Subestimar a Responsabilidade",
        content: [
          "Você é a variável. Você é seu próprio experimento.",
          "É seu trabalho rastrear seus dados, ouvir seu biofeedback e entender o composto antes de usá-lo.",
          "Faça exames de sangue regulares, acompanhe suas métricas e mantenha um diário de uso.",
        ],
      },
    ],
    disclaimer: "Este conteúdo é educacional. Erros com peptídeos podem ter consequências graves. Sempre consulte um profissional de saúde.",
  },

  "equilibrio-redox-101": {
    intro: "Entenda o equilíbrio redox, como a glicose vira ATP, e por que isso é fundamental antes de usar peptídeos mitocondriais como MOTS-c, SS-31 e NAD+.",
    steps: [
      {
        title: "O que é Equilíbrio Redox?",
        content: [
          "Redox = Redução + Oxidação — transferência de elétrons entre moléculas.",
          "Oxidação: perda de elétrons (produz radicais livres).",
          "Redução: ganho de elétrons (neutraliza radicais livres).",
          "Equilíbrio redox = balanço entre produção e neutralização de radicais.",
        ],
      },
      {
        title: "Da Glicose ao ATP",
        content: [
          "Glicólise: Glicose → 2 Piruvato (citoplasma, 2 ATP).",
          "Ciclo de Krebs: Piruvato → CO2 + NADH + FADH2 (mitocôndria).",
          "Cadeia de Transporte de Elétrons: NADH/FADH2 → 34 ATP.",
          "Total: ~36 ATP por molécula de glicose.",
          "A mitocôndria é a 'usina' — 95% do ATP é produzido lá.",
        ],
      },
      {
        title: "Por que a Mitocôndria Envelhece",
        content: [
          "Com a idade, a eficiência da cadeia de elétrons diminui.",
          "Mais elétrons 'vazam' e formam radicais livres (ROS).",
          "DNA mitocondrial é 10x mais vulnerável que DNA nuclear.",
          "Resultado: menos energia, mais inflamação, envelhecimento celular.",
        ],
      },
      {
        title: "Peptídeos Mitocondriais",
        content: [
          "MOTS-c: Ativa AMPK, melhora metabolismo de glicose.",
          "SS-31 (Elamipretide): Protege a cardiolipina na membrana mitocondrial interna.",
          "NAD+ (precursores): Restaura os níveis de NAD+ necessários para a cadeia de elétrons.",
          "Humanin: Peptídeo mitocondrial que protege contra estresse oxidativo.",
        ],
      },
      {
        title: "Base Antes dos Peptídeos",
        content: [
          "Otimizar dieta: antioxidantes naturais (vitamina C, E, CoQ10).",
          "Exercício regular: estimula biogênese mitocondrial.",
          "Sono adequado: período de reparo mitocondrial.",
          "Reduzir estressores: tabaco, álcool, ultra-processados.",
          "Só então adicionar peptídeos mitocondriais para potencializar.",
        ],
        tip: "Peptídeos mitocondriais funcionam melhor quando a base (dieta, exercício, sono) está otimizada. Não são substitutos de um estilo de vida saudável.",
      },
    ],
    disclaimer: "Este conteúdo é educacional. Consulte um profissional de saúde antes de utilizar peptídeos mitocondriais.",
  },
};
