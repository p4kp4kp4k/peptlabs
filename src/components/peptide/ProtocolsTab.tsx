import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Syringe, ListChecks, Beaker } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Json } from "@/integrations/supabase/types";

interface DosageRow {
  indicacao: string;
  dose: string;
  frequencia: string;
  duracao: string;
}

interface PhaseRow {
  fase: string;
  dose: string;
  unidades?: string;
  notas?: string;
}

interface ProtocolsTabProps {
  dosage_info?: string | null;
  dosage_table?: Json | null;
  protocol_phases?: Json | null;
  reconstitution?: string | null;
  reconstitution_steps?: string[] | null;
  half_life?: string | null;
}

export default function ProtocolsTab({
  dosage_info, dosage_table, protocol_phases, reconstitution, reconstitution_steps, half_life
}: ProtocolsTabProps) {
  const navigate = useNavigate();
  const dosageRows = dosage_table as unknown as DosageRow[] | null;
  const phases = protocol_phases as unknown as PhaseRow[] | null;

  const hasContent = dosageRows || phases || dosage_info || reconstitution_steps || reconstitution;

  if (!hasContent) {
    return (
      <Card className="border-border/30 bg-card/90">
        <CardContent className="p-5">
          <p className="text-xs text-muted-foreground italic">Informações de protocolo não disponíveis para este peptídeo.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dosagem por Indicação */}
      {dosageRows && dosageRows.length > 0 && (
        <Card className="border-border/30 bg-card/90">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Syringe className="h-4 w-4 text-amber-400" />
              Dosagem por Indicação
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2.5 pr-4 text-muted-foreground font-medium">Indicação</th>
                    <th className="text-left py-2.5 pr-4 text-muted-foreground font-medium">Dose</th>
                    <th className="text-left py-2.5 pr-4 text-muted-foreground font-medium">Frequência</th>
                    <th className="text-left py-2.5 text-muted-foreground font-medium">Duração</th>
                  </tr>
                </thead>
                <tbody>
                  {dosageRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/20 last:border-0">
                      <td className="py-2.5 pr-4 text-foreground font-medium">{row.indicacao}</td>
                      <td className="py-2.5 pr-4 text-amber-400 font-semibold">{row.dose}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{row.frequencia}</td>
                      <td className="py-2.5 text-muted-foreground">{row.duracao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fases do Protocolo */}
      {phases && phases.length > 0 && (
        <Card className="border-border/30 bg-card/90">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <ListChecks className="h-4 w-4 text-amber-400" />
              Fases do Protocolo
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2.5 pr-3 text-muted-foreground font-medium w-8">#</th>
                    <th className="text-left py-2.5 pr-4 text-muted-foreground font-medium">Fase</th>
                    <th className="text-left py-2.5 pr-4 text-muted-foreground font-medium">Dose</th>
                    {phases[0]?.unidades && <th className="text-left py-2.5 text-muted-foreground font-medium">Unidades</th>}
                    {phases[0]?.notas && <th className="text-left py-2.5 text-muted-foreground font-medium">Notas</th>}
                  </tr>
                </thead>
                <tbody>
                  {phases.map((row, i) => (
                    <tr key={i} className="border-b border-border/20 last:border-0">
                      <td className="py-2.5 pr-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 text-foreground font-medium">{row.fase}</td>
                      <td className="py-2.5 pr-4 text-amber-400 font-semibold">{row.dose}</td>
                      {row.unidades && <td className="py-2.5 text-muted-foreground">{row.unidades}</td>}
                      {row.notas && <td className="py-2.5 text-muted-foreground">{row.notas}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic dosage info fallback */}
      {!dosageRows && dosage_info && (
        <Card className="border-border/30 bg-card/90">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Informações de Dosagem
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{dosage_info}</p>
          </CardContent>
        </Card>
      )}

      {/* Reconstituição */}
      {(reconstitution_steps && reconstitution_steps.length > 0) && (
        <Card className="border-border/30 bg-card/90">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                <Beaker className="h-4 w-4 text-amber-400" />
                Reconstituição
              </h3>
              <button
                onClick={() => navigate("/calculator")}
                className="flex items-center gap-1.5 text-[10px] font-semibold bg-foreground text-background px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity"
              >
                <Syringe className="h-3 w-3" />
                Calcular Dose
              </button>
            </div>
            <div className="space-y-3">
              {reconstitution_steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">{step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
