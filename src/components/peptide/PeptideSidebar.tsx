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
    <div className="rounded-xl border border-border bg-card p-4 space-y-4 text-xs card-line">
      <div>
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 pb-2 border-b border-border">
          Fatos Rápidos
        </h3>
        <div className="space-y-3">
          {[
            { icon: Tag, label: "Classificação", value: classification, highlight: false },
            { icon: Activity, label: "Nível de Evidência", value: evidence_level, highlight: true },
            { icon: Clock, label: "Meia-Vida", value: half_life ? `~${half_life}` : null, highlight: false },
            { icon: RotateCcw, label: "Reconstituição", value: reconstitution, highlight: true },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/8">
                <item.icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider leading-none mb-1">{item.label}</p>
                <p className={`text-xs font-semibold leading-snug ${item.highlight ? 'text-primary' : 'text-foreground'}`}>
                  {item.value || "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {alternative_names && alternative_names.length > 0 && (
        <div className="pt-2 border-t border-border">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">Nomes Alternativos</h3>
          <div className="flex flex-wrap gap-1.5">
            {alternative_names.map((n) => (
              <Badge key={n} variant="outline" className="text-[10px] border-border text-muted-foreground font-normal px-2 py-0.5">
                {n}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-border">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">Categoria</h3>
        <Badge className="bg-primary/10 text-primary text-[10px] border border-primary/20 font-semibold px-2.5">{category}</Badge>
      </div>
    </div>
  );
}
