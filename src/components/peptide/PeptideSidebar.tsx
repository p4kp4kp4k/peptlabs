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
    <div className="rounded-xl border border-border/30 bg-card/60 backdrop-blur-sm p-3.5 space-y-3.5 text-[11px]">
      {/* FATOS RÁPIDOS */}
      <div>
        <h3 className="text-[10px] font-bold text-foreground uppercase tracking-widest mb-2.5 pb-1.5 border-b border-border/30">
          Fatos Rápidos
        </h3>
        <div className="space-y-2.5">
          {[
            { icon: Tag, label: "Classificação", value: classification, highlight: false },
            { icon: Activity, label: "Nível de Evidência", value: evidence_level, highlight: true },
            { icon: Clock, label: "Meia-Vida", value: half_life ? `~${half_life}` : null, highlight: false },
            { icon: RotateCcw, label: "Reconstituição", value: reconstitution, highlight: true },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2.5">
              <item.icon className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none mb-1">{item.label}</p>
                <p className={`text-xs font-semibold ${item.highlight ? 'text-primary' : 'text-foreground'}`}>
                  {item.value || "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NOMES ALTERNATIVOS */}
      {alternative_names && alternative_names.length > 0 && (
        <div className="pt-1 border-t border-border/30">
          <h3 className="text-[11px] font-bold text-foreground uppercase tracking-widest mb-3">Nomes Alternativos</h3>
          <div className="flex flex-wrap gap-1.5">
            {alternative_names.map((n) => (
              <Badge key={n} variant="outline" className="text-[10px] border-border/40 text-muted-foreground font-normal">
                {n}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORIA */}
      <div className="pt-1 border-t border-border/30">
        <h3 className="text-[11px] font-bold text-foreground uppercase tracking-widest mb-3">Categoria</h3>
        <Badge className="bg-primary/15 text-primary text-[10px] border border-primary/25 font-semibold">{category}</Badge>
      </div>
    </div>
  );
}
