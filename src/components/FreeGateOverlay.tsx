import { useNavigate } from "react-router-dom";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Crown, UserPlus, Star, Check, X } from "lucide-react";

interface Props {
  children: React.ReactNode;
  pageTitle?: string;
  /** Short description below the title */
  description?: string;
  /** Features comparison: [feature label, free value, premium value] */
  features?: string[];
  /** Detailed comparison table rows: [label, freeCol, premiumCol] */
  comparisonRows?: [string, string, string][];
  bypass?: boolean;
}

const DEFAULT_COMPARISON: [string, string, string][] = [
  ["Peptídeos na biblioteca", "Resumo de 7", "80+ completos"],
  ["Protocolos com dosagens", "✗", "✓"],
  ["Mecanismo de ação", "Resumo", "Detalhado"],
  ["Stacks sinérgicos", "✗", "✓"],
  ["Calculadora de reconstituição", "✗", "✓"],
  ["Verificador de interações", "✗", "✓"],
  ["Mapa de aplicação corporal", "✗", "✓"],
  ["Cronograma personalizado", "✗", "✓"],
  ["Novos artigos semanais", "✗", "✓"],
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
  const { isAdmin, isPro, isStarter } = useEntitlements();
  const { user } = useAuth();

  const hasAccess = bypass || isAdmin || isPro || isStarter;

  if (hasAccess) return <>{children}</>;

  return (
    <div className="relative isolate min-h-[560px]">
      {/* Blurred background content */}
      <div aria-hidden className="pointer-events-none select-none blur-[6px] brightness-[0.4] saturate-[0.2]">
        {children}
      </div>

      {/* Premium card overlay */}
      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto pt-8 pb-12 px-4">
        <div className="w-full max-w-xl rounded-2xl border border-border/60 bg-card shadow-2xl">
          {/* Header */}
          <div className="px-6 pt-8 pb-5 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <h2
              className="text-lg font-bold text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {pageTitle || "Conteúdo Premium"}
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {description ||
                (user
                  ? "Assine para desbloquear esta ferramenta e acessar todos os recursos avançados."
                  : "Cadastre-se gratuitamente para explorar a plataforma. Depois, assine para desbloquear todas as funcionalidades.")}
            </p>
          </div>

          {/* Social proof bar */}
          <div className="mx-6 mb-5 flex items-center justify-center gap-5 rounded-xl border border-border/40 bg-secondary/20 py-2.5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
              <UserPlus className="h-3 w-3 text-primary" /> 2.847+ membros
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" /> 4.9 de satisfação
            </span>
          </div>

          {/* Comparison table */}
          <div className="mx-6 mb-5 overflow-hidden rounded-xl border border-border/40">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_80px_100px] bg-secondary/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <div className="px-3 py-2.5">Recurso</div>
              <div className="px-2 py-2.5 text-center flex items-center justify-center gap-1">
                <Crown className="h-3 w-3 opacity-40" /> Grátis
              </div>
              <div className="px-2 py-2.5 text-center text-primary flex items-center justify-center gap-1">
                <Crown className="h-3 w-3" /> Premium
              </div>
            </div>

            {/* Table rows */}
            {comparisonRows.map(([label, free, premium], i) => (
              <div
                key={label}
                className={`grid grid-cols-[1fr_80px_100px] text-[11px] border-t border-border/30 ${
                  i % 2 === 0 ? "" : "bg-secondary/10"
                }`}
              >
                <div className="px-3 py-2.5 text-muted-foreground">{label}</div>
                <div className="px-2 py-2.5 flex items-center justify-center">
                  {free === "✗" ? (
                    <X className="h-3.5 w-3.5 text-muted-foreground/40" />
                  ) : free === "✓" ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <span className="text-muted-foreground/70 text-[10px]">{free}</span>
                  )}
                </div>
                <div className="px-2 py-2.5 flex items-center justify-center">
                  {premium === "✓" ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <span className="text-primary font-semibold text-[10px]">{premium}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mx-6 mb-5 rounded-xl border border-border/30 bg-secondary/10 p-4 text-center">
            <p className="text-[11px] italic leading-relaxed text-muted-foreground">
              "Uso diariamente no consultório. A plataforma mais completa para protocolos de peptídeos."
            </p>
            <p className="mt-1.5 text-[11px] font-semibold text-foreground">— Dr. Rafael M., Endocrinologista</p>
          </div>

          {/* CTA */}
          <div className="px-6 pb-6 space-y-2.5">
            <Button
              className="w-full gap-2 h-10 text-sm font-bold"
              onClick={() => navigate(user ? "/app/billing" : "/auth")}
            >
              <Crown className="h-4 w-4" />
              {user ? "Ver Planos" : "Criar Conta Gratuita"}
            </Button>
            <button
              onClick={() => navigate("/app/peptides")}
              className="w-full text-center text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1"
            >
              Continuar com visualização limitada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
