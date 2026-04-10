import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/ScrollReveal";

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/sempre",
    desc: "Para explorar a plataforma",
    features: [
      "Acesso a 1 peptídeo completo",
      "1 protocolo por mês",
      "1 comparação por mês",
      "1 cálculo de dosagem por mês",
      "1 stack por mês",
      "1 template por mês",
      "1 exportação PDF por mês",
      "1 verificação de interação por mês",
    ],
    cta: "Começar Grátis",
    variant: "outline" as const,
    highlight: false,
  },
  {
    name: "Starter",
    price: "R$ 39,90",
    period: "/mês",
    desc: "Para quem está começando",
    features: [
      "Biblioteca essencial de peptídeos",
      "Até 3 protocolos por mês",
      "Comparador (até 5 peptídeos)",
      "Calculadora ilimitada",
      "Stacks ilimitados",
      "Histórico de 7 dias",
      "Templates essenciais",
      "Exportação ilimitada (PDF básico)",
      "Verificação de interações ilimitada",
    ],
    cta: "Começar Agora",
    variant: "outline" as const,
    highlight: false,
  },
  {
    name: "PRO",
    price: "R$ 59,90",
    period: "/mês",
    desc: "Acesso completo à plataforma",
    features: [
      "Tudo do Starter",
      "Biblioteca completa (avançados)",
      "Protocolos ilimitados",
      "Comparador ilimitado",
      "Stack Builder PRO (até 10/mês)",
      "Calculadora avançada + presets",
      "Histórico ilimitado",
      "Templates premium + IA",
      "Export PRO (PDF premium)",
      "Contato direto com fornecedores",
      "Suporte prioritário",
    ],
    cta: "Fazer Upgrade",
    variant: "default" as const,
    highlight: true,
  },
];

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="relative border-y border-border/20 bg-card/10 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <h2 className="mb-2 text-center text-2xl font-bold text-foreground sm:text-3xl font-display">Escolha seu plano</h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">
            Desbloqueie acesso completo à plataforma com o plano ideal para você.
          </p>
        </ScrollReveal>
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan, idx) => (
            <ScrollReveal key={plan.name} delay={idx * 0.1}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`relative rounded-2xl p-6 backdrop-blur-sm transition-all ${
                  plan.highlight
                    ? "border-2 border-primary/50 bg-card/50 shadow-xl shadow-primary/[0.08]"
                    : "border border-border/20 bg-card/30"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="border-0 bg-primary text-primary-foreground text-[10px] px-3 shadow-lg shadow-primary/30">
                      🔥 Mais Escolhido
                    </Badge>
                  </div>
                )}
                <h3 className="text-base font-bold text-foreground font-display">{plan.name}</h3>
                <div className="mb-1 mt-2">
                  <span className="text-3xl font-bold text-foreground font-display">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mb-4 text-xs text-muted-foreground">{plan.desc}</p>
                <ul className="mb-5 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.variant}
                  className={`w-full text-xs h-10 transition-all ${
                    plan.highlight
                      ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                      : "border-foreground/30 text-foreground hover:border-primary/40 hover:bg-primary/[0.08]"
                  }`}
                  onClick={() => navigate("/auth")}
                >
                  {plan.cta}
                </Button>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
