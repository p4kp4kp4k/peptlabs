import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FlaskConical, LayoutDashboard, Syringe, Search, ArrowLeftRight,
  BookOpen, Calculator, Layers, Triangle, MapPin, CalendarDays,
  User, HelpCircle, Moon, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const navItems = [
  { label: "Painel", icon: LayoutDashboard, path: "/" },
  { label: "Peptídeos Individuais", icon: Syringe, path: "/library" },
  { label: "Encontre seu Peptídeo", icon: Search, path: "/finder" },
  { label: "Comparar Peptídeos", icon: ArrowLeftRight, path: "#" },
  { label: "Meus Protocolos", icon: Layers, path: "#" },
  { label: "Aprender", icon: BookOpen, path: "/learn" },
  { label: "Calculadora", icon: Calculator, path: "#" },
  { label: "Biblioteca de Stacks", icon: Layers, path: "#" },
  { label: "Interações", icon: Triangle, path: "#" },
  { label: "Mapa de Aplicação", icon: MapPin, path: "#" },
  { label: "Cronograma", icon: CalendarDays, path: "#" },
];

const bottomItems = [
  { label: "Minha Conta", icon: User, path: "#" },
  { label: "Suporte", icon: HelpCircle, path: "#" },
  { label: "Modo Escuro", icon: Moon, path: "#" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-56 shrink-0 border-r border-border/40 bg-card/50 md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-border/40 px-4">
          <FlaskConical className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Peptídeos<span className="text-primary">Health</span>
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors",
                location.pathname === item.path
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border/40 px-2 py-3">
          {bottomItems.map((item) => (
            <a
              key={item.label}
              href={item.path}
              className="mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </a>
          ))}
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-border/40 bg-card">
            <div className="flex h-14 items-center justify-between border-b border-border/40 px-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Peptídeos<span className="text-primary">Health</span>
                </span>
              </div>
              <button onClick={() => setSidebarOpen(false)}><X className="h-4 w-4" /></button>
            </div>
            <nav className="px-2 py-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "mb-0.5 flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs",
                    location.pathname === item.path
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border/40 bg-background/90 px-4 backdrop-blur-xl">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden max-w-md flex-1 md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar peptídeos, protocolos..."
                className="h-8 border-border/50 bg-secondary pl-9 text-xs placeholder:text-muted-foreground focus-visible:ring-primary"
              />
            </div>
          </div>
          <div className="ml-auto" />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
