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
          "Use um recipiente de descarte de agulhas (sharps container). Nunca jogue agulhas no lixo comum.",
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
    intro: "O hormônio do crescimento (HGH) ocupa uma categoria única. Não é um anabolizante típico, nem um estimulante. Mas é facilmente uma das ferramentas mais transformadoras tanto no espaço de performance quanto de longevidade — se você entender como realmente usá-lo. O que torna o HGH tão singular é que cada faixa de dose serve a um propósito diferente. Com HGH, 1 UI e 8 UI são ferramentas completamente diferentes.",
    sections: [
      {
        title: "Tabela Resumo — Objetivo vs Dose",
        icon: "table",
        table: [
          { label: "Reparo e otimização de longo prazo", value: "1-2 UI/dia" },
          { label: "Physique e recuperação de alta performance", value: "2-4 UI/dia" },
          { label: "Remodelação agressiva e prep de competição", value: "4-8 UI/dia" },
          { label: "Resultados de nível elite com protocolos empilhados", value: "6-10+ UI/dia" },
        ],
      },
    ],
    steps: [
      {
        title: "1-2 UI Diárias: Sutil, Fundacional e Focado no Longo Prazo",
        content: [
          "Melhora nos ciclos de sono, especialmente REM e sono profundo.",
          "Melhora no tônus, elasticidade e hidratação da pele.",
          "Recuperação mais rápida de estresse articular e fadiga tendínea.",
          "Perda de gordura leve mas constante, particularmente na região abdominal.",
          "Sistema nervoso mais calmo — menos overtraining.",
          "Leve plenitude nos ventres musculares.",
          "Suporte para mucosa intestinal e redução de inflamação.",
        ],
        tip: "Ideal para: maiores de 35 anos, treinando pesado, buscando recuperação de longo prazo, anti-aging, ou manter-se magro e vital o ano todo. Mínimo 12-16 semanas de uso consistente.",
      },
      {
        title: "2-4 UI Diárias: Ganhos Magros, Recuperação e Impacto Estético",
        content: [
          "Oxidação de gordura aprimorada, especialmente durante cardio em jejum.",
          "Aumento do armazenamento de glicogênio pós-treino — músculos mais cheios.",
          "Partição de nutrientes melhora: carboidratos direcionados ao músculo, não à gordura.",
          "Articulações e tendões se recuperam mais rápido.",
          "Physique visivelmente mais denso ao longo do tempo.",
          "Melhor resposta ao volume de treinamento.",
          "IGF-1 na faixa de 200-300 ng/dL para muitos usuários.",
          "Mais fácil manter-se magro comendo na manutenção ou ligeiramente acima.",
        ],
        tip: "Efeitos colaterais tipicamente leves: rigidez nas mãos/pulsos, inchaço matinal moderado ou elevação leve da glicemia. Ideal para manutenção de physique, acúmulo de massa magra e recomposição corporal.",
      },
      {
        title: "4-8 UI Diárias: Remodelação Completa e Prep de Competição",
        content: [
          "Remodelação corporal agressiva.",
          "Retenção hídrica moderada a significativa.",
          "Risco de resistência à insulina.",
          "Requer acompanhamento médico regular.",
        ],
        warning: "Monitoramento obrigatório: glicemia de jejum, IGF-1, enzimas hepáticas e função tireoidiana. Muitos usuários introduzem berberina, metformina ou GLP-1s nesta fase.",
      },
      {
        title: "6-10+ UI Diárias: Nível Elite e Uso Extremo",
        content: [
          "Aumentos massivos na capacidade de recuperação.",
          "Perda de gordura acelerada quando combinada com medicamentos tireoidianos.",
          "Plenitude muscular incomparável — visual denso, redondo e duro.",
          "Mudanças visíveis semana a semana.",
          "Impulso significativo na síntese de colágeno e reparo tecidual.",
          "Maior chance de retenção hídrica, fadiga e instabilidade glicêmica.",
          "IGF-1 em níveis suprafisiológicos (500-700+ ng/dL).",
          "Possível disrupção do sono se o timing não for calibrado.",
        ],
        warning: "Tudo precisa ser monitorado. Esta faixa é melhor reservada para quando o objetivo é transformação, não sustentabilidade. Muitos rotacionam 4-8 semanas aqui antes de recuar para 2-4 UI.",
      },
    ],
    precautions: [
      { label: "Monitoramento", value: "Para doses acima de 4 UI, monitore obrigatoriamente: Glicemia de Jejum, IGF-1 e Função Tireoidiana (T3/T4/TSH)." },
    ],
    disclaimer: "A dose determina a direção. Não existe \"um protocolo certo\". Mais nem sempre é melhor. Mais inteligente sempre é. Fonte: Adaptado de Elevate Biohacking. O uso de HGH exógeno requer prescrição médica.",
  },

  "stacking-top-10": {
    intro: "Stacking é a arte de combinar peptídeos para obter sinergia — onde o resultado final é maior que a soma das partes. A chave é entender quais peptídeos se complementam e quais devem ser evitados juntos.",
    sections: [
      {
        title: "Top 10 Stacks Comprovados",
        icon: "table",
        table: [
          { label: "Recuperação de Lesão", value: "BPC-157 + TB-500 — BPC: 250mcg 2x/dia; TB: 2.5mg 2x/sem — 6-12 sem" },
          { label: "Emagrecimento", value: "Tirzepatida + MOTS-c — Tirz: 2.5-15mg/sem; MOTS: 5mg 2x/sem — 12-24 sem" },
          { label: "Cognição/Nootrópico", value: "Selank + Semax — 200mcg/dia cada — 4-8 sem" },
          { label: "Anti-Aging / Pele", value: "GHK-Cu + Epitalon — GHK: 2mg/dia; Epitalon: 5mg/dia — Ciclos anuais" },
          { label: "Performance / GH", value: "CJC-1295 + Ipamorelin — 100mcg/200mcg antes dormir (5on/2off) — 3-6 meses" },
          { label: "Imunidade", value: "Thymosin Alpha-1 — 1.5mg 2x/semana — 4-6 sem" },
          { label: "Estética / Bronzeado", value: "Melanotan II — 250-500mcg EOD — Até cor desejada" },
          { label: "Longevidade (Biorreg)", value: "Pinealon + Vilon — Protocolos 10-20 dias/ano — Ciclos anuais" },
          { label: "Saúde Intestinal", value: "BPC-157 (Oral) + KPV — BPC: 500mcg 2x/dia; KPV: 500mcg/dia — 8-12 sem" },
          { label: "Massa Muscular", value: "IGF-1 LR3 + PEG-MGF — IGF: 50mcg pré-treino; MGF: 200mcg pós — 4-6 sem" },
        ],
      },
      {
        title: "Interações Perigosas — Combinações a Evitar",
        icon: "alert",
        table: [
          { label: "CJC-1295 + GHRP-6", value: "Hipoglicemia/Fome — Aumento massivo de grelina e cortisol" },
          { label: "Tirzepatida + Semaglutida", value: "Desidratação/Vômito — Sobrecarga de receptores GLP-1/GIP" },
          { label: "IGF-1 + Insulina", value: "Hipoglicemia Severa — Ambos reduzem glicose drasticamente" },
        ],
      },
    ],
    steps: [
      {
        title: "Framework para Montar seu Stack",
        content: [
          "1. Identifique a Dor Principal: ex: lesão no ombro.",
          "2. Escolha o Peptídeo Âncora: ex: BPC-157.",
          "3. Adicione o Sinergista: ex: TB-500 para mobilidade.",
          "4. Defina o Suporte Sistêmico: ex: CJC/Ipa para reparo noturno.",
          "5. Monitore Marcadores: ex: IGF-1, Proteína C-Reativa.",
        ],
      },
      {
        title: "Timing e Frequência",
        content: [
          "Jejum (Manhã): Ideal para GHRHs (CJC-1295) e GHRPs (Ipamorelin) para maximizar o pulso natural de GH.",
          "Antes de Dormir: Ideal para MK-677 e stacks de GH para aproveitar o ciclo circadiano.",
          "Protocolo 5on/2off: Estratégia comum para evitar a dessensibilização de receptores de GH. Aplique de segunda a sexta e descanse no fim de semana.",
        ],
      },
    ],
    precautions: [
      { label: "⚠️ ATENÇÃO", value: "Nunca combine dois agonistas GLP-1 (ex: Tirzepatida + Semaglutida). O risco de desidratação e vômito é grave." },
    ],
    disclaimer: "Combinações de peptídeos devem ser supervisionadas por profissional de saúde qualificado.",
  },

  "seguranca-efeitos-monitoramento": {
    intro: "Embora a maioria dos peptídeos tenha um perfil de segurança superior a esteroides anabolizantes, eles não são isentos de riscos. O monitoramento deve ser feito em três fases: Baseline (antes), Mid-Cycle (durante) e Post-Cycle (depois).",
    sections: [
      {
        title: "Efeitos Colaterais por Peptídeo",
        icon: "alert",
        table: [
          { label: "BPC-157", value: "Fadiga, náusea leve | Como minimizar: Dividir dose; testar dose menor" },
          { label: "TB-500", value: "Letargia, cefaleia | Como minimizar: Aplicar em temperatura ambiente" },
          { label: "CJC/Ipam", value: "Flushing, fome | Como minimizar: Injetar antes de dormir; 5on/2off" },
          { label: "Tirzepatida", value: "Náusea, constipação | Como minimizar: Titulação lenta; beber 3L+ água" },
          { label: "MK-677", value: "Fome extrema, retenção | Como minimizar: Berberina; monitorar HbA1c" },
          { label: "Melanotan", value: "Náusea, ereções espontâneas | Como minimizar: Microdosagem (100mcg); uso noturno" },
        ],
      },
      {
        title: "Marcadores Críticos para Monitoramento",
        icon: "clipboard",
        table: [
          { label: "IGF-1", value: "Eficácia do eixo GH — CJC, Ipamorelin, MK-677 — 1x a cada 3 meses" },
          { label: "Glicemia em Jejum", value: "Risco de hiperglicemia — MK-677, HGH, Tirzepatida — Mensal" },
          { label: "HbA1c", value: "Média de glicose (3 meses) — MK-677, Tirzepatida — 1x a cada 3 meses" },
          { label: "ALT/AST", value: "Função hepática — Todos (especialmente orais) — 1x a cada 6 meses" },
          { label: "Creatinina/Ureia", value: "Função renal — Todos — 1x a cada 6 meses" },
          { label: "Proteína C-Reativa", value: "Inflamação sistêmica — BPC-157, TB-500 — 1x a cada 3 meses" },
          { label: "TSH / T4 Livre", value: "Função tireoidiana — Tirzepatida, Semaglutida — 1x a cada 6 meses" },
        ],
      },
      {
        title: "Contraindicações Absolutas",
        icon: "shield",
        items: [
          "Câncer Ativo: Peptídeos que estimulam angiogênese (BPC-157, TB-500) ou divisão celular (GHRPs) podem acelerar crescimento tumoral.",
          "Retinopatia Diabética: Peptídeos de GH podem agravar a condição.",
          "Pancreatite: Contraindicação absoluta para GLP-1s (Tirzepatida/Semaglutida).",
        ],
      },
    ],
    steps: [
      {
        title: "Como Ler um Certificado de Análise (COA)",
        content: [
          "HPLC (Cromatografia Líquida): Mede a pureza. Deve ser >98% (idealmente >99%). O gráfico deve mostrar um pico único e limpo.",
          "Mass Spec (Espectrometria de Massa): Confirma a identidade. O peso molecular deve bater com o teórico do peptídeo (ex: BPC-157 = 1419.5 g/mol).",
          "Teste de Endotoxinas e Esterilidade: Nível de endotoxinas deve ser <0.5 EU/mg. Crucial para segurança injetável.",
        ],
        tip: "A pureza de 99% é o padrão, mas a verificação de endotoxinas é o que realmente define a segurança para uso injetável.",
      },
      {
        title: "Red Flags de Fornecedores",
        content: [
          "Preços muito abaixo do mercado.",
          "Falta de laudos de terceiros (Third-Party Testing).",
          "Laudos com data de mais de 1 ano.",
          "Ocultam o nome do laboratório (ex: Janoshik, MZ Biolabs).",
          "Pagamento apenas via métodos não rastreáveis.",
          "Falta de informações de armazenamento e transporte.",
        ],
        warning: "Sempre solicite e verifique os laudos ANTES de iniciar qualquer protocolo com peptídeos.",
      },
    ],
    disclaimer: "Este conteúdo é educacional. Sempre consulte um médico antes de iniciar ou modificar protocolos de peptídeos.",
  },

  "o-que-sao-peptideos": {
    intro: "No seu núcleo, peptídeos são pequenas cadeias de aminoácidos ligadas por ligações peptídicas — como contas em um colar. Para uma molécula ser classificada como peptídeo, deve conter entre 2 e 50 aminoácidos. Passe de 50 e eles são classificados como polipeptídeos. Cruze a marca de 100 e você tem uma proteína. Peptídeos são a linguagem da função celular — mensagens passadas entre sistemas, dizendo ao corpo quando construir, o que decompor, quando se recuperar, quando proteger, quando descansar.",
    sections: [
      {
        title: "Classificação dos Peptídeos",
        icon: "table",
        table: [
          { label: "Cicatrização", value: "BPC-157, TB-500, GHK-Cu, KPV — Recuperação de tecidos e anti-inflamação" },
          { label: "Sistema Imunológico", value: "Glutationa, Timosina Alfa-1, LL-37 — Modulação e fortalecimento imune" },
          { label: "Longevidade", value: "Ipamorelin, Tesamorelina, Epithalon, FOXO4-DRI — Anti-aging e secretagogos de GH" },
          { label: "Mitocondriais", value: "MOTS-c, SS-31, NAD+, L-Carnitina — Energia celular e função mitocondrial" },
          { label: "Perda de Peso", value: "Semaglutida, Tirzepatida, Retatrutida — Regulação do apetite e metabolismo" },
          { label: "Libido", value: "PT-141, Kisspeptina, Oxitocina — Função sexual e hormonal" },
          { label: "Neuropeptídeos", value: "Selank, Semax, Cerebrolysin, Dihexa — Cognição, memória e neuroproteção" },
        ],
      },
    ],
    steps: [
      {
        title: "Breve História dos Peptídeos",
        content: [
          "O primeiro peptídeo comercialmente disponível foi a Insulina, isolada de pâncreas animais na década de 1920.",
          "Em 1982, veio o grande avanço: a criação da primeira insulina humana recombinante, sinteticamente sequenciada com 51 aminoácidos.",
          "Agora temos peptídeos que melhoram a cognição, aceleram cicatrização, modulam o sistema imunológico, promovem perda de gordura, aumentam a libido, regeneram cartilagem e retreinam o comportamento mitocondrial.",
        ],
      },
      {
        title: "Peptídeos NÃO São Drogas Milagrosas",
        content: [
          "Peptídeos não são instruções externas — são sinais na linguagem nativa do corpo.",
          "Você não está convencendo o corpo a fazer algo — está dando a ele o sinal ao qual ele já foi construído para responder.",
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
    intro: "Redox significa redução e oxidação — reações químicas envolvendo a transferência de elétrons. No nível celular, esse processo controla como geramos energia e como regulamos os danos. Oxidação: perda de elétrons, libera energia mas produz espécies reativas de oxigênio (EROs). Redução: ganho de elétrons, é a forma do corpo neutralizar EROs e restaurar o equilíbrio.",
    sections: [
      {
        title: "Peptídeos Mitocondriais e o Redox",
        icon: "table",
        table: [
          { label: "MOTS-c", value: "Via AMPK — Ativa sensor de energia celular, melhora captação de glicose" },
          { label: "SS-31", value: "Via Cardiolipina — Estabiliza membrana mitocondrial, reduz vazamento de elétrons" },
          { label: "NAD+", value: "Via Sirtuínas / PARPs — Combustível para enzimas de longevidade e reparo de DNA" },
          { label: "L-Carnitina", value: "Via Beta-oxidação — Transporta ácidos graxos para as mitocôndrias" },
          { label: "Azul de Metileno", value: "Via Citocromo c oxidase — Doador/receptor de elétrons alternativo" },
          { label: "SLU-PP-332", value: "Via PPARδ / ERRγ — Mimetiza exercício a nível molecular" },
        ],
      },
    ],
    steps: [
      {
        title: "Como a Glicose se Torna ATP",
        content: [
          "Carboidratos são decompostos em glicose, que entra nas células e passa pela glicólise (10 etapas), produzindo ATP e piruvato.",
          "O piruvato entra nas mitocôndrias e é convertido em acetil-CoA, alimentando o ciclo de Krebs.",
          "O ciclo gera NADH e FADH2, que atuam como transportadores de elétrons para a cadeia de transporte de elétrons (CTE).",
          "Na CTE, esses elétrons impulsionam a produção de grandes quantidades de ATP.",
        ],
      },
      {
        title: "Sinais de Equilíbrio Redox Desregulado",
        content: [
          "Fadiga crônica que só melhora com sono.",
          "Névoa cerebral, falta de foco.",
          "Dor nas articulações ou inflamação sistêmica.",
          "Recuperação lenta do treinamento.",
          "Instabilidade de humor ou baixa resiliência ao estresse.",
          "PCR elevada, marcadores inflamatórios elevados em exames.",
        ],
        warning: "Esses são sinais de que seu corpo está criando mais estresse do que pode limpar. Quase todos os peptídeos mitocondriais influenciam vias sensíveis ao redox: AMPK, mTOR, NAD+/NADH, SIRT1/SIRT3, PGC-1α.",
      },
      {
        title: "Terapia de Luz Vermelha + Peptídeos",
        content: [
          "A luz vermelha e infravermelha próxima (630-850nm) penetra no tecido e visa as mitocôndrias diretamente, melhorando fluxo sanguíneo, oxigenação e produção de ATP.",
          "Vermelho (630-660nm) para cicatrização superficial.",
          "Infravermelho próximo (810-850nm) para penetração mais profunda.",
          "Exposição: 5 a 20 minutos por sessão.",
          "Frequência: 3-7x por semana durante fases ativas; 1-3x semanalmente para manutenção.",
          "Distância: 15-30 cm para a maioria dos dispositivos de painel.",
        ],
        tip: "Aplique após injeção de BPC-157 ou TB-500 para melhorar absorção e circulação local. Para longevidade: combine com MOTS-c, SS-31 e NAD+.",
      },
    ],
    disclaimer: "Peptídeos mitocondriais podem ser uma faca de dois gumes — embora possam levar as mitocôndrias a níveis suprafisiológicos, isso gera maiores quantidades de subprodutos EROs. Uma base sólida de redox é fundamental.",
  },
};
