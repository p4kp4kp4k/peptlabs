import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Syringe, Search, ArrowLeftRight,
  Calculator, Layers, MapPin, History, Settings, CreditCard,
  Shield, Menu, X, LogOut, FlaskConical, Zap, BookOpen, Palette, FileText, Home, ShoppingBag, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";

import { useThemeColor, themeOptions } from "@/hooks/useThemeColor";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  { label: "Templates", icon: FileText, path: "/app/templates" },
  { label: "Loja", icon: ShoppingBag, path: "/app/store" },
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
  const { profile, signOut, user, isAdmin: authIsAdmin } = useAuth();
  const { theme, setTheme } = useThemeColor();
  const { isAdmin: entIsAdmin, isPro } = useEntitlements();
  const isAdmin = authIsAdmin || entIsAdmin;

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
        "group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-colors duration-150",
        isActive(item.path)
          ? "bg-primary/[0.08] text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <item.icon className={cn("h-[15px] w-[15px] shrink-0", isActive(item.path) ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      <span className="truncate">{item.label}</span>
      {isActive(item.path) && <div className="ml-auto h-1 w-1 rounded-full bg-primary" />}
    </Link>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background bg-ambient">
      {/* Sidebar Desktop */}
      <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-border bg-sidebar md:flex md:flex-col">
        <div className="flex h-12 items-center gap-2 px-4 border-b border-border">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
            <FlaskConical className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Pepti<span className="text-primary">Lab</span>
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-2.5 py-3 space-y-px">
          <Link
            to="/"
            className="group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-colors duration-150 text-muted-foreground hover:bg-secondary hover:text-foreground mb-1"
          >
            <Home className="h-[15px] w-[15px] shrink-0 text-muted-foreground group-hover:text-foreground" />
            <span>Início</span>
          </Link>

          <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
            Principal
          </p>
          {mainNav.map((item) => <NavItem key={item.path} item={item} />)}

          <div className="my-3 mx-2 border-t border-border" />

          <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
            Conta
          </p>
          {bottomNav.map((item) => <NavItem key={item.path} item={item} />)}

          {isAdmin && (
            <>
              <div className="my-3 mx-2 border-t border-border" />
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Admin</p>
              <NavItem item={{ label: "Painel Admin", icon: Shield, path: "/app/admin" }} />
            </>
          )}
        </nav>

        <div className="border-t border-border p-2.5 space-y-1">
          {/* Theme switcher */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <Palette className="h-3 w-3" />
                <span>Tema</span>
                <div className="ml-auto flex gap-0.5">
                  {themeOptions.find(t => t.value === theme)?.colors.map((c, i) => (
                    <div key={i} className="h-2.5 w-2.5 rounded-full border border-border" style={{ background: c }} />
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
                      <div key={i} className="h-3 w-3 rounded-full border border-border" style={{ background: c }} />
                    ))}
                  </div>
                  <span>{t.label}</span>
                  {theme === t.value && <div className="ml-auto h-1 w-1 rounded-full bg-primary" />}
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
                      <div key={i} className="h-3 w-3 rounded-full border border-border" style={{ background: c }} />
                    ))}
                  </div>
                  <span>{t.label}</span>
                  {theme === t.value && <div className="ml-auto h-1 w-1 rounded-full bg-primary" />}
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
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <LogOut className="h-3 w-3" /> Sair
              </button>
            </>
          ) : (
            <div className="space-y-1.5 px-1">
              <Button size="sm" className="w-full gap-1.5 text-xs h-8" onClick={() => navigate("/auth")}>
                Criar Conta <ArrowRight className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-xs h-7 text-muted-foreground" onClick={() => navigate("/auth")}>
                Entrar
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-border bg-sidebar animate-slide-in-left">
            <div className="flex h-12 items-center justify-between px-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                  <FlaskConical className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">Pepti<span className="text-primary">Lab</span></span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <nav className="px-2.5 py-3 space-y-px">
              <Link
                to="/"
                onClick={() => setSidebarOpen(false)}
                className="group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground mb-1"
              >
                <Home className="h-[15px] w-[15px] shrink-0" />
                <span>Início</span>
              </Link>
              {mainNav.map((item) => <NavItem key={item.path} item={item} onClick={() => setSidebarOpen(false)} />)}
              <div className="my-3 mx-2 border-t border-border" />
              {bottomNav.map((item) => <NavItem key={item.path} item={item} onClick={() => setSidebarOpen(false)} />)}
              {isAdmin && (
                <>
                  <div className="my-3 mx-2 border-t border-border" />
                  <NavItem item={{ label: "Painel Admin", icon: Shield, path: "/app/admin" }} onClick={() => setSidebarOpen(false)} />
                </>
              )}
            </nav>
            <div className="absolute bottom-0 left-0 right-0 border-t border-border p-2.5">
              {user ? (
                <button onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary">
                  <LogOut className="h-3 w-3" /> Sair
                </button>
              ) : (
                <Button size="sm" className="w-full gap-1.5 text-xs h-8" onClick={() => { setSidebarOpen(false); navigate("/auth"); }}>
                  Criar Conta <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-4.5 w-4.5 text-muted-foreground" />
          </button>
          <div className="hidden max-w-sm flex-1 md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                placeholder="Buscar peptídeos, protocolos..."
                className="h-8 pl-8 text-xs bg-secondary/50 border-border placeholder:text-muted-foreground/40"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex gap-1 text-[11px] text-primary hover:bg-primary/[0.06] h-7"
              onClick={() => navigate("/app/billing")}
            >
              <Zap className="h-3 w-3" /> Upgrade
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
