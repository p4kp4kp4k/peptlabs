import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { getCategoryColor } from "./peptideUtils";

interface PeptideHeroProps {
  name: string;
  category: string;
  classification?: string | null;
  description?: string | null;
  evidence_level?: string | null;
  alternative_names?: string[] | null;
}

export default function PeptideHero({ name, category, classification, description, evidence_level, alternative_names }: PeptideHeroProps) {
  const navigate = useNavigate();

  return (
    <div>
      <button
        onClick={() => navigate("/library")}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar à Biblioteca
      </button>

      {/* Hero Banner */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(220,30%,12%)] to-[hsl(220,40%,8%)] p-6 sm:p-8 border border-border/30">
        {/* Decorative bg */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        
        <div className="relative z-10">
          {/* Category badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge className="bg-primary/90 text-primary-foreground text-[10px] font-semibold">{category}</Badge>
            {classification && (
              <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground">{classification}</Badge>
            )}
            {evidence_level && (
              <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground">{evidence_level}</Badge>
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {name}
          </h1>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-3">{description}</p>
          )}

          {/* Alt names */}
          {alternative_names && alternative_names.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Também conhecido como: {alternative_names.join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
