import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Calculator as CalcIcon, Droplets, FlaskConical, Syringe, Info, RotateCcw,
  Table2, Beaker, AlertTriangle, CheckCircle2, Clock, Snowflake, ThermometerSun,
  ClipboardList, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger
} from "@/components/ui/collapsible";

// ── Preset protocols for quick fill ──
const presetProtocols = [
  { name: "BPC-157 Recuperação", vial: "5", water: "2", dose: "250" },
  { name: "TB-500 Carga", vial: "5", water: "2", dose: "2500" },
  { name: "MGF Reparo Muscular", vial: "5", water: "2", dose: "200" },
  { name: "KLOW Recuperação", vial: "5", water: "2", dose: "250" },
  { name: "Semaglutida 0.25mg", vial: "5", water: "1", dose: "250" },
  { name: "Tirzepatida 2.5mg", vial: "10", water: "2", dose: "2500" },
  { name: "CJC-1295 / Ipamorelin", vial: "5", water: "2", dose: "100" },
  { name: "GHK-Cu Rejuvenescimento", vial: "5", water: "5", dose: "200" },
  { name: "Selank Ansiolítico", vial: "5", water: "2", dose: "200" },
  { name: "Epitalon Anti-aging", vial: "10", water: "2", dose: "5000" },
];

// ── Syringe sizes chips ──
const syringeSizes = [
  { label: "0.3 mL", value: 0.3, units: 30 },
  { label: "0.5 mL", value: 0.5, units: 50 },
  { label: "1.0 mL", value: 1.0, units: 100 },
];

const vialSizes = [2, 5, 10, 15, 20, 30];
const waterVolumes = [1, 2, 3, 4, 5, 6];
const commonDoses = [50, 100, 200, 250, 300, 500, 750, 1000, 1500, 2000, 2500];

// ── Conversion table data (from reference PDFs) ──
const conversionTable = [
  { peptide: "BPC-157", dose: "250mcg", vial: "5 mg", water: "2 mL", conc: "2500 mcg/mL", volume: "0.10 mL (10 UI)" },
  { peptide: "TB-500", dose: "2.5mg", vial: "5 mg", water: "2 mL", conc: "2500 mcg/mL", volume: "0.10 mL (10 UI)" },
  { peptide: "CJC/Ipam", dose: "100/200mcg", vial: "5mg/5mg", water: "2 mL", conc: "2500 mcg/mL", volume: "0.04/0.08 mL" },
  { peptide: "Tirzepatida", dose: "2.5mg", vial: "10 mg", water: "2 mL", conc: "5000 mcg/mL", volume: "0.50 mL (50 UI)" },
  { peptide: "Semaglutida", dose: "0.25mg", vial: "5 mg", water: "1 mL", conc: "5000 mcg/mL", volume: "0.05 mL (5 UI)" },
  { peptide: "GHK-Cu", dose: "200mcg", vial: "5 mg", water: "5 mL", conc: "1000 mcg/mL", volume: "0.20 mL (20 UI)" },
  { peptide: "Selank", dose: "200mcg", vial: "5 mg", water: "2 mL", conc: "2500 mcg/mL", volume: "0.08 mL (8 UI)" },
  { peptide: "Epitalon", dose: "5mg", vial: "10 mg", water: "2 mL", conc: "5000 mcg/mL", volume: "0.10 mL (10 UI)" },
];

// ── Diluent concentration reference ──
const diluentConcentrationTable = [
  { vial: "2 mg", bac: "1 mL", conc: "200mcg por 10 UI (0.1mL)" },
  { vial: "5 mg", bac: "2 mL", conc: "250mcg por 10 UI (0.1mL)" },
  { vial: "10 mg", bac: "2 mL", conc: "500mcg por 10 UI (0.1mL)" },
  { vial: "15 mg", bac: "3 mL", conc: "500mcg por 10 UI (0.1mL)" },
  { vial: "30 mg", bac: "6 mL", conc: "500mcg por 10 UI (0.1mL)" },
];

// ── Diluent data ──
const diluents = [
  {
    name: "Água Bacteriostática (BAC)",
    icon: Droplets,
    color: "text-cyan-400",
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/30",
    shelf: "28–30 dias",
    desc: "Padrão-ouro para reconstituição de peptídeos. Contém 0,9% de álcool benzílico como conservante, permitindo múltiplas aspirações.",
    pros: ["Conservante mantém esterilidade por até 30 dias", "Permite múltiplas aspirações do frasco", "Padrão-ouro para peptídeos em geral"],
    cons: ["Pode causar irritação local em pacientes sensíveis ao álcool benzílico"],
    storage: "Até 28-30 dias refrigerado (2–8°C)",
    bestFor: "BPC-157, TB-500, Ipamorelin, CJC-1295, GHK-Cu, Semaglutide, Tirzepatide",
  },
  {
    name: "Água Estéril / Salina",
    icon: Droplets,
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    shelf: "Dose Única",
    desc: "Água purificada sem conservantes. Ideal para uso imediato ou única aspiração.",
    pros: ["Sem conservantes — menos risco de reação alérgica", "Ideal para pacientes sensíveis"],
    cons: ["Sem conservante: usar em até 24 horas", "Não permite múltiplas aspirações do frasco"],
    storage: "Usar dentro de 24 horas após aberto",
    bestFor: "Uso único ou emergência. Não recomendado para uso prolongado.",
  },
  {
    name: "Solução Salina 0,9%",
    icon: Droplets,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    shelf: "15–20 dias",
    desc: "Solução salina isotônica que tampona o pH e reduz ardência na aplicação. Ideal para peptídeos ácidos.",
    pros: ["Tampona pH, reduz ardência", "Isotônico — menos dor na aplicação", "Disponível em farmácias"],
    cons: ["Não é ideal para todos os peptídeos liofilizados", "Sem conservante forte"],
    storage: "15-20 dias refrigerado (2–8°C)",
    bestFor: "Peptídeos ácidos (GHK-Cu). Diluição de GH e insulina.",
  },
];

const commonErrors = [
  { text: "Agitar o frasco após adicionar o diluente", fix: "Gire suavemente – agitar destrói ligações de aminoácidos de peptídeos frágeis (HGH, IGF-1)" },
  { text: "Deixar fora da geladeira por mais de 2h", fix: "Mais de 2h fora reduz potência em até 30%. Refrigere imediatamente após reconstituição" },
  { text: "Usar água da torneira ou mineral", fix: "Causa infecções graves. Sempre use água bacteriostática ou estéril" },
  { text: "Aspirar com a mesma agulha que perfurou o selo", fix: "Troque a agulha antes de aspirar para evitar contaminação" },
  { text: "Reconstituir sem limpar o topo do frasco", fix: "Limpe com álcool 70% em movimentos circulares antes de perfurar" },
];

export default function CalculatorPage() {
  const [vialMg, setVialMg] = useState("");
  const [diluentMl, setDiluentMl] = useState("");
  const [desiredDoseMcg, setDesiredDoseMcg] = useState("");
  const [selectedSyringe, setSelectedSyringe] = useState(syringeSizes[2]);
  const [protocolOpen, setProtocolOpen] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);

  const applyProtocol = (p: typeof presetProtocols[0]) => {
    setVialMg(p.vial);
    setDiluentMl(p.water);
    setDesiredDoseMcg(p.dose);
    setSelectedProtocol(p.name);
    setProtocolOpen(false);
  };

  const vial = parseFloat(vialMg) || 0;
  const diluent = parseFloat(diluentMl) || 0;
  const dose = parseFloat(desiredDoseMcg) || 0;

  const concentrationMcgPerMl = vial > 0 && diluent > 0 ? (vial * 1000) / diluent : 0;
  const volumeToInjectMl = concentrationMcgPerMl > 0 && dose > 0 ? dose / concentrationMcgPerMl : 0;
  const volumeToInjectUnits = volumeToInjectMl * selectedSyringe.units / selectedSyringe.value;
  const dosesPerVial = dose > 0 && vial > 0 ? (vial * 1000) / dose : 0;

  const hasInput = vial > 0 && diluent > 0 && dose > 0;
  const syringeFillPercent = hasInput ? Math.min((volumeToInjectMl / selectedSyringe.value) * 100, 100) : 0;

  const reset = () => { setVialMg(""); setDiluentMl(""); setDesiredDoseMcg(""); };

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground sm:text-xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <CalcIcon className="inline h-4.5 w-4.5 mr-2 text-primary" />
            Calculadora de Doses
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">Ferramenta profissional para reconstituição e dosagem de peptídeos</p>
        </div>
        <Button variant="ghost" size="icon" onClick={reset} title="Limpar" className="h-8 w-8">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Tabs defaultValue="calculator" className="space-y-4">
        <TabsList className="h-9 bg-secondary/60 p-0.5">
          <TabsTrigger value="calculator" className="text-[11px] gap-1.5 data-[state=active]:bg-card px-3 h-8">
            <Syringe className="h-3.5 w-3.5" /> Calculadora
          </TabsTrigger>
          <TabsTrigger value="tables" className="text-[11px] gap-1.5 data-[state=active]:bg-card px-3 h-8">
            <Table2 className="h-3.5 w-3.5" /> Tabelas
          </TabsTrigger>
          <TabsTrigger value="diluents" className="text-[11px] gap-1.5 data-[state=active]:bg-card px-3 h-8">
            <Beaker className="h-3.5 w-3.5" /> Diluentes
          </TabsTrigger>
        </TabsList>

        {/* ═══════════ TAB: CALCULADORA ═══════════ */}
        <TabsContent value="calculator" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr,280px]">
            {/* Left: Inputs */}
            <div className="space-y-4">
              {/* Syringe selector chips */}
              <Card className="border-border/40 bg-card/80">
                <CardContent className="p-4 space-y-3">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Seringa</Label>
                  <div className="flex gap-2">
                    {syringeSizes.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => setSelectedSyringe(s)}
                        className={`rounded-lg px-3 py-2 text-[11px] font-medium transition-all border ${
                          selectedSyringe.value === s.value
                            ? "bg-primary/15 border-primary/40 text-primary"
                            : "bg-secondary/40 border-border/30 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {s.label} ({s.units} UI)
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Vial size chips */}
              <Card className="border-border/40 bg-card/80">
                <CardContent className="p-4 space-y-3">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <FlaskConical className="h-3 w-3 text-emerald-400" /> Peso do Frasco (mg)
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {vialSizes.map((v) => (
                      <button
                        key={v}
                        onClick={() => setVialMg(String(v))}
                        className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all border ${
                          vialMg === String(v)
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                            : "bg-secondary/40 border-border/30 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {v} mg
                      </button>
                    ))}
                  </div>
                  <Input
                    type="number" placeholder="Ou digite..." value={vialMg}
                    onChange={(e) => setVialMg(e.target.value)} min="0" step="0.1"
                    className="text-xs h-8"
                  />
                </CardContent>
              </Card>

              {/* Water volume chips */}
              <Card className="border-border/40 bg-card/80">
                <CardContent className="p-4 space-y-3">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Droplets className="h-3 w-3 text-cyan-400" /> Volume de Diluente (mL)
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {waterVolumes.map((w) => (
                      <button
                        key={w}
                        onClick={() => setDiluentMl(String(w))}
                        className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all border ${
                          diluentMl === String(w)
                            ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400"
                            : "bg-secondary/40 border-border/30 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {w} mL
                      </button>
                    ))}
                  </div>
                  <Input
                    type="number" placeholder="Ou digite..." value={diluentMl}
                    onChange={(e) => setDiluentMl(e.target.value)} min="0" step="0.1"
                    className="text-xs h-8"
                  />
                </CardContent>
              </Card>

              {/* Dose chips */}
              <Card className="border-border/40 bg-card/80">
                <CardContent className="p-4 space-y-3">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Syringe className="h-3 w-3 text-violet-400" /> Dose Desejada (mcg)
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {commonDoses.map((d) => (
                      <button
                        key={d}
                        onClick={() => setDesiredDoseMcg(String(d))}
                        className={`rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all border ${
                          desiredDoseMcg === String(d)
                            ? "bg-violet-500/15 border-violet-500/40 text-violet-400"
                            : "bg-secondary/40 border-border/30 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {d >= 1000 ? `${d / 1000} mg` : `${d} mcg`}
                      </button>
                    ))}
                  </div>
                  <Input
                    type="number" placeholder="Ou digite..." value={desiredDoseMcg}
                    onChange={(e) => setDesiredDoseMcg(e.target.value)} min="0" step="1"
                    className="text-xs h-8"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right: Visual syringe + results */}
            <div className="space-y-4">
              {/* Visual Syringe */}
              <Card className="border-border/40 bg-card/80">
                <CardContent className="p-4 flex flex-col items-center">
                  <p className="text-[10px] text-muted-foreground mb-3 font-semibold uppercase tracking-wider">Seringa Visual</p>
                  <div className="relative w-14 h-48 mb-3">
                    {/* Syringe body */}
                    <div className="absolute inset-x-1 top-0 bottom-4 rounded-t-lg border-2 border-border/60 bg-secondary/20 overflow-hidden">
                      {/* Fill */}
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-primary/30 border-t border-primary/50 transition-all duration-500"
                        style={{ height: `${syringeFillPercent}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-primary/10" />
                      </div>
                      {/* Tick marks */}
                      {[0, 25, 50, 75, 100].map((tick) => (
                        <div key={tick} className="absolute left-0 right-0 border-t border-border/30" style={{ bottom: `${tick}%` }}>
                          <span className="absolute -right-1 translate-x-full text-[7px] text-muted-foreground/60 -translate-y-1/2">
                            {((tick / 100) * selectedSyringe.units).toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Needle */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-muted-foreground/40 rounded-b" />
                  </div>
                  {hasInput ? (
                    <div className="text-center">
                      <p className="text-lg font-bold text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {volumeToInjectUnits.toFixed(1)} UI
                      </p>
                      <p className="text-[10px] text-muted-foreground">{volumeToInjectMl.toFixed(3)} mL</p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">Preencha os dados</p>
                  )}
                </CardContent>
              </Card>

              {/* Result cards */}
              <div className="space-y-2">
                <ResultCard label="Concentração" value={hasInput ? `${concentrationMcgPerMl.toFixed(1)} mcg/mL` : "—"} color="text-emerald-400" />
                <ResultCard
                  label="Volume a Injetar"
                  value={hasInput ? `${volumeToInjectMl.toFixed(3)} mL` : "—"}
                  sub={hasInput ? `≈ ${volumeToInjectUnits.toFixed(1)} UI (${selectedSyringe.label})` : undefined}
                  color="text-cyan-400"
                  highlight={hasInput}
                />
                <ResultCard label="Doses por Frasco" value={hasInput ? `${Math.floor(dosesPerVial)} doses` : "—"} color="text-violet-400" />
                <ResultCard label="Total no Frasco" value={vial > 0 ? `${(vial * 1000).toLocaleString()} mcg` : "—"} color="text-amber-400" />
              </div>
            </div>
          </div>

          {/* How it was calculated */}
          {hasInput && (
            <Card className="border-border/40 bg-card/60">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-[11px] font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  📐 Como foi calculado
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                <FormulaStep step="1" label="Concentração" formula={`${vial} mg × 1000 ÷ ${diluent} mL = ${concentrationMcgPerMl.toFixed(1)} mcg/mL`} />
                <FormulaStep step="2" label="Volume" formula={`${dose} mcg ÷ ${concentrationMcgPerMl.toFixed(1)} mcg/mL = ${volumeToInjectMl.toFixed(4)} mL`} />
                <FormulaStep step="3" label="UI" formula={`${volumeToInjectMl.toFixed(4)} mL × ${selectedSyringe.units} UI/${selectedSyringe.label} = ${volumeToInjectUnits.toFixed(1)} UI`} />
                <FormulaStep step="4" label="Doses" formula={`${(vial * 1000).toLocaleString()} mcg ÷ ${dose} mcg = ${Math.floor(dosesPerVial)} doses`} />
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <Card className="border-border/40 bg-card/40">
            <CardContent className="flex gap-3 p-3">
              <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-[10px] text-muted-foreground">
                  <strong className="text-foreground">Importante:</strong> Ferramenta de referência. Confirme dosagens com profissional de saúde.
                </p>
                <p className="text-[9px] text-muted-foreground/60">1 mL = 100 UI em seringa U-100 padrão</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ TAB: TABELAS ═══════════ */}
        <TabsContent value="tables" className="space-y-4">
          <Card className="border-border/40 bg-card/80">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Tabela Mestre de Conversão
              </CardTitle>
              <CardDescription className="text-[11px]">
                Referência rápida para os peptídeos mais utilizados com volumes pré-calculados
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-4">
              <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Peptídeo</th>
                      <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Dose</th>
                      <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Frasco</th>
                      <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Diluente</th>
                      <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Conc.</th>
                      <th className="text-center px-2 py-2 font-semibold text-muted-foreground">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversionTable.map((row, i) => (
                      <tr key={row.peptide} className={`border-b border-border/15 ${i % 2 === 0 ? "bg-secondary/10" : ""}`}>
                        <td className="px-4 py-2 font-semibold text-foreground">{row.peptide}</td>
                        <td className="text-center px-2 py-2 text-muted-foreground">{row.dose}</td>
                        <td className="text-center px-2 py-2 text-muted-foreground">{row.vial}</td>
                        <td className="text-center px-2 py-2 text-muted-foreground">{row.water}</td>
                        <td className="text-center px-2 py-2 text-primary font-medium">{row.conc}</td>
                        <td className="text-center px-2 py-2 text-muted-foreground">{row.volume}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Volume de Diluente por Concentração */}
          <Card className="border-border/40 bg-card/80">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Volume de Diluente por Concentração
              </CardTitle>
              <CardDescription className="text-[11px]">
                BAC recomendado e concentração resultante por tamanho de frasco
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Frasco</th>
                      <th className="text-center px-3 py-2 font-semibold text-muted-foreground">BAC Recomendado</th>
                      <th className="text-center px-3 py-2 font-semibold text-muted-foreground">Concentração Resultante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diluentConcentrationTable.map((row, i) => (
                      <tr key={row.vial} className={`border-b border-border/15 ${i % 2 === 0 ? "bg-secondary/10" : ""}`}>
                        <td className="px-4 py-2 font-semibold text-foreground">{row.vial}</td>
                        <td className="text-center px-3 py-2 text-muted-foreground">{row.bac}</td>
                        <td className="text-center px-3 py-2 text-primary font-medium">{row.conc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-card/40">
            <CardContent className="flex gap-3 p-3">
              <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground">
                Valores calculados com base em seringas de insulina U-100 (1 mL = 100 UI). Toque em um peptídeo para preencher a calculadora.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════ TAB: DILUENTES ═══════════ */}
        <TabsContent value="diluents" className="space-y-4">
          <div className="space-y-3">
            {diluents.map((d) => {
              const Icon = d.icon;
              return (
                <Card key={d.name} className={`border-border/40 bg-card/80`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${d.bg} shrink-0`}>
                        <Icon className={`h-4 w-4 ${d.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                          {d.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{d.desc}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">✓ Vantagens</p>
                        <ul className="space-y-1">
                          {d.pros.map((p) => (
                            <li key={p} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1.5">⚠ Desvantagens</p>
                        <ul className="space-y-1">
                          {d.cons.map((c) => (
                            <li key={c} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                              <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3 text-muted-foreground/60" />
                        <span><strong className="text-foreground">Validade:</strong> {d.storage}</span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-secondary/30 p-2.5">
                      <p className="text-[10px] text-muted-foreground">
                        <strong className="text-foreground">Indicado para:</strong> {d.bestFor}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Common errors */}
          <Card className="border-border/40 bg-card/80">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-[12px] flex items-center gap-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                Erros Comuns na Reconstituição
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-2">
                {commonErrors.map((err, i) => (
                  <div key={i} className="flex gap-3 items-start rounded-lg bg-secondary/20 p-2.5">
                    <span className="text-[10px] text-destructive font-bold shrink-0">✗</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground line-through">{err.text}</p>
                      <p className="text-[10px] text-emerald-400 mt-0.5">✓ {err.fix}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Storage tips */}
          <Card className="border-border/40 bg-card/80">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-[12px] flex items-center gap-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <Snowflake className="h-3.5 w-3.5 text-cyan-400" />
                Guia de Armazenamento
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-border/30 p-3 text-center">
                  <Snowflake className="h-4 w-4 text-cyan-400 mx-auto mb-1" />
                  <p className="text-[10px] font-semibold text-foreground">Liofilizado (Pó)</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Freezer (-20°C) por anos</p>
                  <p className="text-[9px] text-muted-foreground">Geladeira (2-8°C) por meses</p>
                </div>
                <div className="rounded-lg border border-border/30 p-3 text-center">
                  <Droplets className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                  <p className="text-[10px] font-semibold text-foreground">Reconstituído (BAC)</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Geladeira (2-8°C)</p>
                  <p className="text-[9px] text-muted-foreground">Até 28 dias</p>
                </div>
                <div className="rounded-lg border border-border/30 p-3 text-center">
                  <ThermometerSun className="h-4 w-4 text-destructive mx-auto mb-1" />
                  <p className="text-[10px] font-semibold text-foreground">Evitar</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Luz solar direta</p>
                  <p className="text-[9px] text-muted-foreground">Temperatura ambiente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ResultCard({ label, value, sub, color, highlight }: {
  label: string; value: string; sub?: string; color: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-border/30 p-3 ${highlight ? "bg-primary/5 border-primary/20" : ""}`}>
      <p className="text-[9px] text-muted-foreground mb-0.5">{label}</p>
      <p className={`text-sm font-bold ${highlight ? "text-primary" : "text-foreground"}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {value}
      </p>
      {sub && <p className="text-[9px] text-muted-foreground/70 mt-0.5">{sub}</p>}
    </div>
  );
}

function FormulaStep({ step, label, formula }: { step: string; label: string; formula: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary shrink-0">{step}</span>
      <span className="text-[10px] font-semibold text-foreground w-20 shrink-0">{label}</span>
      <code className="text-[10px] text-muted-foreground font-mono">{formula}</code>
    </div>
  );
}
