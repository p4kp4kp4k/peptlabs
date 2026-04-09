import { CreditCard, Check, Crown, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEntitlements } from "@/hooks/useEntitlements";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "R$ 39,90",
    period: "/mês",
    icon: Zap,
    features: [
      "Biblioteca essencial de peptídeos",
      "Até 3 protocolos por mês",
      "Comparador (até 5 por comparação)",
      "Calculadora básica + salvar cálculo",
      "Histórico de 7 dias",
      "Templates essenciais",
      "Export básico (PDF simples)",
    ],
    highlight: false,
  },
  {
    id: "pro",
    name: "PRO",
    price: "R$ 59,90",
    period: "/mês",
    icon: Crown,
    features: [
      "Tudo do Starter",
      "Biblioteca completa (avançados inclusos)",
      "Protocolos ilimitados",
      "Comparador ilimitado",
      "Stack Builder PRO completo",
      "Calculadora avançada + presets",
      "Histórico ilimitado",
      "Templates premium + recomendações",
      "Export PRO (PDF premium c/ timeline)",
    ],
    highlight: true,
  },
];

export default function Billing() {
  const { plan, isActive, isAdmin, currentPeriodEnd } = useEntitlements();

  const currentPlan = isAdmin ? "pro" : (isActive ? plan : "free");

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Assinatura</h1>
        </div>
        <p className="text-sm text-muted-foreground">Gerencie seu plano e acesso.</p>
      </div>

      {/* Current status */}
      <Card className="mb-6 border-border/40">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            {currentPlan === "pro" ? <Crown className="h-5 w-5 text-primary" /> : <Zap className="h-5 w-5 text-primary" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Plano {currentPlan === "pro" ? "PRO" : currentPlan === "starter" ? "Starter" : "Sem plano"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {currentPlan !== "free" && currentPeriodEnd
                ? `Ativo até ${new Date(currentPeriodEnd).toLocaleDateString("pt-BR")}`
                : "Escolha um plano para começar"}
            </p>
          </div>
          <Badge className="ml-auto text-[10px]" variant={currentPlan !== "free" ? "default" : "secondary"}>
            {currentPlan === "pro" ? "PRO" : currentPlan === "starter" ? "STARTER" : "SEM PLANO"}
          </Badge>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((p) => {
          const isCurrent = currentPlan === p.id;
          return (
            <Card
              key={p.id}
              className={`relative overflow-hidden border transition-all ${
                p.highlight ? "border-primary/40 glow-primary" : "border-border/40"
              }`}
            >
              {p.highlight && (
                <div className="absolute right-3 top-3">
                  <Badge className="bg-primary text-primary-foreground text-[9px] gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> Recomendado
                  </Badge>
                </div>
              )}
              <CardContent className="p-5">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <p.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
                <div className="mt-1 mb-4">
                  <span className="text-2xl font-bold text-foreground">{p.price}</span>
                  <span className="text-xs text-muted-foreground">{p.period}</span>
                </div>
                <ul className="mb-5 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Check className="h-3 w-3 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full text-xs"
                  variant={p.highlight ? "default" : "outline"}
                  disabled={isCurrent}
                >
                  {isCurrent ? "Plano Atual" : "Escolher Plano"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[10px] text-muted-foreground">
        Pagamento seguro. Cancele quando quiser.
      </p>
    </div>
  );
}
