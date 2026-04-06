import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Syringe, ListChecks } from "lucide-react";
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
  const dosageRows = dosage_table as unknown as DosageRow[] | null;
  const phases = protocol_phases as unknown as PhaseRow[] | null;

  return (
    <div className="space-y-4">
      {/* Dosage Table */}
      {dosageRows && dosageRows.length > 0 && (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Syringe className="inline h-3.5 w-3.5 text-primary mr-1.5" />
              Dosagem por Indicação
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Indicação</th>
                    <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Dose</th>
                    <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Frequência</th>
                    <th className="text-left py-2 text-muted-foreground font-medium">Duração</th>
                  </tr>
                </thead>
                <tbody>
                  {dosageRows.map((row, i) => (
                    <tr key={i} className="border-b border-border/20 last:border-0">
                      <td className="py-2 pr-3 text-foreground font-medium">{row.indicacao}</td>
                      <td className="py-2 pr-3 text-foreground">{row.dose}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{row.frequencia}</td>
                      <td className="py-2 text-muted-foreground">{row.duracao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Protocol Phases */}
      {phases && phases.length > 0 && (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <ListChecks className="inline h-3.5 w-3.5 text-primary mr-1.5" />
              Fases do Protocolo
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Fase</th>
                    <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Dose</th>
                    {phases[0].unidades && <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Unidades</th>}
                    {phases[0].notas && <th className="text-left py-2 text-muted-foreground font-medium">Notas</th>}
                  </tr>
                </thead>
                <tbody>
                  {phases.map((row, i) => (
                    <tr key={i} className="border-b border-border/20 last:border-0">
                      <td className="py-2 pr-3 text-foreground font-medium">{row.fase}</td>
                      <td className="py-2 pr-3 text-foreground">{row.dose}</td>
                      {row.unidades && <td className="py-2 pr-3 text-muted-foreground">{row.unidades}</td>}
                      {row.notas && <td className="py-2 text-muted-foreground">{row.notas}</td>}
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
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Informações de Dosagem
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{dosage_info}</p>
          </CardContent>
        </Card>
      )}

      {/* Reconstitution */}
      {(reconstitution_steps && reconstitution_steps.length > 0) ? (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Reconstituição
            </h3>
            <div className="space-y-2">
              {reconstitution_steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Badge variant="outline" className="text-[10px] h-5 w-5 flex items-center justify-center shrink-0 p-0 rounded-full">
                    {i + 1}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : reconstitution && (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Reconstituição
            </h3>
            <p className="text-xs text-muted-foreground">{reconstitution}</p>
          </CardContent>
        </Card>
      )}

      {half_life && (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Meia-Vida</p>
            <p className="text-xs text-foreground font-medium">{half_life}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
