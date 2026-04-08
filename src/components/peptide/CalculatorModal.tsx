import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Syringe, FlaskConical, Droplets, Calculator } from "lucide-react";

const syringeSizes = [
  { label: "0.3 mL", value: 0.3, units: 30 },
  { label: "0.5 mL", value: 0.5, units: 50 },
  { label: "1.0 mL", value: 1.0, units: 100 },
];

const vialSizes = [2, 5, 10, 15, 20, 30];
const waterVolumes = [1, 2, 3, 4, 5, 6];
const commonDoses = [50, 100, 200, 250, 300, 500, 750, 1000, 1500, 2000];

interface CalculatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  peptideName: string;
  defaultDoseMcg?: number;
  defaultVialMg?: number;
  defaultWaterMl?: number;
}

export function CalculatorModal({ open, onOpenChange, peptideName, defaultDoseMcg, defaultVialMg, defaultWaterMl }: CalculatorModalProps) {
  const [vialMg, setVialMg] = useState(defaultVialMg?.toString() || "5");
  const [diluentMl, setDiluentMl] = useState(defaultWaterMl?.toString() || "2");
  const [desiredDoseMcg, setDesiredDoseMcg] = useState(defaultDoseMcg?.toString() || "250");
  const [selectedSyringe, setSelectedSyringe] = useState(syringeSizes[2]);

  useEffect(() => {
    if (open) {
      if (defaultVialMg) setVialMg(defaultVialMg.toString());
      if (defaultWaterMl) setDiluentMl(defaultWaterMl.toString());
      if (defaultDoseMcg) setDesiredDoseMcg(defaultDoseMcg.toString());
    }
  }, [open, defaultVialMg, defaultWaterMl, defaultDoseMcg]);

  const vial = parseFloat(vialMg) || 0;
  const diluent = parseFloat(diluentMl) || 0;
  const dose = parseFloat(desiredDoseMcg) || 0;

  const concentrationMcgPerMl = vial > 0 && diluent > 0 ? (vial * 1000) / diluent : 0;
  const volumeToInjectMl = concentrationMcgPerMl > 0 && dose > 0 ? dose / concentrationMcgPerMl : 0;
  const volumeToInjectUnits = volumeToInjectMl * selectedSyringe.units / selectedSyringe.value;
  const dosesPerVial = dose > 0 && vial > 0 ? (vial * 1000) / dose : 0;

  const hasInput = vial > 0 && diluent > 0 && dose > 0;
  const syringeFillPercent = hasInput ? Math.min((volumeToInjectMl / selectedSyringe.value) * 100, 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-border bg-card p-0 gap-0">
        <DialogHeader className="p-4 pb-3 border-b border-border">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Calculadora — {peptideName}
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Inputs row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1.5 block">Frasco (mg)</Label>
              <Input
                type="number" value={vialMg} onChange={e => setVialMg(e.target.value)}
                className="h-9 text-xs font-bold text-center"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {vialSizes.slice(0, 4).map(v => (
                  <button key={v} onClick={() => setVialMg(String(v))}
                    className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${vialMg === String(v) ? "bg-primary/15 border-primary/40 text-primary" : "border-border/30 text-muted-foreground hover:text-foreground"}`}
                  >{v}</button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1.5 block">Água (mL)</Label>
              <Input
                type="number" value={diluentMl} onChange={e => setDiluentMl(e.target.value)}
                className="h-9 text-xs font-bold text-center"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {waterVolumes.slice(0, 4).map(w => (
                  <button key={w} onClick={() => setDiluentMl(String(w))}
                    className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${diluentMl === String(w) ? "bg-primary/15 border-primary/40 text-primary" : "border-border/30 text-muted-foreground hover:text-foreground"}`}
                  >{w}</button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground mb-1.5 block">Dose (mcg)</Label>
              <Input
                type="number" value={desiredDoseMcg} onChange={e => setDesiredDoseMcg(e.target.value)}
                className="h-9 text-xs font-bold text-center"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[100, 200, 250, 500].map(d => (
                  <button key={d} onClick={() => setDesiredDoseMcg(String(d))}
                    className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${desiredDoseMcg === String(d) ? "bg-primary/15 border-primary/40 text-primary" : "border-border/30 text-muted-foreground hover:text-foreground"}`}
                  >{d}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          {hasInput && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <ResultRow label="Concentração" value={`${concentrationMcgPerMl.toFixed(0)} mcg/mL`} />
                <ResultRow label="Volume por dose" value={`${volumeToInjectMl.toFixed(3)} mL`} />
                <ResultRow label="Unidades na seringa" value={`${volumeToInjectUnits.toFixed(1)} UI`} highlight />
                <ResultRow label="Doses por frasco" value={`${Math.floor(dosesPerVial)} doses`} />
              </div>

              {/* Syringe visual bar */}
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border">
                <div className="relative flex-1 h-3.5 rounded-full bg-border/40 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                    style={{ width: `${syringeFillPercent}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-primary whitespace-nowrap">{volumeToInjectUnits.toFixed(1)} / {selectedSyringe.units}UI</span>
              </div>

              {/* Syringe selector */}
              <div className="flex gap-1.5">
                {syringeSizes.map(s => (
                  <button key={s.label} onClick={() => setSelectedSyringe(s)}
                    className={`flex-1 text-[10px] py-1.5 rounded-md border font-medium transition-colors ${selectedSyringe.value === s.value ? "bg-primary/15 border-primary/40 text-primary" : "border-border/30 text-muted-foreground hover:text-foreground"}`}
                  >{s.label} ({s.units}UI)</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/30">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={`text-xs font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
