import { Badge } from "@/components/ui/badge";
import { BookOpen, Beaker, ExternalLink } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface Reference { titulo: string; fonte: string; ano: number; pmid?: string; }

interface ResearchTabProps {
  mechanism?: string | null;
  mechanism_points?: string[] | null;
  evidence_level?: string | null;
  scientific_references?: Json | null;
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

export default function ResearchTab({ mechanism, mechanism_points, evidence_level, scientific_references }: ResearchTabProps) {
  const refs = scientific_references as unknown as Reference[] | null;

  return (
    <div className="space-y-4">
      {/* Mecanismo de Ação */}
      {(mechanism || (mechanism_points && mechanism_points.length > 0)) && (
        <SectionCard>
          <SectionTitle icon={Beaker}>Mecanismo de Ação</SectionTitle>
          {mechanism && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">{mechanism}</p>
          )}
          {mechanism_points && mechanism_points.length > 0 && (
            <div className="space-y-2">
              {mechanism_points.map((point, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border/15">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">{point}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Referências Científicas */}
      {refs && refs.length > 0 && (
        <SectionCard>
          <SectionTitle icon={BookOpen}>Referências Científicas</SectionTitle>
          <div className="space-y-2">
            {refs.map((ref, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/40 border border-border/15 group">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground font-semibold leading-relaxed mb-0.5">{ref.titulo}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {ref.fonte} · <span className="text-muted-foreground/70">{ref.ano}</span>
                    {ref.pmid && (
                      <> · <a href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">PubMed <ExternalLink className="h-2.5 w-2.5" /></a></>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {!mechanism && !mechanism_points?.length && !refs?.length && (
        <SectionCard>
          <p className="text-xs text-muted-foreground italic">Informações de pesquisa não disponíveis para este peptídeo.</p>
        </SectionCard>
      )}
    </div>
  );
}
