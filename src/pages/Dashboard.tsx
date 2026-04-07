import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePeptideCount } from "@/hooks/usePeptides";
import { useUserProtocols, useUserProtocolCount } from "@/hooks/useProtocols";
import {
  Layers, Search, BookOpen, Calculator, Sparkles, ArrowRight,
  Activity, TrendingUp, Target, Clock, FlaskConical, Syringe
} from "lucide-react";

export default function Dashboard() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: peptideCount = 0 } = usePeptideCount();
  const { data: protocolCount = 0 } = useUserProtocolCount();
  const { data: protocols = [] } = useUserProtocols();

  const quickActions = [
    { icon: Search, label: "Encontrar Protocolo", path: "/finder", color: "text-cyan-400" },
    { icon: Layers, label: "Biblioteca", path: "/library", color: "text-emerald-400" },
    { icon: BookOpen, label: "Aprender", path: "/learn", color: "text-violet-400" },
    { icon: Calculator, label: "Calculadora", path: "/calculator", color: "text-amber-400" },
  ];

  const daysSinceJoined = user?.created_at
    ? Math.max(1, Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000))
    : 1;

  const stats = [
    { icon: Layers, label: "Protocolos Salvos", value: String(protocolCount), change: protocolCount > 0 ? "Veja seus protocolos" : "Use o Finder" },
    { icon: FlaskConical, label: "Peptídeos no DB", value: String(peptideCount), change: "Biblioteca completa" },
    { icon: Target, label: "Recomendações", value: "0", change: "Use o Finder" },
    { icon: Clock, label: "Dias na Plataforma", value: String(daysSinceJoined), change: daysSinceJoined === 1 ? "Bem-vindo!" : `${daysSinceJoined} dias ativos` },
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

      {/* Recent Protocols */}
      <Card className="border-border/40 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Protocolos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {protocols.length > 0 ? (
            <div className="space-y-2">
              {protocols.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-secondary/20 p-3">
                  <div className="flex items-center gap-2">
                    <Syringe className="h-3.5 w-3.5 text-primary" />
                    <div>
                      <p className="text-xs font-medium text-foreground">{p.name}</p>
                      <p className="text-[9px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <span className="text-[9px] text-muted-foreground capitalize">{p.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Nenhum protocolo salvo</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">Use o Finder para gerar seu primeiro protocolo</p>
              <Button size="sm" className="mt-3 gap-1 text-xs" onClick={() => navigate("/finder")}>
                Gerar Protocolo <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
