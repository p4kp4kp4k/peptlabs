import { useNavigate } from "react-router-dom";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, UserPlus, Star, CheckCircle2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  /** Page title shown in the modal */
  pageTitle?: string;
  /** Custom features list */
  features?: string[];
  /** Pages that should NOT be gated (e.g. billing, settings) */
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
    <>
      {/* Blurred content behind */}
      <div className="pointer-events-none select-none blur-[6px] brightness-[0.4] saturate-[0.2]">
        {children}
      </div>

      {/* Gate modal */}
      <Dialog open onOpenChange={() => navigate("/app/peptides")}>
        <DialogContent className="max-w-md border-primary/15 bg-card p-0 overflow-hidden [&>button]:hidden">
          <div className="p-6 sm:p-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
              <UserPlus className="h-7 w-7 text-primary" />
            </div>

            <h2 className="text-lg font-bold text-foreground mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {pageTitle || "Conteúdo Exclusivo"}
            </h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-xs">
              {user
                ? "Faça upgrade para desbloquear todas as ferramentas e protocolos completos."
                : "Crie sua conta e assine para acessar todas as funcionalidades."}
            </p>

            {/* Social proof */}
            <div className="flex items-center justify-center gap-4 rounded-full border border-border bg-secondary/30 px-5 py-2 mb-5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5 text-primary" /> 2.847+ membros
              </span>
              <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> 4.9
              </span>
            </div>

            {/* Features */}
            <div className="w-full mb-5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                O que você desbloqueia:
              </p>
              <ul className="space-y-2 text-left">
                {features.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Testimonial */}
            <div className="w-full rounded-xl border border-border bg-secondary/20 p-4 mb-5">
              <p className="text-xs text-muted-foreground italic leading-relaxed">
                "Uso diariamente no consultório. A plataforma mais completa para protocolos de peptídeos."
              </p>
              <p className="text-xs font-semibold text-foreground mt-2">— Dr. Rafael M., Endocrinologista</p>
            </div>

            {/* CTA */}
            <Button
              className="w-full gap-2 h-11 text-sm font-bold"
              onClick={() => navigate(user ? "/app/billing" : "/auth")}
            >
              <Crown className="h-4 w-4" />
              {user ? "Ver Planos" : "Criar Conta Gratuita"}
            </Button>
            <p className="text-[10px] text-muted-foreground/60 mt-2">
              ⏱ Garantia 7 dias · Grátis para criar
            </p>

            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-muted-foreground"
              onClick={() => navigate("/app/peptides")}
            >
              Voltar à Biblioteca
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
