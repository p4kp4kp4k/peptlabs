import { useNavigate, useLocation } from "react-router-dom";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useAuth } from "@/hooks/useAuth";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Crown, UserPlus, Star, Check, X, Calculator, Syringe, Layers, FileText, BookOpen, MapPin, Zap, ArrowLeftRight } from "lucide-react";

interface Props {
  children: React.ReactNode;
  pageTitle?: string;
  description?: string;
  features?: string[];
  comparisonRows?: [string, string, string][];
  bypass?: boolean;
}

// Contextual messages for different pages
const PAGE_CONTEXTS: Record<string, {
  title: string;
  description: string;
  icon: React.ElementType;
  highlightFeature?: string;
}> = {
  "/app/peptides": {
    title: "Biblioteca de Peptídeos",
    description: "Explore 80+ peptídeos com dados científicos, mecanismos de ação e protocolos detalhados.",
    icon: Syringe,
    highlightFeature: "1 peptídeo completo grátis",
  },
  "/app/calculator": {
    title: "Calculadora de Dosagem",
    description: "Calcule reconstituição, dosagem e volumes com precisão para seus protocolos.",
    icon: Calculator,
    highlightFeature: "1 cálculo/mês grátis",
  },
  "/app/stacks": {
    title: "Stacks Sinérgicos",
    description: "Combinações otimizadas de peptídeos para objetivos específicos com timing e dosagens.",
    icon: Layers,
    highlightFeature: "1 stack/mês grátis",
  },
  "/app/templates": {
    title: "Templates de Protocolos",
    description: "Modelos prontos de protocolos clinicamente revisados para diferentes objetivos.",
    icon: FileText,
    highlightFeature: "1 template/mês grátis",
  },
  "/app/learn": {
    title: "Centro de Aprendizado",
    description: "Guia completo sobre peptídeos: fundamentos, aplicações e referências científicas.",
    icon: BookOpen,
    highlightFeature: "Conteúdo básico grátis",
  },
  "/app/body-map": {
    title: "Mapa Corporal",
    description: "Visualize locais de aplicação e dosagens recomendadas por região do corpo.",
    icon: MapPin,
    highlightFeature: "Apenas PRO",
  },
  "/app/compare": {
    title: "Comparador de Peptídeos",
    description: "Compare múltiplos peptídeos lado a lado: mecanismos, meia-vida, aplicações.",
    icon: ArrowLeftRight,
    highlightFeature: "1 comparação/mês grátis",
  },
  "/app/interactions": {
    title: "Verificador de Interações",
    description: "Analise interações entre peptíltides e identifique sinergias ou contraindicações.",
    icon: Zap,
    highlightFeature: "1 verificação/mês grátis",
  },
  "/app/dashboard": {
    title: "Dashboard",
    description: "Acompanhe seus protocolos, histórico e acesso rápido às ferramentas.",
    icon: Crown,
    highlightFeature: "Visão limitada grátis",
  },
  "/app/history": {
    title: "Histórico Completo",
    description: "Registro completo de protocolos, cálculos e pesquisas realizadas na plataforma.",
    icon: Crown,
    highlightFeature: "Apenas PRO",
  },
  "/app/finder": {
    title: "Finder Inteligente",
    description: "Encontre peptídeos por objetivo, mecanismo ou condição com filtros avançados.",
    icon: Syringe,
    highlightFeature: "Busca limitada grátis",
  },
};

const DEFAULT_COMPARISON: [string, string, string][] = [
  ["Peptídeos na biblioteca", "1", "80+"],
  ["Protocolos/mês", "1", "Ilimitados"],
  ["Comparações/mês", "1", "Ilimitadas"],
  ["Calculadora", "1/mês", "Ilimitada"],
  ["Stacks/mês", "1", "Ilimitados"],
  ["Templates/mês", "1", "Todos"],
  ["Exportação PDF", "1/mês", "Ilimitada"],
  ["Interações/mês", "1", "Ilimitada"],
  ["Mapa corporal", "—", "✓"],
  ["Histórico", "—", "✓"],
  ["PubMed refs", "—", "✓"],
];

function getPageContext(pathname: string) {
  // Find exact match or closest parent route
  const exactMatch = PAGE_CONTEXTS[pathname];
  if (exactMatch) return exactMatch;
  
  // Check for parent routes (e.g., /app/peptides/something -> /app/peptides)
  const parentRoute = Object.keys(PAGE_CONTEXTS).find(route => pathname.startsWith(route + "/"));
  if (parentRoute) return PAGE_CONTEXTS[parentRoute];
  
  return null;
}

export default function FreeGateOverlay({
  children,
  pageTitle: pageTitleProp,
  description: descriptionProp,
  features,
  comparisonRows = DEFAULT_COMPARISON,
  bypass,
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isPro } = useEntitlements();
  const { user } = useAuth();
  const [isDismissed, setIsDismissed] = useState(false);

  // Get contextual info based on current route
  const pageContext = useMemo(() => getPageContext(location.pathname), [location.pathname]);
  const PageIcon = pageContext?.icon || UserPlus;
  const pageTitle = pageTitleProp || pageContext?.title || "Conteúdo Premium";
  const description = descriptionProp || pageContext?.description || "Cadastre-se gratuitamente para explorar a plataforma completa de peptídeos.";
  const highlightFeature = pageContext?.highlightFeature;

  const hasAccess = bypass || isAdmin || isPro;

  if (hasAccess || isDismissed) return <>{children}</>;
  return (
    <div className="relative isolate min-h-[400px]">
      <div aria-hidden className="pointer-events-none select-none blur-[4px] brightness-[0.5] saturate-[0.3]">
        {children}
      </div>

      <div className="absolute inset-0 flex items-start justify-center overflow-y-auto pt-3 px-3">
        <div className="w-full max-w-md rounded-xl border border-border/60 bg-card shadow-2xl relative">
          {/* Close button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors z-10"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="px-5 pt-5 pb-3 text-center">
            <div className="mx-auto mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <PageIcon className="h-5 w-5 text-primary" />
            </div>
            <h2
              className="text-base font-bold text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {pageTitle}
            </h2>
            <p className="mt-1 text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
              {description}
            </p>
            {highlightFeature && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-medium text-primary">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {highlightFeature}
              </div>
            )}
          </div>

          {/* Social proof bar */}
          <div className="mx-5 mb-3 flex items-center justify-center gap-4 rounded-lg border border-border/40 bg-secondary/20 py-2">
            <span className="flex items-center gap-1 text-[10px] font-semibold text-foreground">
              <UserPlus className="h-2.5 w-2.5 text-primary" /> 2.847+ membros
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-foreground">
              <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" /> 4.9
            </span>
          </div>

          {/* Comparison table */}
          <div className="mx-5 mb-3 overflow-hidden rounded-lg border border-border/40">
            <div className="grid grid-cols-[1fr_48px_64px] bg-secondary/30 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              <div className="px-2 py-1.5">Recurso</div>
              <div className="px-1 py-1.5 text-center">Grátis</div>
              <div className="px-1 py-1.5 text-center text-primary">PRO</div>
            </div>

            {comparisonRows.map(([label, free, premium], i) => (
              <div
                key={label}
                className={`grid grid-cols-[1fr_48px_64px] text-[10px] border-t border-border/30 ${
                  i % 2 === 0 ? "" : "bg-secondary/10"
                }`}
              >
                <div className="px-2 py-1 text-muted-foreground leading-tight">{label}</div>
                <div className="px-1 py-1 flex items-center justify-center">
                  {free === "✗" ? (
                    <span className="text-muted-foreground/30">—</span>
                  ) : free === "✓" ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <span className="text-muted-foreground/70 text-[9px]">{free}</span>
                  )}
                </div>
                <div className="px-1 py-1 flex items-center justify-center">
                  {premium === "✓" ? (
                    <Check className="h-3 w-3 text-primary" />
                  ) : (
                    <span className="text-primary font-semibold text-[9px]">{premium}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mx-5 mb-3 rounded-lg border border-border/30 bg-secondary/10 p-2.5 text-center">
            <p className="text-[10px] italic leading-relaxed text-muted-foreground">
              "Uso diariamente no consultório."
            </p>
            <p className="mt-0.5 text-[10px] font-semibold text-foreground">— Dr. Rafael M.</p>
          </div>

          {/* CTA */}
          <div className="px-5 pb-4 space-y-2">
            <Button
              className="w-full gap-2 h-9 text-xs font-bold"
              onClick={() => navigate(user ? "/app/billing" : "/auth")}
            >
              <Crown className="h-3.5 w-3.5" />
              {user ? "Ver Planos" : "Criar Conta Gratuita"}
            </Button>
            <button
              onClick={() => setIsDismissed(true)}
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
