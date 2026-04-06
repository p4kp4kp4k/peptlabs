import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calculator as CalcIcon, Droplets, FlaskConical, Syringe, Info, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CalculatorPage() {
  const [vialMg, setVialMg] = useState("");
  const [diluentMl, setDiluentMl] = useState("");
  const [desiredDoseMcg, setDesiredDoseMcg] = useState("");

  const vial = parseFloat(vialMg) || 0;
  const diluent = parseFloat(diluentMl) || 0;
  const dose = parseFloat(desiredDoseMcg) || 0;

  const concentrationMcgPerMl = vial > 0 && diluent > 0 ? (vial * 1000) / diluent : 0;
  const volumeToInjectMl = concentrationMcgPerMl > 0 && dose > 0 ? dose / concentrationMcgPerMl : 0;
  const volumeToInjectUnits = volumeToInjectMl * 100; // 1 mL = 100 units on insulin syringe
  const dosesPerVial = dose > 0 && vial > 0 ? (vial * 1000) / dose : 0;

  const hasInput = vial > 0 && diluent > 0 && dose > 0;

  const reset = () => {
    setVialMg("");
    setDiluentMl("");
    setDesiredDoseMcg("");
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <CalcIcon className="inline h-5 w-5 mr-2 text-primary" />
            Calculadora de Doses
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Calcule o volume exato para aplicação de peptídeos</p>
        </div>
        <Button variant="ghost" size="icon" onClick={reset} title="Limpar">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Input Card */}
      <Card className="border-border/40 bg-card/80">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Dados do Peptídeo</CardTitle>
          <CardDescription className="text-xs">Preencha as informações do frasco e dose desejada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="vial" className="text-xs flex items-center gap-1.5">
                <FlaskConical className="h-3.5 w-3.5 text-emerald-400" />
                Peso do Frasco
              </Label>
              <div className="relative">
                <Input
                  id="vial"
                  type="number"
                  placeholder="5"
                  value={vialMg}
                  onChange={(e) => setVialMg(e.target.value)}
                  min="0"
                  step="0.1"
                  className="pr-10 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">mg</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diluent" className="text-xs flex items-center gap-1.5">
                <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                Volume de Diluente
              </Label>
              <div className="relative">
                <Input
                  id="diluent"
                  type="number"
                  placeholder="2"
                  value={diluentMl}
                  onChange={(e) => setDiluentMl(e.target.value)}
                  min="0"
                  step="0.1"
                  className="pr-10 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">mL</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dose" className="text-xs flex items-center gap-1.5">
                <Syringe className="h-3.5 w-3.5 text-violet-400" />
                Dose Desejada
              </Label>
              <div className="relative">
                <Input
                  id="dose"
                  type="number"
                  placeholder="250"
                  value={desiredDoseMcg}
                  onChange={(e) => setDesiredDoseMcg(e.target.value)}
                  min="0"
                  step="1"
                  className="pr-12 text-sm"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">mcg</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Card */}
      <Card className={`border-border/40 transition-all ${hasInput ? "bg-card/80" : "bg-card/40 opacity-60"}`}>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Resultados
            {hasInput && <Badge variant="secondary" className="text-[10px]">Calculado</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultItem
              label="Concentração"
              value={hasInput ? `${concentrationMcgPerMl.toFixed(1)} mcg/mL` : "—"}
              sub="Concentração após reconstituição"
              color="text-emerald-400"
            />
            <ResultItem
              label="Volume a Injetar"
              value={hasInput ? `${volumeToInjectMl.toFixed(3)} mL` : "—"}
              sub={hasInput ? `≈ ${volumeToInjectUnits.toFixed(1)} unidades (seringa de insulina)` : "Em unidades de insulina"}
              color="text-cyan-400"
              highlight={hasInput}
            />
            <ResultItem
              label="Doses por Frasco"
              value={hasInput ? `${Math.floor(dosesPerVial)} doses` : "—"}
              sub="Quantidade total de aplicações"
              color="text-violet-400"
            />
            <ResultItem
              label="Total no Frasco"
              value={vial > 0 ? `${(vial * 1000).toLocaleString()} mcg` : "—"}
              sub="Conteúdo total em microgramas"
              color="text-amber-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-border/40 bg-card/40">
        <CardContent className="flex gap-3 p-4">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Importante:</strong> Esta calculadora é apenas uma ferramenta de referência.
              Sempre confirme dosagens com um profissional de saúde qualificado antes da aplicação.
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              1 mL = 100 unidades em seringa de insulina padrão (U-100)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultItem({ label, value, sub, color, highlight }: {
  label: string; value: string; sub: string; color: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-border/30 p-3 ${highlight ? "bg-primary/5 border-primary/20" : ""}`}>
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-bold ${highlight ? "text-primary" : "text-foreground"}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sub}</p>
    </div>
  );
}
