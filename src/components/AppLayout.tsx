import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Syringe, Search, ArrowLeftRight,
  Calculator, Layers, MapPin, History, Settings, CreditCard,
  Shield, Menu, X, LogOut, ChevronDown, FlaskConical, Zap, BookOpen
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
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
        isActive(item.path)
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
      )}
    >
      <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive(item.path) ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      <span className="truncate">{item.label}</span>
      {isActive(item.path) && (
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
      )}
    </Link>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-border/50 bg-sidebar md:flex md:flex-col">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-border/50 px-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <FlaskConical className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Pepti<span className="text-primary">Lab</span>
          </span>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-0.5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Principal
          </p>
          {mainNav.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}

          <div className="my-4 border-t border-border/30" />

          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Conta
          </p>
          {bottomNav.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}

          {isAdmin && (
            <>
              <div className="my-4 border-t border-border/30" />
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                Admin
              </p>
              <NavItem item={{ label: "Painel Admin", icon: Shield, path: "/app/admin" }} />
            </>
          )}
        </nav>

        {/* User */}
        <div className="border-t border-border/50 p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-medium text-foreground">
                {profile?.display_name || user?.email?.split("@")[0]}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 animate-fade-in border-r border-border/50 bg-sidebar">
            <div className="flex h-14 items-center justify-between border-b border-border/50 px-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <FlaskConical className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  Pepti<span className="text-primary">Lab</span>
                </span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="px-3 py-4 space-y-0.5">
              {mainNav.map((item) => (
                <NavItem key={item.path} item={item} onClick={() => setSidebarOpen(false)} />
              ))}
              <div className="my-4 border-t border-border/30" />
              {bottomNav.map((item) => (
                <NavItem key={item.path} item={item} onClick={() => setSidebarOpen(false)} />
              ))}
              {isAdmin && (
                <>
                  <div className="my-4 border-t border-border/30" />
                  <NavItem item={{ label: "Painel Admin", icon: Shield, path: "/app/admin" }} onClick={() => setSidebarOpen(false)} />
                </>
              )}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 border-t border-border/50 p-3">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/60"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="hidden max-w-sm flex-1 md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar peptídeos, protocolos..."
                className="h-8 border-border/40 bg-secondary/40 pl-9 text-xs placeholder:text-muted-foreground/60 focus-visible:ring-primary/50"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/app/billing")}
            >
              <CreditCard className="h-3.5 w-3.5" />
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
