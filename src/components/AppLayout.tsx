import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Syringe, Search, ArrowLeftRight,
  Calculator, Layers, MapPin, History, Settings, CreditCard,
  Shield, Menu, X, LogOut, FlaskConical, Zap, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const mainNav = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/app/dashboard" },
  { label: "Biblioteca", icon: Syringe, path: "/app/peptides" },
  { label: "Finder", icon: Search, path: "/app/finder" },
  { label: "Comparador", icon: ArrowLeftRight, path: "/app/compare" },
  { label: "Calculadora", icon: Calculator, path: "/app/calculator" },
  { label: "Stacks", icon: Layers, path: "/app/stacks" },
  { label: "Mapa Corporal", icon: MapPin, path: "/app/body-map" },
  { label: "Interações", icon: Zap, path: "/app/interactions" },
  { label: "Aprender", icon: BookOpen, path: "/app/learn" },
];

const bottomNav = [
  { label: "Histórico", icon: History, path: "/app/history" },
  { label: "Configurações", icon: Settings, path: "/app/settings" },
  { label: "Assinatura", icon: CreditCard, path: "/app/billing" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut, user, isAdmin } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item, onClick }: { item: typeof mainNav[0]; onClick?: () => void }) => (
    <Link
      to={item.path}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-200",
        isActive(item.path)
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {/* Active indicator */}
      {isActive(item.path) && (
        <div className="absolute inset-0 rounded-lg bg-primary/[0.08] border border-primary/[0.12]" />
      )}
      {!isActive(item.path) && (
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 bg-white/[0.03] transition-opacity duration-200" />
      )}
      <item.icon className={cn(
        "relative z-10 h-4 w-4 shrink-0 transition-all duration-200",
        isActive(item.path)
          ? "text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
          : "text-muted-foreground group-hover:text-foreground"
      )} />
      <span className="relative z-10 truncate">{item.label}</span>
      {isActive(item.path) && (
        <div className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
      )}
    </Link>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background bg-cinematic">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="orb orb-cyan w-[500px] h-[500px] -top-40 -right-40 animate-orb-drift opacity-40" />
        <div className="orb orb-purple w-[400px] h-[400px] bottom-0 left-1/4 animate-orb-drift opacity-30" style={{ animationDelay: '-7s' }} />
        <div className="orb orb-blue w-[300px] h-[300px] top-1/3 left-0 animate-orb-drift opacity-20" style={{ animationDelay: '-14s' }} />
        <div className="bg-grid absolute inset-0 opacity-30" />
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden w-[260px] shrink-0 overflow-y-auto border-r border-white/[0.04] bg-background/60 backdrop-blur-2xl md:flex md:flex-col relative z-10">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-[0_0_15px_hsl(var(--primary)/0.15)]">
            <FlaskConical className="h-4 w-4 text-primary drop-shadow-[0_0_4px_hsl(var(--primary)/0.5)]" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground font-display">
            Pepti<span className="text-gradient-primary">Lab</span>
          </span>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-0.5">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/40">
            Principal
          </p>
          {mainNav.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}

          <div className="my-5 mx-3 border-t border-white/[0.04]" />

          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/40">
            Conta
          </p>
          {bottomNav.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}

          {isAdmin && (
            <>
              <div className="my-5 mx-3 border-t border-white/[0.04]" />
              <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/40">
                Admin
              </p>
              <NavItem item={{ label: "Painel Admin", icon: Shield, path: "/app/admin" }} />
            </>
          )}
        </nav>

        {/* User */}
        <div className="border-t border-white/[0.04] p-4">
          <div className="flex items-center gap-3 rounded-xl glass-subtle p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/15 text-xs font-bold text-primary shadow-[0_0_10px_hsl(var(--primary)/0.1)]">
              {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">
                {profile?.display_name || user?.email?.split("@")[0]}
              </p>
              <p className="truncate text-[10px] text-muted-foreground/60">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground/60 transition-all duration-200 hover:bg-white/[0.03] hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[280px] animate-slide-in-left border-r border-white/[0.04] bg-background/95 backdrop-blur-2xl">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                  <FlaskConical className="h-4 w-4 text-primary" />
                </div>
                <span className="text-base font-bold tracking-tight text-foreground font-display">
                  Pepti<span className="text-gradient-primary">Lab</span>
                </span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="px-3 py-4 space-y-0.5">
              {mainNav.map((item) => (
                <NavItem key={item.path} item={item} onClick={() => setSidebarOpen(false)} />
              ))}
              <div className="my-5 mx-3 border-t border-white/[0.04]" />
              {bottomNav.map((item) => (
                <NavItem key={item.path} item={item} onClick={() => setSidebarOpen(false)} />
              ))}
              {isAdmin && (
                <>
                  <div className="my-5 mx-3 border-t border-white/[0.04]" />
                  <NavItem item={{ label: "Painel Admin", icon: Shield, path: "/app/admin" }} onClick={() => setSidebarOpen(false)} />
                </>
              )}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 border-t border-white/[0.04] p-4">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-xs text-muted-foreground hover:bg-white/[0.04] hover:text-foreground transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 relative z-10">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-white/[0.04] bg-background/40 px-6 backdrop-blur-2xl">
          <button className="md:hidden rounded-lg p-1.5 hover:bg-white/[0.04] transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="hidden max-w-md flex-1 md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
              <Input
                placeholder="Buscar peptídeos, protocolos..."
                className="h-9 pl-10 text-xs bg-white/[0.02] border-white/[0.04] placeholder:text-muted-foreground/30 focus-visible:bg-white/[0.04]"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex gap-1.5 text-xs border-primary/20 text-primary hover:bg-primary/[0.06] hover:border-primary/30"
              onClick={() => navigate("/app/billing")}
            >
              <Zap className="h-3.5 w-3.5" />
              Upgrade
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
