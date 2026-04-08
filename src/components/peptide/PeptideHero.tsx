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

      <div className="relative rounded-xl overflow-hidden border border-border card-line">
        <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-background" />
        <div className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 20%, hsl(var(--primary) / 0.1) 0%, transparent 50%),
                              radial-gradient(circle at 20% 80%, hsl(var(--primary) / 0.05) 0%, transparent 40%)`,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-end pr-6 sm:pr-10 pointer-events-none select-none overflow-hidden">
          <span className="text-[4rem] sm:text-[6rem] lg:text-[7rem] font-black text-white/[0.02] leading-none tracking-tighter whitespace-nowrap">
            {name}
          </span>
        </div>

        <div className="relative z-10 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
            <Badge className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md">
              {category}
            </Badge>
            {classification && (
              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground bg-secondary/50">
                {classification}
              </Badge>
            )}
            {evidence_level && (
              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground bg-secondary/50">
                {evidence_level}
              </Badge>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground mb-1 tracking-tight">
            {name}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mb-1">{description}</p>
          )}
          {alternative_names && alternative_names.length > 0 && (
            <p className="text-[10px] text-muted-foreground/50">
              Também conhecido como: <span className="text-muted-foreground/70">{alternative_names.join(', ')}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
