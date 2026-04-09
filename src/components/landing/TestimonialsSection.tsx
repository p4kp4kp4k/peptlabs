import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ScrollReveal";

const testimonials = [
  {
    text: "Antes do PeptiLab, gastava horas pesquisando artigos no PubMed para validar dosagens. A plataforma centralizou tudo com base científica sólida. Reduzi meu tempo de pesquisa em 80%.",
    name: "Dr. Ricardo Mendes",
    role: "Médico Endocrinologista",
    icon: "👨‍⚕️",
  },
  {
    text: "Uso diariamente para consultar doses e protocolos dos meus peptídeos. Agora tenho tudo centralizado, confiável e baseado em evidências. Meu desempenho melhorou significativamente.",
    name: "Marina Costa",
    role: "Atleta de CrossFit",
    icon: "🏋️‍♀️",
  },
  {
    text: "Meu médico prescreveu GHK-Cu e CJC-1295, mas eu não entendia nada. O PeptiLab me explicou de forma acessível. Agora sou um paciente mais informado e confiante.",
    name: "Paulo Henrique",
    role: "Paciente",
    icon: "🧑",
  },
];

const TestimonialsSection = () => (
  <section className="px-4 py-16 sm:px-6 sm:py-20">
    <div className="mx-auto max-w-5xl">
      <ScrollReveal>
        <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl font-display">
          O que dizem nossos usuários
        </h2>
      </ScrollReveal>
      <div className="grid gap-4 md:grid-cols-3">
        {testimonials.map((t, idx) => (
          <ScrollReveal key={t.name} delay={idx * 0.1}>
            <motion.div
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="rounded-2xl border border-border/20 bg-card/30 p-5 backdrop-blur-sm transition-all hover:border-primary/15"
            >
              <div className="mb-3 flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">"{t.text}"</p>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary border border-border/30 text-sm">
                  {t.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
