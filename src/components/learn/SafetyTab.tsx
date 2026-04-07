import { useState } from "react";
import { AlertTriangle, FileText, ShieldAlert, ChevronDown, ChevronUp, Check, Ban, AlertOctagon, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const subTabs = [
  { key: "efeitos", label: "Efeitos", icon: AlertTriangle },
  { key: "exames", label: "Exames", icon: FileText },
  { key: "riscos", label: "Riscos", icon: ShieldAlert },
] as const;

interface SideEffect {
  name: string;
  commonCount: number;
  rareCount: number;
  common: string[];
  rare: string[];
  mitigation: string[];
}

const sideEffectsData: SideEffect[] = [
  {
    name: "BPC-157",
    commonCount: 2, rareCount: 2,
    common: ["Fadiga", "Náusea leve"],
    rare: ["Anedonia (raro)", "Alergia local"],
    mitigation: ["Dividir a dose", "Testar dose menor inicialmente"],
  },
  {
    name: "TB-500",
    commonCount: 2, rareCount: 1,
    common: ["Letargia", "Cefaleia"],
    rare: ["Nódulos de injeção"],
    mitigation: ["Aplicar em temperatura ambiente", "Rotacionar locais de aplicação"],
  },
  {
    name: "CJC-1295 / Ipamorelin",
    commonCount: 2, rareCount: 1,
    common: ["Flushing (calor)", "Fome aumentada"],
    rare: ["Parestesia (formigamento)"],
    mitigation: ["Injetar antes de dormir", "Regime 5on/2off"],
  },
  {
    name: "Tirzepatida",
    commonCount: 2, rareCount: 2,
    common: ["Náusea", "Constipação"],
    rare: ["Pancreatite", "Refluxo biliar"],
    mitigation: ["Titulação lenta (16 semanas)", "Beber 3L+ água/dia"],
  },
  {
    name: "MK-677",
    commonCount: 2, rareCount: 1,
    common: ["Fome extrema", "Retenção hídrica"],
    rare: ["Resistência à insulina"],
    mitigation: ["Usar Berberina como suporte", "Monitorar HbA1c regularmente"],
  },
  {
    name: "Melanotan II",
    commonCount: 2, rareCount: 1,
    common: ["Náusea", "Ereções espontâneas"],
    rare: ["Escurecimento de pintas"],
    mitigation: ["Microdosagem (100mcg)", "Uso noturno"],
  },
  {
    name: "Semaglutida",
    commonCount: 2, rareCount: 2,
    common: ["Náusea", "Diarreia"],
    rare: ["Pancreatite", "Gastroparesia"],
    mitigation: ["Titulação gradual", "Refeições pequenas e frequentes"],
  },
  {
    name: "GHK-Cu",
    commonCount: 1, rareCount: 1,
    common: ["Leve irritação local"],
    rare: ["Hiperpigmentação local"],
    mitigation: ["Rotacionar locais", "Dose padrão (2mg/dia)"],
  },
];

const examsData = [
  { name: "IGF-1", why: "Mede a eficácia do eixo GH", peptides: "CJC, Ipamorelin, MK-677", frequency: "1x a cada 3 meses" },
  { name: "Glicemia em Jejum", why: "Risco de hiperglicemia", peptides: "MK-677, HGH, Tirzepatida", frequency: "Mensal" },
  { name: "HbA1c", why: "Média de glicose (3 meses)", peptides: "MK-677, Tirzepatida", frequency: "1x a cada 3 meses" },
  { name: "ALT / AST", why: "Função hepática", peptides: "Todos (especialmente orais)", frequency: "1x a cada 6 meses" },
  { name: "Creatinina / Ureia", why: "Função renal", peptides: "Todos", frequency: "1x a cada 6 meses" },
  { name: "Proteína C-Reativa", why: "Inflamação sistêmica", peptides: "BPC-157, TB-500", frequency: "1x a cada 3 meses" },
  { name: "TSH / T4 Livre", why: "Função tireoidiana", peptides: "Tirzepatida, Semaglutida", frequency: "1x a cada 6 meses" },
  { name: "Hemograma Completo", why: "Saúde geral e imunidade", peptides: "Thymosin Alpha-1, LL-37", frequency: "1x a cada 6 meses" },
];

const absoluteContraindications = [
  { condition: "Câncer Ativo", description: "Peptídeos de GH podem agravar a condição ocular.", peptides: "Todos os secretagogos de GH" },
  { condition: "Retinopatia Diabética", description: "Peptídeos de GH podem agravar a condição ocular.", peptides: "Secretagogos de GH" },
  { condition: "Pancreatite", description: "Contraindicação absoluta para GLP-1s (Tirzepatida/Semaglutida).", peptides: "Tirzepatida, Semaglutida" },
  { condition: "Gravidez / Amamentação", description: "Nenhum peptídeo pesquisado possui dados de segurança em gestantes.", peptides: "Todos os peptídeos" },
  { condition: "Uso de Insulina", description: "Risco de hipoglicemia severa com peptídeos que afetam glicose.", peptides: "MK-677, IGF-1" },
];

const relativeContraindications = [
  { condition: "Doenças Autoimunes Ativas", description: "Imunomoduladores como Thymosin Alpha-1 podem exacerbar flares.", peptides: "Thymosin Alpha-1" },
];

const dangerousCombinations = [
  { combination: "CJC-1295 + GHRP-6", risk: "Hipoglicemia / Fome", reason: "Aumento massivo de grelina e cortisol." },
  { combination: "Tirzepatida + Semaglutida", risk: "Desidratação / Vômito", reason: "Sobrecarga de receptores GLP-1/GIP." },
  { combination: "IGF-1 + Insulina", risk: "Hipoglicemia Severa", reason: "Ambos reduzem glicose no sangue drasticamente." },
];

function SideEffectCard({ data }: { data: SideEffect }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border/30 bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">{data.name}</p>
          <p className="text-[10px] text-muted-foreground">{data.commonCount} comuns · {data.rareCount} raros</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/20 pt-3">
          <div>
            <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Efeitos Comuns (Leves)</p>
            <div className="flex flex-wrap gap-1.5">
              {data.common.map(e => (
                <Badge key={e} className="border-0 bg-amber-500/15 text-amber-300 text-[9px] font-medium">{e}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Efeitos Raros / Graves</p>
            <div className="flex flex-wrap gap-1.5">
              {data.rare.map(e => (
                <Badge key={e} className="border-0 bg-red-500/15 text-red-400 text-[9px] font-medium">{e}</Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Como Minimizar</p>
            <div className="space-y-1">
              {data.mitigation.map(m => (
                <div key={m} className="flex items-start gap-1.5">
                  <Check className="h-3 w-3 shrink-0 text-emerald-400 mt-0.5" />
                  <span className="text-[10px] text-muted-foreground">{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SafetyTab() {
  const [subTab, setSubTab] = useState<"efeitos" | "exames" | "riscos">("efeitos");

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Efeitos colaterais, exames de sangue e contraindicações para uso seguro de peptídeos.
      </p>

      {/* Sub-tabs */}
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-border/40 bg-card p-1">
        {subTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-medium transition-all",
              subTab === tab.key
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Efeitos */}
      {subTab === "efeitos" && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground">
            Tabela de efeitos colaterais por peptídeo com estratégias de mitigação.
          </p>
          {sideEffectsData.map(d => (
            <SideEffectCard key={d.name} data={d} />
          ))}
        </div>
      )}

      {/* Exames */}
      {subTab === "exames" && (
        <div className="space-y-3">
          <p className="text-[10px] text-muted-foreground">
            Checklist de exames de sangue para monitoramento durante ciclos.
          </p>

          {/* Table header */}
          <div className="rounded-xl border border-border/30 bg-card overflow-hidden">
            <div className="grid grid-cols-4 gap-px bg-border/20">
              <div className="bg-secondary/40 p-3"><p className="text-[10px] font-semibold text-muted-foreground">Marcador</p></div>
              <div className="bg-secondary/40 p-3"><p className="text-[10px] font-semibold text-muted-foreground">Por quê?</p></div>
              <div className="bg-secondary/40 p-3"><p className="text-[10px] font-semibold text-muted-foreground">Peptídeos</p></div>
              <div className="bg-secondary/40 p-3"><p className="text-[10px] font-semibold text-muted-foreground">Frequência</p></div>
            </div>
            {examsData.map(exam => (
              <div key={exam.name} className="grid grid-cols-4 gap-px border-t border-border/20">
                <div className="p-3"><p className="text-[10px] font-semibold text-foreground">{exam.name}</p></div>
                <div className="p-3"><p className="text-[10px] text-muted-foreground">{exam.why}</p></div>
                <div className="p-3"><p className="text-[10px] text-muted-foreground">{exam.peptides}</p></div>
                <div className="p-3"><Badge className="shrink-0 border-0 bg-primary/10 text-primary text-[9px]">{exam.frequency}</Badge></div>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div className="rounded-xl border border-border/30 bg-card p-4 flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">Progresso dos Exames</p>
            <Badge className="border-0 bg-secondary text-muted-foreground text-[9px]">0%</Badge>
          </div>
        </div>
      )}

      {/* Riscos */}
      {subTab === "riscos" && (
        <div className="space-y-4">
          <p className="text-[10px] text-muted-foreground">
            Condições que impedem o uso de determinados peptídeos.
          </p>

          {/* Contraindicações Absolutas */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Ban className="h-4 w-4 text-red-400" />
              <h3 className="text-xs font-semibold text-foreground">Contraindicações Absolutas</h3>
            </div>
            <div className="space-y-2">
              {absoluteContraindications.map(c => (
                <div key={c.condition} className="rounded-xl border border-red-500/20 bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{c.condition}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{c.description}</p>
                    </div>
                    <Badge className="shrink-0 border-0 bg-red-500/15 text-red-400 text-[9px]">Absoluta</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contraindicações Relativas */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertOctagon className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-semibold text-foreground">Contraindicações Relativas</h3>
            </div>
            <div className="space-y-2">
              {relativeContraindications.map(c => (
                <div key={c.condition} className="rounded-xl border border-amber-500/20 bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{c.condition}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{c.description}</p>
                    </div>
                    <Badge className="shrink-0 border-0 bg-amber-500/15 text-amber-400 text-[9px]">Relativa</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Combinações Perigosas */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-red-400" />
              <h3 className="text-xs font-semibold text-foreground">Combinações Perigosas</h3>
            </div>
            <div className="rounded-xl border border-border/30 bg-card overflow-hidden">
              <div className="grid grid-cols-3 gap-px bg-border/20">
                <div className="bg-secondary/40 p-3"><p className="text-[10px] font-semibold text-muted-foreground">Combinação</p></div>
                <div className="bg-secondary/40 p-3"><p className="text-[10px] font-semibold text-muted-foreground">Risco</p></div>
                <div className="bg-secondary/40 p-3"><p className="text-[10px] font-semibold text-muted-foreground">Motivo</p></div>
              </div>
              {dangerousCombinations.map(c => (
                <div key={c.combination} className="grid grid-cols-3 gap-px bg-border/10 border-t border-border/20">
                  <div className="p-3"><p className="text-[10px] font-semibold text-foreground">{c.combination}</p></div>
                  <div className="p-3"><Badge className="border-0 bg-red-500/15 text-red-400 text-[9px]">{c.risk}</Badge></div>
                  <div className="p-3"><p className="text-[10px] text-muted-foreground">{c.reason}</p></div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-xl border border-border/20 bg-muted/30 p-4">
            <p className="text-[10px] text-muted-foreground leading-relaxed text-center italic">
              ⚠️ Este conteúdo é educacional e baseado em pesquisa. Consulte sempre um profissional de saúde antes de iniciar qualquer protocolo com peptídeos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
