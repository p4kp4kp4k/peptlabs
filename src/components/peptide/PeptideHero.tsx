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
        className="flex items-center gap-2 text-xs text-muted-foreground/60 hover:text-foreground mb-4 transition-all duration-200 group"
      >
        <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform duration-200" /> Voltar à Biblioteca
      </button>

      <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] card-holographic">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-background" />
        <div className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(ellipse 60% 40% at 80% 20%, hsl(var(--primary) / 0.12) 0%, transparent 50%),
                              radial-gradient(ellipse 40% 30% at 20% 80%, hsl(var(--accent) / 0.06) 0%, transparent 40%)`,
          }}
        />
        {/* Large faded name */}
        <div className="absolute inset-0 flex items-center justify-end pr-8 sm:pr-12 pointer-events-none select-none overflow-hidden">
          <span className="text-[4rem] sm:text-[6rem] lg:text-[8rem] font-black text-white/[0.02] leading-none tracking-tighter whitespace-nowrap font-display">
            {name}
          </span>
        </div>
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid opacity-20" />

        <div className="relative z-10 px-6 py-7 sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-lg shadow-lg shadow-primary/20">
              {category}
            </Badge>
            {classification && (
              <Badge variant="outline" className="text-[10px] border-white/[0.08] text-foreground/60 bg-white/[0.03] backdrop-blur-sm">
                {classification}
              </Badge>
            )}
            {evidence_level && (
              <Badge variant="outline" className="text-[10px] border-white/[0.08] text-foreground/60 bg-white/[0.03] backdrop-blur-sm">
                {evidence_level}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground mb-2 tracking-tight font-display">
            {name}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-2xl mb-2">{description}</p>
          )}
          {alternative_names && alternative_names.length > 0 && (
            <p className="text-[11px] text-muted-foreground/40">
              Também conhecido como: <span className="text-muted-foreground/60">{alternative_names.join(', ')}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
