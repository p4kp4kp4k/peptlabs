import { CreditCard, Check, Crown, Zap, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEntitlements } from "@/hooks/useEntitlements";

const plans = [
  {
    id: "free",
    name: "Gratuito",
    price: "R$ 0",
    period: "/sempre",
    icon: Shield,
    description: "Para explorar a plataforma",
    features: [
      "Visualizar biblioteca (apenas essenciais)",
      "Consultar informações básicas",
      "Acesso limitado ao app",
    ],
    highlight: false,
    cta: "Plano Atual",
  },
  {
    id: "starter",
    name: "Starter",
    price: "R$ 39,90",
    period: "/mês",
    icon: Zap,
    description: "Para quem está começando",
    features: [
      "Biblioteca essencial de peptídeos",
      "Até 3 protocolos por mês",
      "Comparador (até 5 por comparação)",
      "Calculadora básica + salvar cálculo",
      "Histórico de 7 dias",
      "Templates essenciais",
      "Export básico (PDF simples)",
      "Suporte por e-mail em até 48h",
    ],
    highlight: false,
    cta: "Começar Agora",
  },
  {
    id: "pro",
    name: "PRO",
    price: "R$ 59,90",
    period: "/mês",
    icon: Crown,
    description: "Acesso completo à plataforma",
    features: [
      "Tudo do Starter",
      "Biblioteca completa (avançados inclusos)",
      "Protocolos ilimitados",
      "Comparador ilimitado",
      "Stack Builder PRO completo",
      "Calculadora avançada + presets",
      "Histórico ilimitado",
      "Templates premium + recomendações IA",
      "Export PRO (PDF premium c/ timeline)",
      "Suporte prioritário",
    ],
    highlight: true,
    cta: "Fazer Upgrade",
  },
];

export default function Billing() {
  const { plan, isActive, isAdmin, currentPeriodEnd } = useEntitlements();

  const currentPlan = isAdmin ? "pro" : (isActive ? plan : "free");

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">
          Escolha seu plano
        </h1>
        <p className="text-sm text-muted-foreground">
          Desbloqueie acesso completo à plataforma com o plano ideal para você.
        </p>
      </div>

      {/* Current status */}
      <Card className="mb-8 border-border/40 max-w-lg mx-auto">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            {currentPlan === "pro" ? <Crown className="h-5 w-5 text-primary" /> :
             currentPlan === "starter" ? <Zap className="h-5 w-5 text-primary" /> :
             <Shield className="h-5 w-5 text-primary" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Plano {currentPlan === "pro" ? "PRO" : currentPlan === "starter" ? "Starter" : "Gratuito"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {currentPlan !== "free" && currentPeriodEnd
                ? `Ativo até ${new Date(currentPeriodEnd).toLocaleDateString("pt-BR")}`
                : currentPlan === "free" ? "Faça upgrade para desbloquear recursos" : "Plano ativo"}
            </p>
          </div>
          <Badge className="ml-auto text-[10px]" variant={currentPlan !== "free" ? "default" : "secondary"}>
            {currentPlan === "pro" ? "PRO" : currentPlan === "starter" ? "STARTER" : "FREE"}
          </Badge>
        </CardContent>
      </Card>

      {/* Plans grid */}
      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = currentPlan === p.id;
          return (
            <Card
              key={p.id}
              className={`relative overflow-hidden border transition-all ${
                p.highlight
                  ? "border-primary/50 shadow-lg shadow-primary/10 scale-[1.02]"
                  : "border-border/40"
              }`}
            >
              {p.highlight && (
                <div className="absolute right-3 top-3">
                  <Badge className="bg-primary text-primary-foreground text-[9px] gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> Mais Escolhido
                  </Badge>
                </div>
              )}
              <CardContent className="p-5 flex flex-col h-full">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <p.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground">{p.name}</h3>
                <p className="text-[11px] text-muted-foreground mb-3">{p.description}</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold text-foreground">{p.price}</span>
                  <span className="text-xs text-muted-foreground">{p.period}</span>
                </div>
                <ul className="mb-5 space-y-2.5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                      <Check className="h-3 w-3 shrink-0 text-primary mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full text-xs"
                  variant={p.highlight ? "default" : "outline"}
                  disabled={isCurrent}
                >
                  {isCurrent ? "Plano Atual" : p.cta}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-8 text-center text-[10px] text-muted-foreground">
        Pagamento seguro. Cancele quando quiser. Sem fidelidade.
      </p>
    </div>
  );
}
