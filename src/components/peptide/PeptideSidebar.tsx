import { Tag, Activity, Clock, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  classification?: string | null;
  evidence_level?: string | null;
  half_life?: string | null;
  reconstitution?: string | null;
  alternative_names?: string[] | null;
  category: string;
}

export default function PeptideSidebar({ classification, evidence_level, half_life, reconstitution, alternative_names, category }: SidebarProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card/60 backdrop-blur-sm p-5 space-y-5 text-xs card-holographic">
      {/* FATOS RÁPIDOS */}
      <div>
        <h3 className="text-[10px] font-bold text-foreground/60 uppercase tracking-[0.15em] mb-4 pb-3 border-b border-white/[0.04] font-display">
          Fatos Rápidos
        </h3>
        <div className="space-y-4">
          {[
            { icon: Tag, label: "Classificação", value: classification, highlight: false },
            { icon: Activity, label: "Nível de Evidência", value: evidence_level, highlight: true },
            { icon: Clock, label: "Meia-Vida", value: half_life ? `~${half_life}` : null, highlight: false },
            { icon: RotateCcw, label: "Reconstituição", value: reconstitution, highlight: true },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10">
                <item.icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.12em] leading-none mb-1.5">{item.label}</p>
                <p className={`text-xs font-semibold leading-snug ${item.highlight ? 'text-primary' : 'text-foreground'}`}>
                  {item.value || "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NOMES ALTERNATIVOS */}
      {alternative_names && alternative_names.length > 0 && (
        <div className="pt-3 border-t border-white/[0.04]">
          <h3 className="text-[10px] font-bold text-foreground/60 uppercase tracking-[0.15em] mb-3 font-display">Nomes Alternativos</h3>
          <div className="flex flex-wrap gap-1.5">
            {alternative_names.map((n) => (
              <Badge key={n} variant="outline" className="text-[10px] border-white/[0.06] text-muted-foreground/70 font-normal px-2.5 py-0.5 bg-white/[0.02]">
                {n}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORIA */}
      <div className="pt-3 border-t border-white/[0.04]">
        <h3 className="text-[10px] font-bold text-foreground/60 uppercase tracking-[0.15em] mb-3 font-display">Categoria</h3>
        <Badge className="bg-primary/10 text-primary text-[10px] border border-primary/20 font-semibold px-3 py-1">{category}</Badge>
      </div>
    </div>
  );
}
