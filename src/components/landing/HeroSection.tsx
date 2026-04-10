import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Users, FlaskConical, BookOpen, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

const useCountUp = (end: number, duration = 2000, prefix = "", suffix = "") => {
  const [display, setDisplay] = useState(prefix + "0" + suffix);
  const ref = useRef<HTMLDivElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * end);
            setDisplay(prefix + current.toLocaleString("pt-BR") + suffix);
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, prefix, suffix]);

  return { display, ref };
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const statsDef = [
  { end: 3000, prefix: "+", suffix: "", label: "Profissionais ativos", icon: Users },
  { end: 80, prefix: "", suffix: "+", label: "Peptídeos catalogados", icon: FlaskConical },
  { end: 50, prefix: "", suffix: "+", label: "Protocolos clínicos", icon: BookOpen },
  { end: 100, prefix: "", suffix: "%", label: "Baseado em PubMed", icon: Shield },
];

const CountUpStat = ({ end, prefix, suffix, label, icon: Icon }: typeof statsDef[number]) => {
  const { display, ref } = useCountUp(end, 2000, prefix, suffix);
  return (
    <div ref={ref} className="group rounded-xl border border-border/30 bg-card/40 p-4 text-center backdrop-blur-sm transition-all hover:border-primary/20 hover:bg-card/60">
      <Icon className="h-4 w-4 text-primary mx-auto mb-2 transition-transform group-hover:scale-110" />
      <p className="text-xl font-bold text-foreground font-display">{display}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
};

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleCTA = () => navigate(user ? "/app/dashboard" : "/auth");

  return (
    <section className="relative overflow-hidden pb-16 pt-20 sm:pb-24 sm:pt-28">
      {/* Subtle ambient glow (no video here — video is full-page in Index) */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/[0.05] blur-[160px] animate-pulse-glow" />
      </div>

      <motion.div
        className="relative mx-auto max-w-4xl px-4 text-center sm:px-6"
        initial="hidden"
        animate="visible"
      >
        <motion.div custom={0} variants={fadeUp}>
          <Badge className="mb-5 border-primary/20 bg-primary/[0.08] text-primary text-[11px] px-3 py-1 backdrop-blur-sm">
            <Sparkles className="mr-1.5 h-3 w-3" /> Plataforma #1 de Peptídeos no Brasil
          </Badge>
        </motion.div>

        <motion.h1
          custom={1}
          variants={fadeUp}
          className="mb-5 text-4xl font-bold leading-[1.1] text-foreground sm:text-5xl lg:text-6xl font-display"
        >
          Domine peptídeos com{" "}
          <span className="text-gradient-primary relative">
            precisão científica
            <span className="absolute -inset-1 rounded-lg bg-primary/[0.06] blur-2xl" />
          </span>
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground leading-relaxed sm:text-lg"
        >
          Protocolos baseados em evidências, calculadora de doses profissional e guias práticos para{" "}
          <strong className="text-foreground font-medium">profissionais de saúde</strong> e{" "}
          <strong className="text-foreground font-medium">atletas de alto rendimento</strong>.
        </motion.p>

        <motion.div custom={3} variants={fadeUp} className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            className="gap-2 text-sm h-12 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 transition-all hover:shadow-primary/40 hover:scale-[1.02]"
            onClick={handleCTA}
          >
            Começar Grátis <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2 text-sm h-12 px-8 border-foreground/30 text-foreground hover:border-primary/60 hover:bg-primary/[0.08] transition-all"
            onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}
          >
            Ver Planos
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          custom={4}
          variants={fadeUp}
          className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
        >
          {statsDef.map((stat) => (
            <CountUpStat key={stat.label} {...stat} />
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
