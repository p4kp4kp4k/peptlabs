import { Badge } from "@/components/ui/badge";
import { GitMerge, Layers } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

// Old format
interface OldInteraction { nome: string; status: string; descricao: string; }
interface OldInteractionsData { peptideos?: OldInteraction[]; outras_substancias?: OldInteraction[]; }

// New format
interface NewInteraction { tipo: string; peptideo: string; descricao: string; }

// Old stack format has descricao, new may not
interface Stack { nome: string; descricao?: string; peptideos: string[]; objetivo: string; }

interface SynergyTabProps {
  interactions?: Json | null;
  stacks?: Json | null;
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border/25 bg-card/80 p-4 sm:p-5">{children}</div>;
}

function SectionTitle({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2.5">
      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
        <Icon className="h-3.5 w-3.5" />
      </div>
      {children}
    </h3>
  );
}

function StatusBadge({ status }: { status: string }) {
  const upper = status.toUpperCase();
  if (upper.includes("SINÉR") || upper.includes("SINERG")) {
    return <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold px-2">SINÉRGICO</Badge>;
  }
  if (upper.includes("COMPATÍV") || upper.includes("COMPAT")) {
    return <Badge className="text-[10px] bg-orange-500/15 text-orange-400 border border-orange-500/25 font-bold px-2">COMPATÍVEL</Badge>;
  }
  if (upper.includes("COMPLEMENTAR")) {
    return <Badge className="text-[10px] bg-sky-500/15 text-sky-400 border border-sky-500/25 font-bold px-2">COMPLEMENTAR</Badge>;
  }
  if (upper.includes("MONITOR") || upper.includes("CAUTELA")) {
    return <Badge className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/25 font-bold px-2">MONITORAR</Badge>;
  }
  if (upper.includes("EVITAR")) {
    return <Badge className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/25 font-bold px-2">EVITAR</Badge>;
  }
  return <Badge variant="outline" className="text-[10px] font-bold px-2">{status}</Badge>;
}

// Normalize interactions into a uniform shape
function normalizeInteractions(data: Json | null | undefined): Array<{ nome: string; status: string; descricao: string }> {
  if (!data) return [];
  
  // New format: flat array with {tipo, peptideo, descricao}
  if (Array.isArray(data)) {
    return (data as unknown as NewInteraction[]).map(item => ({
      nome: item.peptideo || '',
      status: item.tipo || '',
      descricao: item.descricao || '',
    }));
  }
  
  // Old format: {peptideos: [...], outras_substancias: [...]}
  const old = data as unknown as OldInteractionsData;
  return [
    ...(old.peptideos || []),
    ...(old.outras_substancias || []),
  ];
}

export default function SynergyTab({ interactions, stacks }: SynergyTabProps) {
  const allInteractions = normalizeInteractions(interactions);
  const stacksData = stacks as unknown as Stack[] | null;

  if (allInteractions.length === 0 && (!stacksData || stacksData.length === 0)) {
    return (
      <SectionCard>
        <p className="text-xs text-muted-foreground italic">Informações de sinergia não disponíveis para este peptídeo.</p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Interações */}
      {allInteractions.length > 0 && (
        <SectionCard>
          <SectionTitle icon={GitMerge}>Interações com Outros Peptídeos</SectionTitle>

          {/* Header */}
          <div className="grid grid-cols-[minmax(160px,1fr)_110px_minmax(180px,1.5fr)] gap-x-5 border-b border-border/30 pb-2.5 mb-1 px-2">
            {["PEPTÍDEO", "STATUS", "DESCRIÇÃO"].map(h => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{h}</span>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-border/15">
            {allInteractions.map((item, i) => (
              <div key={i} className="grid grid-cols-[minmax(160px,1fr)_110px_minmax(180px,1.5fr)] gap-x-5 items-start py-4 px-2 hover:bg-secondary/20 transition-colors">
                <span className="text-[13px] font-semibold text-foreground leading-snug">{item.nome}</span>
                <div className="flex justify-start pt-0.5">
                  <StatusBadge status={item.status} />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.descricao}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Stacks */}
      {stacksData && stacksData.length > 0 && (
        <SectionCard>
          <SectionTitle icon={Layers}>Stacks Recomendados</SectionTitle>
          <div className="space-y-3">
            {stacksData.map((stack, i) => (
              <div key={i} className="p-4 rounded-lg bg-secondary/40 border border-border/15">
                <div className="flex items-start sm:items-center justify-between gap-2 mb-3 flex-col sm:flex-row">
                  <span className="text-sm font-bold text-foreground">{stack.nome}</span>
                  <Badge className="text-[10px] bg-primary/15 text-primary border border-primary/25 font-semibold shrink-0">{stack.objetivo}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {stack.peptideos.map((p) => (
                    <Badge key={p} className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-medium">{p}</Badge>
                  ))}
                </div>
                {stack.descricao && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{stack.descricao}</p>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
