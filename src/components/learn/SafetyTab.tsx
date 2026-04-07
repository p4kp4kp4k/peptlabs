import { useState } from "react";
import { AlertTriangle, FileText, ShieldAlert, ChevronDown, ChevronUp, Check } from "lucide-react";
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
  { name: "Hemograma completo", frequency: "A cada 8 semanas", relevance: "Todos os peptídeos" },
  { name: "Glicose em jejum + HbA1c", frequency: "A cada 12 semanas", relevance: "MK-677, Tirzepatida, Semaglutida" },
  { name: "IGF-1", frequency: "A cada 8-12 semanas", relevance: "GH Secretagogos, CJC-1295, Ipamorelin" },
  { name: "Função hepática (TGO/TGP)", frequency: "A cada 12 semanas", relevance: "Todos os peptídeos injetáveis" },
  { name: "Função renal (Creatinina/Ureia)", frequency: "A cada 12 semanas", relevance: "Todos os peptídeos" },
  { name: "TSH / T4 Livre", frequency: "A cada 16 semanas", relevance: "MK-677, Tesamorelin" },
  { name: "Lipidograma", frequency: "A cada 12 semanas", relevance: "Tirzepatida, Semaglutida" },
  { name: "Insulina em jejum", frequency: "A cada 12 semanas", relevance: "MK-677" },
];

const risksData = [
  { condition: "Histórico de câncer ativo", peptides: "Todos os secretagogos de GH", severity: "Absoluta" },
  { condition: "Gravidez / Amamentação", peptides: "Todos os peptídeos", severity: "Absoluta" },
  { condition: "Pancreatite ativa ou histórica", peptides: "Tirzepatida, Semaglutida", severity: "Absoluta" },
  { condition: "Diabetes tipo 1 descompensado", peptides: "MK-677", severity: "Absoluta" },
  { condition: "Insuficiência renal severa", peptides: "Todos os peptídeos injetáveis", severity: "Relativa" },
  { condition: "Melanoma ou histórico familiar", peptides: "Melanotan II", severity: "Absoluta" },
  { condition: "Menores de 18 anos", peptides: "Todos os peptídeos", severity: "Absoluta" },
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
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground">
            Exames recomendados para monitoramento durante protocolos de peptídeos.
          </p>
          {examsData.map(exam => (
            <div key={exam.name} className="rounded-xl border border-border/30 bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">{exam.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{exam.relevance}</p>
                </div>
                <Badge className="shrink-0 border-0 bg-primary/10 text-primary text-[9px]">{exam.frequency}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Riscos */}
      {subTab === "riscos" && (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground">
            Contraindicações absolutas e relativas para uso de peptídeos.
          </p>
          {risksData.map(risk => (
            <div key={risk.condition} className="rounded-xl border border-border/30 bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-foreground">{risk.condition}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{risk.peptides}</p>
                </div>
                <Badge className={cn(
                  "shrink-0 border-0 text-[9px]",
                  risk.severity === "Absoluta" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
                )}>
                  {risk.severity}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
