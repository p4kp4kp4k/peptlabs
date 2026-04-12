import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Crown, UserPlus, Star, X } from "lucide-react";

interface Props {
  children: React.ReactNode;
  pageTitle?: string;
  description?: string;
  bypass?: boolean;
}

export default function FreeGateOverlay({
  children,
  pageTitle,
  description,
  bypass,
}: Props) {
  const navigate = useNavigate();
  const { isAdmin, isPro } = useEntitlements();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  const hasAccess = bypass || isAdmin || isPro;

  if (hasAccess || dismissed) return <>{children}</>;

  return (
    <div className="relative isolate min-h-[400px]">
      <div aria-hidden className="pointer-events-none select-none blur-[6px] brightness-[0.4] saturate-[0.2]">
        {children}
      </div>

      <div className="absolute inset-0 flex items-start justify-center pt-6 sm:pt-12 px-3 sm:px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card shadow-2xl relative">
          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground/60 hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="px-5 pt-6 pb-3 text-center">
            <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <h2
              className="text-sm font-bold text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {pageTitle || "Crie sua conta para acessar"}
            </h2>
            <p className="mt-1 text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
              {description ||
                (user
                  ? "Assine para desbloquear esta ferramenta."
                  : "Cadastre-se gratuitamente para explorar a plataforma.")}
            </p>
          </div>

          {/* Social proof */}
          <div className="mx-5 mb-3 flex items-center justify-center gap-4 rounded-lg border border-border/40 bg-secondary/20 py-2">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-foreground">
              <UserPlus className="h-2.5 w-2.5 text-primary" /> 2.847+ membros
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-foreground">
              <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" /> 4.9 satisfação
            </span>
          </div>

          {/* Quick benefits */}
          <div className="mx-5 mb-3 space-y-1">
            {[
              "Acesso a 1 peptídeo completo",
              "1 protocolo, comparação e cálculo por mês",
              "Explore toda a plataforma gratuitamente",
            ].map((b) => (
              <div key={b} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <Crown className="h-2.5 w-2.5 text-primary shrink-0" />
                {b}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-5 pb-5 space-y-1.5">
            <Button
              className="w-full gap-2 h-9 text-xs font-bold"
              onClick={() => navigate(user ? "/app/billing" : "/auth")}
            >
              <Crown className="h-3.5 w-3.5" />
              {user ? "Ver Planos" : "Criar Conta Gratuita"}
            </Button>
            <button
              onClick={() => setDismissed(true)}
              className="w-full text-center text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1"
            >
              Continuar com visualização limitada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
