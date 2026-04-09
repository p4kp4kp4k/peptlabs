import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ScrollReveal } from "@/components/ScrollReveal";

const FinalCTASection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleCTA = () => navigate(user ? "/app/dashboard" : "/auth");

  return (
    <section className="px-4 pb-8 sm:px-6">
      <ScrollReveal>
        <motion.div
          whileHover={{ scale: 1.005, transition: { duration: 0.3 } }}
          className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-primary/20 bg-card/40 p-8 text-center backdrop-blur-sm sm:p-10"
        >
          {/* Glow bg */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-accent/[0.02]" />
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-80 rounded-full bg-primary/[0.06] blur-[80px]" />

          <div className="relative">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.1] border border-primary/15">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mb-3 text-xl font-bold text-foreground sm:text-2xl font-display">
              Comece sua jornada agora
            </h2>
            <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground">
              Junte-se a mais de 3.000 profissionais de saúde e atletas que já usam a PeptiLab diariamente.
            </p>
            <Button
              className="gap-2 h-11 px-8 bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]"
              onClick={handleCTA}
            >
              <Sparkles className="h-4 w-4" /> Começar Grátis
            </Button>
          </div>
        </motion.div>
      </ScrollReveal>
    </section>
  );
};

export default FinalCTASection;
