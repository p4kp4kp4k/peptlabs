import { Badge } from "@/components/ui/badge";
import { Syringe, ListChecks, Beaker, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Json } from "@/integrations/supabase/types";

// Normalize both old and new dosage_table formats
interface RawDosageRow {
  indicacao?: string;
  objetivo?: string;
  dose: string;
  frequencia: string;
  duracao: string;
}
interface NormalizedDosageRow {
  indicacao: string;
  dose: string;
  frequencia: string;
  duracao: string;
}

// Normalize both old and new protocol_phases formats
interface RawPhaseRow {
  fase: string;
  dose?: string;
  notas?: string;
  unidades?: string;
  duracao?: string;
  descricao?: string;
}
interface NormalizedPhaseRow {
  fase: string;
  dose: string;
  detalhes: string;
}

function normalizeDosage(rows: RawDosageRow[]): NormalizedDosageRow[] {
  return rows.map((r) => ({
    indicacao: r.indicacao || r.objetivo || "—",
    dose: r.dose,
    frequencia: r.frequencia,
    duracao: r.duracao,
  }));
}

function normalizePhases(rows: RawPhaseRow[]): NormalizedPhaseRow[] {
  return rows.map((r) => {
    // New format: {fase, duracao, descricao} → extract dose from descricao
    if (r.descricao) {
      // Try to extract dose pattern from descricao (e.g. "100 mcg antes de dormir")
      const doseMatch = r.descricao.match(/^([\d.,\-–]+\s*(?:mcg|mg|μg|UI|IU|mL|g|%)[^\s]*(?:\s*(?:\/(?:dia|semana|kg)|\d*x\/(?:dia|semana)))?)/i);
      const dose = doseMatch ? doseMatch[1] : r.duracao || "—";
      const detalhes = doseMatch ? r.descricao.slice(doseMatch[0].length).trim() : r.descricao;
      return { fase: r.fase, dose, detalhes: detalhes || r.duracao || "—" };
    }
    // Old format: {fase, dose, notas/unidades}
    return {
      fase: r.fase,
      dose: r.dose || "—",
      detalhes: r.unidades || r.notas || "—",
    };
  });
}

interface ProtocolsTabProps {
  dosage_info?: string | null;
  dosage_table?: Json | null;
  protocol_phases?: Json | null;
  reconstitution?: string | null;
  reconstitution_steps?: string[] | null;
  half_life?: string | null;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border/25 bg-card/80 p-4 sm:p-5">{children}</div>;
}

function SectionTitle({ icon: Icon, children, action }: { icon: React.ElementType; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
          <Icon className="h-3.5 w-3.5" />
        </div>
        {children}
      </h3>
      {action}
    </div>
  );
}

export default function ProtocolsTab({ dosage_info, dosage_table, protocol_phases, reconstitution, reconstitution_steps, half_life }: ProtocolsTabProps) {
  const navigate = useNavigate();
  const rawDosage = dosage_table as unknown as RawDosageRow[] | null;
  const rawPhases = protocol_phases as unknown as RawPhaseRow[] | null;

  const dosageRows = rawDosage ? normalizeDosage(rawDosage) : null;
  const phases = rawPhases ? normalizePhases(rawPhases) : null;

  if (!dosageRows && !phases && !dosage_info && !reconstitution_steps && !reconstitution) {
    return (
      <SectionCard>
        <p className="text-xs text-muted-foreground italic">Informações de protocolo não disponíveis para este peptídeo.</p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo do protocolo + meia-vida */}
      {(dosage_info || half_life) && (
        <SectionCard>
          <SectionTitle icon={Info}>Resumo do Protocolo</SectionTitle>
          {dosage_info && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/15 mb-3">
              <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed">{dosage_info}</p>
            </div>
          )}
          {half_life && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Meia-vida:</span> ~{half_life}
            </div>
          )}
        </SectionCard>
      )}

      {/* Dosagem por Indicação — formato unificado */}
      {dosageRows && dosageRows.length > 0 && (
        <SectionCard>
          <SectionTitle icon={Syringe}>Dosagem por Indicação</SectionTitle>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30">
                  {["Indicação", "Dose", "Frequência", "Duração"].map(h => (
                    <th key={h} className="text-left py-2.5 px-3 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dosageRows.map((row, i) => (
                  <tr key={i} className="border-b border-border/15 last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-3 text-foreground font-medium">{row.indicacao}</td>
                    <td className="py-3 px-3 text-primary font-bold whitespace-nowrap">{row.dose}</td>
                    <td className="py-3 px-3 text-muted-foreground">{row.frequencia}</td>
                    <td className="py-3 px-3 text-muted-foreground">{row.duracao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Fases do Protocolo — formato unificado */}
      {phases && phases.length > 0 && (
        <SectionCard>
          <SectionTitle icon={ListChecks}>Fases do Protocolo</SectionTitle>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider w-8">#</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">Fase</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">Dose</th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {phases.map((row, i) => (
                  <tr key={i} className="border-b border-border/15 last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-3">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">{i + 1}</span>
                    </td>
                    <td className="py-3 px-3 text-foreground font-medium">{row.fase}</td>
                    <td className="py-3 px-3 text-primary font-bold whitespace-nowrap">{row.dose}</td>
                    <td className="py-3 px-3 text-muted-foreground">{row.detalhes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Reconstituição */}
      {reconstitution_steps && reconstitution_steps.length > 0 && (
        <SectionCard>
          <SectionTitle
            icon={Beaker}
            action={
              <button
                onClick={() => navigate("/app/calculator")}
                className="flex items-center gap-1.5 text-[11px] font-bold bg-foreground text-background px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Syringe className="h-3 w-3" />
                Calcular Dose
              </button>
            }
          >
            Reconstituição
          </SectionTitle>
          <div className="space-y-2">
            {reconstitution_steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border/15">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">{step}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
