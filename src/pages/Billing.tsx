import { CreditCard, Check, Sparkles, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/sempre",
    icon: Zap,
    features: [
      "Biblioteca de peptídeos",
      "Até 3 protocolos",
      "Calculadora básica",
      "Até 2 stacks",
    ],
    cta: "Plano Atual",
    active: true,
    highlight: false,
  },
  {
    name: "Premium",
    price: "R$ 147",
    period: "/mês",
    icon: Crown,
    features: [
      "Tudo do Gratuito",
      "Protocolos ilimitados",
      "Engine IA completa",
      "Comparador avançado",
      "Stack builder ilimitado",
      "Histórico completo",
      "Suporte prioritário",
    ],
    cta: "Fazer Upgrade",
    active: false,
    highlight: true,
  },
];

export default function Billing() {
  const { user } = useAuth();

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  const isPremium = subscription?.status === "premium" || subscription?.status === "active";

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Assinatura</h1>
        </div>
        <p className="text-sm text-muted-foreground">Gerencie seu plano e acesso premium.</p>
      </div>

      {/* Current status */}
      <Card className="mb-6 border-border/40">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            {isPremium ? <Crown className="h-5 w-5 text-primary" /> : <Zap className="h-5 w-5 text-primary" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Plano {isPremium ? "Premium" : "Gratuito"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isPremium
                ? `Ativo até ${subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString("pt-BR") : "—"}`
                : "Upgrade para acesso completo"}
            </p>
          </div>
          <Badge className="ml-auto text-[10px]" variant={isPremium ? "default" : "secondary"}>
            {isPremium ? "ATIVO" : "FREE"}
          </Badge>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`relative overflow-hidden border transition-all ${
              plan.highlight ? "border-primary/40 glow-primary" : "border-border/40"
            }`}
          >
            {plan.highlight && (
              <div className="absolute right-3 top-3">
                <Badge className="bg-primary text-primary-foreground text-[9px] gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> Recomendado
                </Badge>
              </div>
            )}
            <CardContent className="p-5">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <plan.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{plan.name}</h3>
              <div className="mt-1 mb-4">
                <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                <span className="text-xs text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="mb-5 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Check className="h-3 w-3 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full text-xs"
                variant={plan.highlight ? "default" : "outline"}
                disabled={plan.active && !isPremium}
              >
                {(isPremium && plan.highlight) ? "Plano Atual" : plan.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-center text-[10px] text-muted-foreground">
        Pagamento seguro via Stripe. Cancele quando quiser.
      </p>
    </div>
  );
}
