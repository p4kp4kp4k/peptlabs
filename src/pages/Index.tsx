import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical, ArrowRight, Sparkles, Home, Users, Zap,
  Calculator, BookOpen, Layers, CreditCard, HelpCircle, ChevronRight, Palette,
  LayoutDashboard, Syringe, Search, ArrowLeftRight, MapPin, History, Settings,
  FileText, Shield, LogOut, Menu, X, ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
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

const appMainNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/app/dashboard" },
  { label: "Biblioteca", icon: Syringe, path: "/app/peptides" },
  { label: "Finder", icon: Search, path: "/app/finder" },
  { label: "Comparador", icon: ArrowLeftRight, path: "/app/compare" },
  { label: "Calculadora", icon: Calculator, path: "/app/calculator" },
  { label: "Stacks", icon: Layers, path: "/app/stacks" },
  { label: "Mapa Corporal", icon: MapPin, path: "/app/body-map" },
  { label: "Interações", icon: Zap, path: "/app/interactions" },
  { label: "Aprender", icon: BookOpen, path: "/app/learn" },
  { label: "Templates", icon: FileText, path: "/app/templates" },
  { label: "Loja", icon: ShoppingBag, path: "/app/store" },
];

const appBottomNav = [
  { label: "Histórico", icon: History, path: "/app/history" },
  { label: "Configurações", icon: Settings, path: "/app/settings" },
  { label: "Assinatura", icon: CreditCard, path: "/app/billing" },
];

const Index = () => {
  const [active, setActive] = useState("hero");
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, profile, signOut, isAdmin: authIsAdmin } = useAuth();
  const { theme, setTheme } = useThemeColor();
  const { isAdmin: entIsAdmin } = useEntitlements();
  const isAdmin = authIsAdmin || entIsAdmin;
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
          preload="metadata"
          className="h-full w-full object-cover"
          style={{ filter: "brightness(0.25) saturate(1.4)" }}
        >
          <source src="/videos/hero-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background/60" />
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
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2.5 space-y-px">
          {/* Início (scroll to top) */}
          <button
            onClick={() => scrollTo("hero")}
            className={cn(
              "w-full group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-colors duration-150 mb-1",
              active === "hero"
                ? "bg-primary/[0.08] text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Home className="h-[15px] w-[15px] shrink-0" />
            <span>Início</span>
            {active === "hero" && <div className="ml-auto h-1 w-1 rounded-full bg-primary" />}
          </button>

          {/* App navigation — always visible */}
          <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Principal</p>
          {appMainNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <item.icon className="h-[15px] w-[15px] shrink-0 text-muted-foreground group-hover:text-foreground" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}

          <div className="my-3 mx-2 border-t border-border/15" />
          <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Conta</p>
          {appBottomNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <item.icon className="h-[15px] w-[15px] shrink-0 text-muted-foreground group-hover:text-foreground" />
              <span className="truncate">{item.label}</span>
            </Link>
          ))}

          {user && isAdmin && (
            <>
              <div className="my-3 mx-2 border-t border-border/15" />
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Admin</p>
              <Link
                to="/app/admin"
                className="group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-card/50 hover:text-foreground transition-colors"
              >
                <Shield className="h-[15px] w-[15px] shrink-0" />
                <span>Painel Admin</span>
              </Link>
            </>
          )}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border/15 p-2.5 space-y-1">
          {/* Theme Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-card/50 hover:text-foreground transition-colors">
                <Palette className="h-3 w-3" />
                <span>Tema</span>
                <div className="ml-auto flex gap-0.5">
                  {themeOptions.find(t => t.value === theme)?.colors.map((c, i) => (
                    <div key={i} className="h-2.5 w-2.5 rounded-full border border-border/30" style={{ background: c }} />
                  ))}
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" align="end" className="w-48 p-1.5">
              <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Dark</p>
              {themeOptions.filter(t => t.mode === "dark").map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                    theme === t.value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <div className="flex gap-0.5">
                    {t.colors.map((c, i) => (
                      <div key={i} className="h-2.5 w-2.5 rounded-full border border-border/30" style={{ background: c }} />
                    ))}
                  </div>
                  {t.label}
                  {theme === t.value && <span className="ml-auto text-[10px]">•</span>}
                </button>
              ))}
              <div className="my-1 border-t border-border" />
              <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Light</p>
              {themeOptions.filter(t => t.mode === "light").map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                    theme === t.value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <div className="flex gap-0.5">
                    {t.colors.map((c, i) => (
                      <div key={i} className="h-2.5 w-2.5 rounded-full border border-border/30" style={{ background: c }} />
                    ))}
                  </div>
                  {t.label}
                  {theme === t.value && <span className="ml-auto text-[10px]">•</span>}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {user ? (
            <>
              <div className="flex items-center gap-2 px-2.5 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">{profile?.display_name || user?.email?.split("@")[0]}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={async () => { await signOut(); navigate("/"); }}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-card/50 hover:text-foreground transition-colors"
              >
                <LogOut className="h-3 w-3" /> Sair
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-1">
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
            <button onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5 text-muted-foreground" />
            </button>
            <FlaskConical className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold font-display">
              Pepti<span className="text-gradient-primary">Lab</span>
            </span>
          </div>
          <Button size="sm" className="text-xs h-8 bg-primary hover:bg-primary/90" onClick={() => navigate(user ? "/app/dashboard" : "/auth")}>
            {user ? "Painel" : "Criar Conta"}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute left-0 top-0 h-full w-64 border-r border-border/20 bg-background/95 backdrop-blur-2xl flex flex-col"
            >
              {/* Logo + Close */}
              <div className="flex h-12 items-center justify-between px-4 border-b border-border/15">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                    <FlaskConical className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-bold font-display">
                    Pepti<span className="text-gradient-primary">Lab</span>
                  </span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2.5 space-y-px">
                <button
                  onClick={() => { scrollTo("hero"); setMobileOpen(false); }}
                  className={cn(
                    "w-full group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-colors duration-150 mb-1",
                    active === "hero"
                      ? "bg-primary/[0.08] text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Home className="h-[15px] w-[15px] shrink-0" />
                  <span>Início</span>
                  {active === "hero" && <div className="ml-auto h-1 w-1 rounded-full bg-primary" />}
                </button>

                <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Principal</p>
                {appMainNav.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className="group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <item.icon className="h-[15px] w-[15px] shrink-0 text-muted-foreground group-hover:text-foreground" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                ))}

                <div className="my-3 mx-2 border-t border-border/15" />
                <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Conta</p>
                {appBottomNav.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className="group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                  >
                    <item.icon className="h-[15px] w-[15px] shrink-0 text-muted-foreground group-hover:text-foreground" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                ))}

                {user && isAdmin && (
                  <>
                    <div className="my-3 mx-2 border-t border-border/15" />
                    <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Admin</p>
                    <Link
                      to="/app/admin"
                      onClick={() => setMobileOpen(false)}
                      className="group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <Shield className="h-[15px] w-[15px] shrink-0" />
                      <span>Painel Admin</span>
                    </Link>
                  </>
                )}
              </nav>

              {/* Bottom */}
              <div className="border-t border-border/15 p-2.5 space-y-1">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-2.5 py-1.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                        {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">{profile?.display_name || user?.email?.split("@")[0]}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => { await signOut(); setMobileOpen(false); navigate("/"); }}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <LogOut className="h-3 w-3" /> Sair
                    </button>
                  </>
                ) : (
                  <div className="space-y-2 pt-1">
                    <Button size="sm" className="w-full gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={() => { setMobileOpen(false); navigate("/auth"); }}>
                      Criar Conta <ArrowRight className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full text-xs h-8 text-muted-foreground hover:text-foreground" onClick={() => { setMobileOpen(false); navigate("/auth"); }}>
                      Entrar
                    </Button>
                  </div>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

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
