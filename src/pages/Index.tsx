import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, ArrowRight, Sparkles, Home, Users, Zap,
  Calculator, BookOpen, Layers, CreditCard, HelpCircle, ChevronRight, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { useThemeColor, themeOptions } from "@/hooks/useThemeColor";
import { cn } from "@/lib/utils";
import ParticleBackground from "@/components/landing/ParticleBackground";
import HeroSection from "@/components/landing/HeroSection";
import AudienceSection from "@/components/landing/AudienceSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturedPeptidesSection from "@/components/landing/FeaturedPeptidesSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import FinalCTASection from "@/components/landing/FinalCTASection";

const navItems = [
  { id: "hero", label: "Início", icon: Home },
  { id: "audience", label: "Para Quem", icon: Users },
  { id: "features", label: "Recursos", icon: Zap },
  { id: "how", label: "Como Funciona", icon: BookOpen },
  { id: "peptides", label: "Peptídeos", icon: FlaskConical },
  { id: "pricing", label: "Planos", icon: CreditCard },
  { id: "faq", label: "FAQ", icon: HelpCircle },
];

const Index = () => {
  const [active, setActive] = useState("hero");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme } = useThemeColor();
  const mainRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll spy
  useEffect(() => {
    const container = mainRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop + 120;
      let currentSection = "hero";

      for (const item of navItems) {
        const el = sectionRefs.current[item.id];
        if (el && el.offsetTop <= scrollTop) {
          currentSection = item.id;
        }
      }
      setActive(currentSection);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = sectionRefs.current[id];
    if (el && mainRef.current) {
      mainRef.current.scrollTo({ top: el.offsetTop - 20, behavior: "smooth" });
    }
  };

  const setRef = (id: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[id] = el;
  };

  return (
    <div className="landing-dark-force relative h-screen overflow-hidden flex">
      {/* Full-page video background */}
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="h-full w-full object-cover"
          style={{ filter: "brightness(0.18) saturate(1.4)" }}
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/30 to-background/70" />
      </div>
      <ParticleBackground />

      {/* Fixed Sidebar */}
      <aside className="relative z-20 hidden md:flex flex-col w-56 h-screen border-r border-border/20 bg-background/80 backdrop-blur-2xl shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-border/15">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <FlaskConical className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-bold tracking-tight font-display">
            Pepti<span className="text-gradient-primary">Lab</span>
          </span>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-primary/[0.08] text-primary border border-primary/15"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50 border border-transparent"
                }`}
              >
                <item.icon className={`h-3.5 w-3.5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                {item.label}
                {isActive && (
                  <ChevronRight className="h-3 w-3 ml-auto text-primary/60" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar CTA */}
        <div className="p-4 border-t border-border/15">
          {user ? (
            <Button size="sm" className="w-full gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90" onClick={() => navigate("/app/dashboard")}>
              Meu Painel <ArrowRight className="h-3 w-3" />
            </Button>
          ) : (
            <div className="space-y-2">
              <Button size="sm" className="w-full gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={() => navigate("/auth")}>
                Criar Conta <ArrowRight className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-xs h-8 text-muted-foreground hover:text-foreground" onClick={() => navigate("/auth")}>
                Entrar
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 border-b border-border/20 bg-background/80 backdrop-blur-2xl">
        <div className="flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold font-display">
              Pepti<span className="text-gradient-primary">Lab</span>
            </span>
          </div>
          <Button size="sm" className="text-xs h-8 bg-primary hover:bg-primary/90" onClick={() => navigate(user ? "/app/dashboard" : "/auth")}>
            {user ? "Painel" : "Criar Conta"}
          </Button>
        </div>
        {/* Mobile nav scroll */}
        <div className="flex gap-1 px-3 pb-2 overflow-x-auto scrollbar-thin">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                active === item.id
                  ? "bg-primary/[0.1] text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Scrollable Content */}
      <main ref={mainRef} className="relative z-10 flex-1 overflow-y-auto scrollbar-thin pt-0 md:pt-0">
        {/* Mobile spacer */}
        <div className="h-20 md:h-0" />

        <div ref={setRef("hero")}>
          <HeroSection />
        </div>
        <div ref={setRef("audience")}>
          <AudienceSection />
        </div>
        <div ref={setRef("features")}>
          <FeaturesSection />
        </div>
        <div ref={setRef("how")}>
          <HowItWorksSection />
        </div>
        <div ref={setRef("peptides")}>
          <FeaturedPeptidesSection />
        </div>
        <div ref={setRef("pricing")}>
          <PricingSection />
        </div>
        <div ref={setRef("faq")}>
          <FAQSection />
        </div>
        <FinalCTASection />
      </main>
    </div>
  );
};

export default Index;
