import { ChevronRight, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ScrollReveal";
import { peptideImages } from "@/assets/peptides";

const peptides = [
  { name: "BPC-157", slug: "bpc-157", category: "Recuperação", desc: "Cicatrização acelerada", free: false },
  { name: "TB-500", slug: "tb-500", category: "Recuperação", desc: "Reparo tecidual", free: false },
  { name: "CJC-1295", slug: "cjc-1295-no-dac", category: "GH / Secretagogos", desc: "Liberação pulsátil de GH", free: false },
  { name: "Ipamorelin", slug: "ipamorelin", category: "GH / Secretagogos", desc: "Aumento de GH", free: false },
  { name: "Semaglutida", slug: "semaglutide", category: "Emagrecimento", desc: "Controle de apetite", free: true },
  { name: "Tirzepatide", slug: "tirzepatide", category: "Emagrecimento", desc: "Perda de peso", free: true },
];

const FeaturedPeptidesSection = () => (
  <section className="relative border-y border-border/20 bg-card/10 px-4 py-16 sm:px-6 sm:py-20">
    <div className="mx-auto max-w-5xl">
      <ScrollReveal>
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl font-display">Peptídeos em Destaque</h2>
          <a href="/app/peptides" className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
            Ver todos <ChevronRight className="h-3 w-3" />
          </a>
        </div>
      </ScrollReveal>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {peptides.map((p, idx) => (
          <ScrollReveal key={p.name} delay={idx * 0.05}>
            <motion.div
              whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
              className="group cursor-pointer overflow-hidden rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm transition-all hover:border-primary/20"
            >
              <div className="relative h-24 overflow-hidden">
                <img src={peptideImages[p.slug]} alt={p.name} className="h-full w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />
                {p.free ? (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-primary/90 px-2 py-0.5 text-[8px] font-semibold text-primary-foreground">
                    Grátis
                  </span>
                ) : (
                  <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-background/70 px-1.5 py-0.5 text-[8px] font-semibold text-primary backdrop-blur-sm border border-primary/20">
                    <Lock className="h-2 w-2" /> PRO
                  </span>
                )}
                <span className="absolute bottom-1.5 left-1.5 rounded-md bg-background/60 px-1.5 py-0.5 text-[8px] text-foreground backdrop-blur-sm">
                  {p.category}
                </span>
              </div>
              <div className="p-2.5">
                <h4 className="text-[11px] font-semibold text-foreground font-display">{p.name}</h4>
                <p className="mt-0.5 text-[9px] text-muted-foreground">{p.desc}</p>
              </div>
            </motion.div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturedPeptidesSection;
