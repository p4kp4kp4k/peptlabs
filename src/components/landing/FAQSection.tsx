import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "@/components/ScrollReveal";

const faqs = [
  { q: "O que é a PeptiLab?", a: "A PeptiLab é a plataforma #1 de peptídeos no Brasil, com biblioteca completa, protocolos clínicos baseados em evidências, calculadora de doses e guias práticos." },
  { q: "Como usar a plataforma no dia a dia?", a: "Crie sua conta gratuita, explore a biblioteca de peptídeos, consulte protocolos e use a calculadora de doses." },
  { q: "Quais funcionalidades estão disponíveis?", a: "Biblioteca com 80+ peptídeos, protocolos clínicos, calculadora de reconstituição e dosagem, stacks sinérgicos, guias práticos e mais." },
  { q: "A plataforma serve para médicos e clínicas?", a: "Sim! Projetada para profissionais de saúde que prescrevem peptídeos e para atletas e pacientes." },
  { q: "Posso calcular dosagens diretamente na plataforma?", a: "Sim, a calculadora de dose avançada permite calcular reconstituição e dosagem com precisão em segundos." },
  { q: "As informações são baseadas em ciência?", a: "Todas as informações são baseadas em estudos indexados no PubMed/NIH." },
];

const FAQSection = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <ScrollReveal>
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl font-display">Perguntas Frequentes</h2>
        </ScrollReveal>
        <div className="space-y-2.5">
          {faqs.map((faq, i) => (
            <ScrollReveal key={i} delay={i * 0.05}>
              <div className="rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm overflow-hidden transition-all hover:border-border/30">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <span className="text-sm font-medium text-foreground pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="border-t border-border/20 px-4 pb-4 pt-3">
                        <p className="text-xs leading-relaxed text-muted-foreground">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
