import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

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
      <div className="relative rounded-2xl overflow-hidden border border-border/20">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(215,35%,11%)] to-[hsl(220,40%,7%)]" />
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 20%, hsl(var(--primary) / 0.15) 0%, transparent 50%),
                              radial-gradient(circle at 20% 80%, hsl(var(--primary) / 0.08) 0%, transparent 40%)`,
          }}
        />
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.04)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E")`,
          }}
        />

      <div className="relative z-10 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <Badge className="bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-md">
              {category}
            </Badge>
            {classification && (
              <Badge variant="outline" className="text-[9px] border-white/10 text-white/60 bg-white/5 backdrop-blur-sm">
                {classification}
              </Badge>
            )}
            {evidence_level && (
              <Badge variant="outline" className="text-[9px] border-white/10 text-white/60 bg-white/5 backdrop-blur-sm">
                {evidence_level}
              </Badge>
            )}
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground mb-1 tracking-tight">
            {name}
          </h1>
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl mb-1.5">{description}</p>
          )}
          {alternative_names && alternative_names.length > 0 && (
            <p className="text-[10px] text-muted-foreground/70">
              Também conhecido como: <span className="text-muted-foreground">{alternative_names.join(', ')}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
