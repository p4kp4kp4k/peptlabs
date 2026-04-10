import { useNavigate } from "react-router-dom";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Crown, UserPlus, Star, CheckCircle2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  pageTitle?: string;
  features?: string[];
  bypass?: boolean;
}

const DEFAULT_FEATURES = [
  "Dosagem personalizada por indicação",
  "Guia de reconstituição passo a passo",
  "Stacks sinérgicos recomendados",
  "Mecanismo de ação detalhado",
  "Referências científicas com PubMed",
  "Protocolos completos com fases",
];

export default function FreeGateOverlay({ children, pageTitle, features = DEFAULT_FEATURES, bypass }: Props) {
  const navigate = useNavigate();
  const { isAdmin, isPro, isStarter } = useEntitlements();
  const { user } = useAuth();

  const hasAccess = bypass || isAdmin || isPro || isStarter;

  if (hasAccess) return <>{children}</>;

  return (
    <div className="relative isolate min-h-[560px]">
      <div aria-hidden className="pointer-events-none select-none blur-[6px] brightness-[0.45] saturate-[0.25]">
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-primary/20 bg-card/95 shadow-2xl backdrop-blur-xl">
          <div className="border-b border-border/60 px-6 py-6 text-center sm:px-8 sm:py-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <UserPlus className="h-7 w-7 text-primary" />
            </div>

            <h2 className="mb-2 text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {pageTitle || "Conteúdo Premium"}
            </h2>
            <p className="mx-auto max-w-lg text-sm text-muted-foreground">
              {user
                ? "Faça upgrade para desbloquear esta ferramenta completa e acessar todos os recursos avançados."
                : "Crie sua conta gratuitamente para explorar a plataforma e depois desbloqueie os recursos premium."}
            </p>
          </div>

          <div className="px-6 py-5 sm:px-8">
            <div className="mb-6 flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-border bg-secondary/20 px-4 py-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <UserPlus className="h-3.5 w-3.5 text-primary" />
                2.847+ membros
              </span>
              <span className="hidden h-3 w-px bg-border sm:block" />
              <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Star className="h-3.5 w-3.5 text-primary" />
                4.9 de satisfação
              </span>
            </div>

            <div className="mb-6 grid gap-2 sm:grid-cols-2">
              {features.map((item) => (
                <div key={item} className="flex items-start gap-2.5 rounded-2xl border border-border/60 bg-secondary/10 px-3 py-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border/60 bg-secondary/10 p-4 text-center">
              <p className="text-xs italic leading-relaxed text-muted-foreground">
                "Uso diariamente no consultório. A plataforma mais completa para protocolos de peptídeos."
              </p>
              <p className="mt-2 text-xs font-semibold text-foreground">— Dr. Rafael M., Endocrinologista</p>
            </div>
          </div>

          <div className="border-t border-border/60 px-6 py-5 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="h-11 flex-1 gap-2 text-sm font-bold" onClick={() => navigate(user ? "/app/billing" : "/auth")}>
                <Crown className="h-4 w-4" />
                {user ? "Ver Planos" : "Criar Conta Gratuita"}
              </Button>
              <Button variant="secondary" className="h-11 flex-1 text-sm font-medium" onClick={() => navigate("/app/peptides")}>
                Voltar à Biblioteca
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
