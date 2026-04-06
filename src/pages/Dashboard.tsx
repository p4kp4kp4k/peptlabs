import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Layers, Search, BookOpen, Calculator, Sparkles, ArrowRight,
  Activity, TrendingUp, Target, Clock
} from "lucide-react";

export default function Dashboard() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const quickActions = [
    { icon: Search, label: "Encontrar Peptídeo", path: "/finder", color: "text-cyan-400" },
    { icon: Layers, label: "Biblioteca", path: "/library", color: "text-emerald-400" },
    { icon: BookOpen, label: "Aprender", path: "/learn", color: "text-violet-400" },
    { icon: Calculator, label: "Calculadora", path: "/calculator", color: "text-amber-400" },
  ];

  const stats = [
    { icon: Layers, label: "Protocolos Ativos", value: "0", change: "Crie seu primeiro" },
    { icon: Target, label: "Peptídeos Salvos", value: "0", change: "Explore a biblioteca" },
    { icon: Activity, label: "Recomendações", value: "0", change: "Use o Finder" },
    { icon: Clock, label: "Dias na Plataforma", value: "1", change: "Bem-vindo!" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground sm:text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Olá, {profile?.display_name || user?.email?.split("@")[0] || "Usuário"} 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Seu painel de peptídeos personalizado</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => navigate("/admin")} className="text-xs gap-1">
              <Sparkles className="h-3 w-3" /> Admin
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/40 bg-card/80">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <s.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="text-[9px] text-primary/70 mt-0.5">{s.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Acesso Rápido</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((a) => (
            <Card
              key={a.label}
              className="cursor-pointer border-border/40 bg-card/80 transition-all hover:border-primary/30 hover:bg-card"
              onClick={() => navigate(a.path)}
            >
              <CardContent className="flex flex-col items-center gap-2 p-4">
                <a.icon className={`h-6 w-6 ${a.color}`} />
                <span className="text-xs font-medium text-foreground">{a.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="border-border/40 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-8 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">Nenhuma atividade recente</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">Explore a biblioteca para começar</p>
            <Button size="sm" className="mt-3 gap-1 text-xs" onClick={() => navigate("/library")}>
              Explorar <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
