import { useNavigate } from "react-router-dom";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Crown, UserPlus, Star, Check, X } from "lucide-react";

interface Props {
  children: React.ReactNode;
  pageTitle?: string;
  description?: string;
  features?: string[];
  comparisonRows?: [string, string, string][];
  bypass?: boolean;
}

const DEFAULT_COMPARISON: [string, string, string][] = [
  ["Peptídeos na biblioteca", "1 completo", "80+ completos"],
  ["Protocolos por mês", "1", "Ilimitados"],
  ["Comparações por mês", "1", "Ilimitadas"],
  ["Calculadora de dosagem", "1 / mês", "Ilimitada"],
  ["Stacks sinérgicos", "1 / mês", "Ilimitados"],
  ["Templates", "1 / mês", "Todos"],
  ["Exportação PDF", "1 / mês", "Ilimitada"],
  ["Verificação de interações", "1 / mês", "Ilimitada"],
  ["Mapa de aplicação corporal", "✗", "✓"],
  ["Histórico completo", "✗", "✓"],
  ["Referências PubMed", "✗", "✓"],
];

export default function FreeGateOverlay({
  children,
  pageTitle,
  description,
  features,
  comparisonRows = DEFAULT_COMPARISON,
  bypass,
}: Props) {
  const navigate = useNavigate();
  const { isAdmin, isPro } = useEntitlements();
  const { user } = useAuth();

  const hasAccess = bypass || isAdmin || isPro;

  if (hasAccess) return <>{children}</>;

  return (
    <div className="relative isolate min-h-[560px]">
      <div aria-hidden className="pointer-events-none select-none blur-[6px] brightness-[0.4] saturate-[0.2]">
        {children}
      </div>

      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto pt-4 sm:pt-8 pb-8 sm:pb-12 px-3 sm:px-4">
        <div className="w-full max-w-xl rounded-2xl border border-border/60 bg-card shadow-2xl">
          {/* Header */}
          <div className="px-4 sm:px-6 pt-5 sm:pt-8 pb-3 sm:pb-5 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/20">
              <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <h2
              className="text-base sm:text-lg font-bold text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {pageTitle || "Conteúdo Premium"}
            </h2>
            <p className="mt-1 sm:mt-1.5 text-[11px] sm:text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {description ||
                (user
                  ? "Assine para desbloquear esta ferramenta e acessar todos os recursos avançados."
                  : "Cadastre-se gratuitamente para explorar a plataforma. Depois, assine para desbloquear todas as funcionalidades.")}
            </p>
          </div>

          {/* Social proof bar */}
          <div className="mx-4 sm:mx-6 mb-3 sm:mb-5 flex items-center justify-center gap-3 sm:gap-5 rounded-lg sm:rounded-xl border border-border/40 bg-secondary/20 py-2 sm:py-2.5">
            <span className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold text-foreground">
              <UserPlus className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" /> 2.847+ membros
            </span>
            <span className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold text-foreground">
              <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-400 fill-amber-400" /> 4.9 de satisfação
            </span>
          </div>

          {/* Comparison table */}
          <div className="mx-4 sm:mx-6 mb-3 sm:mb-5 overflow-hidden rounded-lg sm:rounded-xl border border-border/40">
            <div className="grid grid-cols-[1fr_56px_72px] sm:grid-cols-[1fr_80px_100px] bg-secondary/30 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <div className="px-2 sm:px-3 py-2 sm:py-2.5">Recurso</div>
              <div className="px-1 sm:px-2 py-2 sm:py-2.5 text-center flex items-center justify-center gap-0.5 sm:gap-1">
                <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-40 hidden sm:block" /> Grátis
              </div>
              <div className="px-1 sm:px-2 py-2 sm:py-2.5 text-center text-primary flex items-center justify-center gap-0.5 sm:gap-1">
                <Crown className="h-2.5 w-2.5 sm:h-3 sm:w-3 hidden sm:block" /> Premium
              </div>
            </div>

            {comparisonRows.map(([label, free, premium], i) => (
              <div
                key={label}
                className={`grid grid-cols-[1fr_56px_72px] sm:grid-cols-[1fr_80px_100px] text-[10px] sm:text-[11px] border-t border-border/30 ${
                  i % 2 === 0 ? "" : "bg-secondary/10"
                }`}
              >
                <div className="px-2 sm:px-3 py-1.5 sm:py-2.5 text-muted-foreground leading-tight">{label}</div>
                <div className="px-1 sm:px-2 py-1.5 sm:py-2.5 flex items-center justify-center">
                  {free === "✗" ? (
                    <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground/40" />
                  ) : free === "✓" ? (
                    <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-muted-foreground/70 text-[9px] sm:text-[10px] text-center leading-tight">{free}</span>
                  )}
                </div>
                <div className="px-1 sm:px-2 py-1.5 sm:py-2.5 flex items-center justify-center">
                  {premium === "✓" ? (
                    <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                  ) : (
                    <span className="text-primary font-semibold text-[9px] sm:text-[10px] text-center leading-tight">{premium}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mx-4 sm:mx-6 mb-3 sm:mb-5 rounded-lg sm:rounded-xl border border-border/30 bg-secondary/10 p-3 sm:p-4 text-center hidden xs:block sm:block">
            <p className="text-[10px] sm:text-[11px] italic leading-relaxed text-muted-foreground">
              "Uso diariamente no consultório. A plataforma mais completa para protocolos de peptídeos."
            </p>
            <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-[11px] font-semibold text-foreground">— Dr. Rafael M., Endocrinologista</p>
          </div>

          {/* CTA */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2">
            <Button
              className="w-full gap-2 h-9 sm:h-10 text-xs sm:text-sm font-bold"
              onClick={() => navigate(user ? "/app/billing" : "/auth")}
            >
              <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {user ? "Ver Planos" : "Criar Conta Gratuita"}
            </Button>
            <button
              onClick={() => navigate("/app/peptides")}
              className="w-full text-center text-[10px] sm:text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1"
            >
              Continuar com visualização limitada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
