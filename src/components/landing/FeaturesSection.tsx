import { motion } from "framer-motion";
import { BookOpen, Shield, Calculator, Layers, Brain, Zap } from "lucide-react";
import { ScrollReveal } from "@/components/ScrollReveal";

const features = [
  { icon: BookOpen, title: "Biblioteca Completa", desc: "80+ peptídeos catalogados com fichas técnicas detalhadas e referências científicas." },
  { icon: Shield, title: "Protocolos Clínicos", desc: "Protocolos de dosagem baseados em evidências com fases e ciclos detalhados." },
  { icon: Calculator, title: "Calculadora de Dose", desc: "Calcule reconstituição e dosagem com precisão. Tabelas de conversão e guia de diluentes." },
  { icon: Layers, title: "Stack Builder", desc: "Combinações otimizadas de peptídeos com objetivos e dosagens pré-definidas." },
  { icon: Brain, title: "Guias Educacionais", desc: "Conteúdo acessível com base científica para profissionais e pacientes." },
  { icon: Zap, title: "Interações", desc: "Verifique interações e sinergias entre peptídeos antes de combinar." },
];

const FeaturesSection = () => (
  <section className="relative border-y border-border/20 bg-card/10 px-4 py-16 sm:px-6 sm:py-20">
    {/* Subtle grid */}
    <div
      className="absolute inset-0 opacity-[0.02]"
      style={{
        backgroundImage: `linear-gradient(rgba(0,230,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,230,255,0.4) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }}
    />
    <div className="relative mx-auto max-w-5xl">
      <ScrollReveal>
        <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl font-display">
          Tudo o que você precisa em um só lugar
        </h2>
      </ScrollReveal>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }, idx) => (
          <ScrollReveal key={title} delay={idx * 0.06}>
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="group rounded-2xl border border-border/20 bg-card/30 p-5 backdrop-blur-sm transition-all hover:border-primary/20 hover:bg-card/50 hover:shadow-lg hover:shadow-primary/[0.03]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/[0.08] border border-primary/10 transition-all group-hover:bg-primary/[0.12] group-hover:border-primary/20">
                <Icon className="h-4.5 w-4.5 text-primary transition-transform group-hover:scale-110" />
              </div>
              <h3 className="mb-1.5 text-sm font-semibold text-foreground font-display">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </motion.div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
