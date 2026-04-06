import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FlaskConical } from "lucide-react";

const categoryColors: Record<string, string> = {
  "Metabolismo": "from-amber-500/20 to-orange-500/20 text-amber-400",
  "Recuperação": "from-emerald-500/20 to-green-500/20 text-emerald-400",
  "Cognição": "from-violet-500/20 to-purple-500/20 text-violet-400",
  "Hormonal": "from-blue-500/20 to-cyan-500/20 text-blue-400",
  "Imunidade": "from-rose-500/20 to-pink-500/20 text-rose-400",
  "Anti-aging": "from-fuchsia-500/20 to-purple-500/20 text-fuchsia-400",
  "Estética": "from-pink-500/20 to-rose-500/20 text-pink-400",
  "Performance": "from-cyan-500/20 to-teal-500/20 text-cyan-400",
  "Saúde Sexual": "from-red-500/20 to-rose-500/20 text-red-400",
  "Sono": "from-indigo-500/20 to-blue-500/20 text-indigo-400",
  "Intestinal": "from-lime-500/20 to-green-500/20 text-lime-400",
  "Longevidade": "from-teal-500/20 to-emerald-500/20 text-teal-400",
  "Nootropicos": "from-violet-500/20 to-indigo-500/20 text-violet-400",
};

export function getCategoryColor(cat: string) {
  return categoryColors[cat] || "from-primary/20 to-primary/10 text-primary";
}

interface PeptideHeaderProps {
  name: string;
  category: string;
  classification?: string | null;
  description?: string | null;
  alternative_names?: string[] | null;
}

export default function PeptideHeader({ name, category, classification, description, alternative_names }: PeptideHeaderProps) {
  const navigate = useNavigate();
  const catColor = getCategoryColor(category);

  return (
    <div>
      <button
        onClick={() => navigate("/library")}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar à Biblioteca
      </button>

      <div className="flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${catColor}`}>
          <FlaskConical className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="outline" className="text-[10px] border-border/60">{category}</Badge>
            {classification && <span className="text-[10px] text-muted-foreground">{classification}</span>}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed max-w-2xl">{description}</p>
          )}
        </div>
      </div>

      {alternative_names && alternative_names.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Nomes Alternativos</p>
          <div className="flex flex-wrap gap-1.5">
            {alternative_names.map((n: string) => (
              <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
