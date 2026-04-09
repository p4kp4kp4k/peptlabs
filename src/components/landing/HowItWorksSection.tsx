import { LogIn, Target, Award } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

const steps = [
  { step: "1", icon: LogIn, title: "Crie sua conta grátis", desc: "Cadastre-se em menos de 30 segundos com email ou Google." },
  { step: "2", icon: Target, title: "Explore e pesquise", desc: "Navegue pela biblioteca, protocolos e calculadora profissional." },
  { step: "3", icon: Award, title: "Aplique protocolos", desc: "Use protocolos validados e acompanhe seu progresso." },
];

const HowItWorksSection = () => (
  <section className="px-4 py-16 sm:px-6 sm:py-20">
    <div className="mx-auto max-w-4xl">
      <ScrollReveal>
        <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl font-display">Como funciona</h2>
      </ScrollReveal>
      <div className="grid gap-5 sm:grid-cols-3">
        {steps.map(({ step, icon: Icon, title, desc }, idx) => (
          <ScrollReveal key={step} delay={idx * 0.1}>
            <div className="relative text-center rounded-2xl border border-border/20 bg-card/30 p-6 backdrop-blur-sm">
              {/* Connector line */}
              {idx < 2 && (
                <div className="hidden sm:block absolute top-1/2 -right-2.5 w-5 h-px bg-gradient-to-r from-primary/30 to-transparent" />
              )}
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/[0.08] border border-primary/15">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="inline-block text-[10px] font-bold text-primary mb-2 px-2 py-0.5 rounded-full bg-primary/[0.08] border border-primary/15">
                PASSO {step}
              </div>
              <h3 className="mb-1.5 text-sm font-semibold text-foreground font-display">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
