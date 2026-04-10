import { useNavigate } from "react-router-dom";
import { Check, Crown, Shield, Zap, Gift } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/ScrollReveal";

const plans = [
  {
    name: "Explorer",
    price: "R$ 0",
    period: "/sempre",
    icon: Shield,
    desc: "Explore o poder dos peptídeos",
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
    highlight: false,
  },
  {
    name: "PRO Mensal",
    price: "R$ 59,90",
    period: "/mês",
    icon: Zap,
    desc: "Acesso total. Cancele quando quiser.",
    features: [
      "Biblioteca completa (78+ peptídeos)",
      "Protocolos e comparações ilimitados",
      "Calculadora avançada + presets",
      "Stacks sinérgicos exclusivos",
      "Histórico e export ilimitados",
      "Templates premium + IA",
      "Body Map interativo",
      "Suporte prioritário",
    ],
    cta: "Ativar PRO Mensal",
    highlight: false,
  },
  {
    name: "PRO Vitalício",
    price: "R$ 397",
    period: "único",
    icon: Crown,
    desc: "Pague uma vez. Use para sempre.",
    originalPrice: "R$ 794",
    discount: "-50% OFF",
    features: [
      "Tudo do PRO Mensal, mais:",
      "Acesso vitalício — pague uma vez, use para sempre",
      "Contato direto com fornecedores parceiros",
      "Atualizações e novos peptídeos inclusos",
      "Guias práticos atualizados mensalmente",
      "Stacks ilimitados (sem cap de 10/mês)",
      "Export PRO com timeline visual",
      "Suporte VIP dedicado",
    ],
    cta: "Garantir Acesso Vitalício",
    highlight: true,
  },
];

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="relative border-y border-border/20 bg-card/10 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <h2 className="mb-2 text-center text-2xl font-bold text-foreground sm:text-3xl font-display">
            Desbloqueie acesso VIP aos melhores protocolos
          </h2>
          <p className="mb-10 text-center text-sm text-muted-foreground">
            Escolha o acesso que transforma sua prática clínica e seus resultados.
          </p>
        </ScrollReveal>
        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan, idx) => (
            <ScrollReveal key={plan.name} delay={idx * 0.1}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`relative rounded-2xl overflow-hidden transition-all flex flex-col ${
                  plan.highlight
                    ? "border-2 border-primary/50 bg-card/50 shadow-xl shadow-primary/[0.08]"
                    : "border border-border/20 bg-card/30"
                }`}
              >
                {plan.highlight && (
                  <div className="bg-primary text-primary-foreground text-center py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <Crown className="h-3 w-3" /> Mais Escolhido
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <plan.icon className={`h-4 w-4 ${plan.highlight ? "text-primary" : "text-muted-foreground"}`} />
                    <h3 className="text-base font-bold text-foreground font-display">{plan.name}</h3>
                  </div>

                  {"originalPrice" in plan && plan.originalPrice && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-muted-foreground line-through">{plan.originalPrice}</span>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                        {plan.discount}
                      </Badge>
                    </div>
                  )}

                  <div className="mb-1">
                    <span className="text-3xl font-bold text-foreground font-display">{plan.price}</span>
                    <span className="text-sm text-muted-foreground ml-1">/{plan.period}</span>
                  </div>
                  <p className="mb-4 text-xs text-muted-foreground">{plan.desc}</p>

                  {plan.highlight && (
                    <p className="text-[10px] text-emerald-400 mb-3 font-medium flex items-center gap-1">
                      <Gift className="h-3 w-3 shrink-0" /> Economize R$ 321,80 vs mensal no 1º ano
                    </p>
                  )}

                  <ul className="mb-5 space-y-2 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${plan.highlight ? "text-primary" : "text-primary/60"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.highlight ? "default" : "outline"}
                    className={`w-full text-xs h-10 transition-all ${
                      plan.highlight
                        ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                        : "border-foreground/30 text-foreground hover:border-primary/40 hover:bg-primary/[0.08]"
                    }`}
                    onClick={() => navigate("/auth")}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
