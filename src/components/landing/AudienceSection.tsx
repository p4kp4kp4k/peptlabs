import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Stethoscope, Activity, Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ScrollReveal } from "@/components/ScrollReveal";


const cards = [
  {
    icon: Stethoscope,
    title: "Para Profissionais de Saúde",
    items: [
      "Prescrição segura com protocolos baseados em evidências",
      "Calculadora de dose precisa em segundos",
      "Referências científicas atualizadas do PubMed",
      "Stacks sinérgicos validados",
    ],
    cta: "Acesse como Profissional",
    gradient: "from-primary/20 to-primary/5",
    borderColor: "hover:border-primary/30",
  },
  {
    icon: Activity,
    title: "Para Atletas e Pacientes",
    items: [
      "Entenda o que seu médico prescreve",
      "Guias práticos de reconstituição e uso",
      "Informações confiáveis e atualizadas",
      "Calculadora de dose simplificada",
    ],
    cta: "Acesse como Atleta",
    gradient: "from-accent/20 to-accent/5",
    borderColor: "hover:border-accent/30",
  },
];

const AudienceSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleCTA = () => navigate(user ? "/app/dashboard" : "/auth");

  return (
    <section className="relative px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal>
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl font-display">
            Para quem é a plataforma?
          </h2>
        </ScrollReveal>
        <div className="grid gap-5 md:grid-cols-2">
          {cards.map((card, idx) => (
            <ScrollReveal key={card.title} delay={idx * 0.1}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`group rounded-2xl border border-border/30 bg-card/40 p-6 backdrop-blur-sm transition-all ${card.borderColor}`}
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient}`}>
                  <card.icon className="h-5 w-5 text-foreground" />
                </div>
                <h3 className="mb-3 text-base font-bold text-foreground font-display">{card.title}</h3>
                <ul className="space-y-2 mb-5">
                  {card.items.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {i}
                    </li>
                  ))}
                </ul>
                <Button
                  size="sm"
                  className="gap-1.5 text-xs h-9 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all"
                  onClick={handleCTA}
                >
                  {card.cta} <ArrowRight className="h-3 w-3" />
                </Button>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AudienceSection;
