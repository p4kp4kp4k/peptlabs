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
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors group"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" /> Voltar à Biblioteca
      </button>

      <div className="relative rounded-2xl overflow-hidden border border-border/20">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(215,35%,11%)] to-[hsl(220,40%,7%)]" />
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 20%, hsl(var(--primary) / 0.2) 0%, transparent 50%),
                              radial-gradient(circle at 20% 80%, hsl(var(--primary) / 0.1) 0%, transparent 40%)`,
          }}
        />
        {/* Large faded name */}
        <div className="absolute inset-0 flex items-center justify-end pr-6 sm:pr-10 pointer-events-none select-none overflow-hidden">
          <span className="text-[4rem] sm:text-[6rem] lg:text-[7rem] font-black text-white/[0.04] leading-none tracking-tighter whitespace-nowrap">
            {name}
          </span>
        </div>
        <div className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='g' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='rgba(255,255,255,0.04)' stroke-width='1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23g)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 px-4 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-sm">
              {category}
            </Badge>
            {classification && (
              <Badge variant="outline" className="text-[10px] border-white/15 text-white/70 bg-white/5 backdrop-blur-sm">
                {classification}
              </Badge>
            )}
            {evidence_level && (
              <Badge variant="outline" className="text-[10px] border-white/15 text-white/70 bg-white/5 backdrop-blur-sm">
                {evidence_level}
              </Badge>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground mb-1.5 tracking-tight">
            {name}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mb-1.5">{description}</p>
          )}
          {alternative_names && alternative_names.length > 0 && (
            <p className="text-[10px] sm:text-xs text-muted-foreground/60">
              Também conhecido como: <span className="text-muted-foreground/80">{alternative_names.join(', ')}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
