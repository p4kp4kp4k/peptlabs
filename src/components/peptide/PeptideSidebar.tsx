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
    <div className="space-y-5">
      {/* FATOS RÁPIDOS */}
      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Fatos Rápidos</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Tag className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Classificação</p>
              <p className="text-xs text-foreground font-medium">{classification || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Activity className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Nível de Evidência</p>
              <p className="text-xs text-amber-400 font-medium">{evidence_level || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Meia-Vida</p>
              <p className="text-xs text-foreground font-medium">~{half_life || "—"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <RotateCcw className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Reconstituição</p>
              <p className="text-xs text-amber-400 font-medium">{reconstitution || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* NOMES ALTERNATIVOS */}
      {alternative_names && alternative_names.length > 0 && (
        <div className="border-t border-border/30 pt-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Nomes Alternativos</h3>
          <div className="flex flex-wrap gap-1.5">
            {alternative_names.map((n) => (
              <Badge key={n} variant="outline" className="text-[10px] border-border/50">{n}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORIA */}
      <div className="border-t border-border/30 pt-4">
        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Categoria</h3>
        <Badge className="bg-primary/20 text-primary text-[10px] border border-primary/30">{category}</Badge>
      </div>
    </div>
  );
}
