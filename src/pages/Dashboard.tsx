import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePeptideCount } from "@/hooks/usePeptides";
import { useUserProtocolCount, useUserProtocols } from "@/hooks/useProtocols";
import {
  Layers, Search, Calculator, Sparkles, ArrowRight,
  Activity, Target, Clock, FlaskConical, Syringe,
  ArrowLeftRight, History, TrendingUp, Zap
} from "lucide-react";

export default function Dashboard() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: peptideCount = 0 } = usePeptideCount();
  const { data: protocolCount = 0 } = useUserProtocolCount();
  const { data: protocols = [] } = useUserProtocols();

  const quickActions = [
    { icon: Search, label: "Finder", desc: "Gerar protocolo", path: "/app/finder", gradient: "from-primary/20 to-primary/5", iconColor: "text-primary" },
    { icon: Layers, label: "Biblioteca", desc: `${peptideCount} peptídeos`, path: "/app/peptides", gradient: "from-success/20 to-success/5", iconColor: "text-success" },
    { icon: ArrowLeftRight, label: "Comparador", desc: "Comparar 2+", path: "/app/compare", gradient: "from-accent/20 to-accent/5", iconColor: "text-accent" },
    { icon: Calculator, label: "Calculadora", desc: "Doses e reconstituição", path: "/app/calculator", gradient: "from-warning/20 to-warning/5", iconColor: "text-warning" },
  ];

  const daysSinceJoined = user?.created_at
    ? Math.max(1, Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000))
    : 1;

  const stats = [
    { icon: FlaskConical, label: "Peptídeos", value: String(peptideCount), sub: "no banco de dados", color: "primary" },
    { icon: Layers, label: "Protocolos", value: String(protocolCount), sub: protocolCount > 0 ? "salvos" : "crie o primeiro", color: "accent" },
    { icon: Target, label: "Recomendações", value: "0", sub: "use o Finder", color: "blue" },
    { icon: Clock, label: "Dias Ativos", value: String(daysSinceJoined), sub: daysSinceJoined === 1 ? "bem-vindo!" : "na plataforma", color: "success" },
  ];

  const getGlowClass = (color: string) => {
    switch (color) {
      case "primary": return "from-primary/15 to-primary/5 border-primary/10";
      case "accent": return "from-accent/15 to-accent/5 border-accent/10";
      case "blue": return "from-blue-500/15 to-blue-500/5 border-blue-500/10";
      case "success": return "from-success/15 to-success/5 border-success/10";
      default: return "from-primary/15 to-primary/5 border-primary/10";
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case "primary": return "text-primary";
      case "accent": return "text-accent";
      case "blue": return "text-blue-400";
      case "success": return "text-success";
      default: return "text-primary";
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* Welcome */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-display">
          Olá, {profile?.display_name || user?.email?.split("@")[0] || "Usuário"} 👋
        </h1>
        <p className="text-sm text-muted-foreground/70">Seu painel de peptídeos personalizado</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="group relative rounded-xl border border-white/[0.06] bg-card/60 p-5 backdrop-blur-sm transition-all duration-300 hover:border-white/[0.1] hover:bg-card/80 card-holographic"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${getGlowClass(s.color)} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative z-10">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${getGlowClass(s.color)} border mb-4`}>
                <s.icon className={`h-5 w-5 ${getIconColor(s.color)}`} />
              </div>
              <p className="text-3xl font-bold tracking-tight text-foreground font-display">{s.value}</p>
              <p className="text-xs font-medium text-foreground/80 mt-1">{s.label}</p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-foreground/80 mb-4 uppercase tracking-wider font-display">Acesso Rápido</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {quickActions.map((a) => (
            <button
              key={a.label}
              className="group relative rounded-xl border border-white/[0.06] bg-card/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-card/60 text-left card-holographic"
              onClick={() => navigate(a.path)}
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${a.gradient} border border-white/[0.06] transition-transform duration-300 group-hover:scale-110`}>
                  <a.icon className={`h-5 w-5 ${a.iconColor} transition-all duration-300 group-hover:drop-shadow-[0_0_8px_currentColor]`} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-foreground">{a.label}</span>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5">{a.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Protocols */}
      <Card className="border-white/[0.04] bg-card/40">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-display">Protocolos Recentes</CardTitle>
            {protocols.length > 0 && (
              <Button variant="ghost" size="sm" className="text-[11px] text-primary gap-1.5 h-7 hover:bg-primary/[0.06]" onClick={() => navigate("/app/history")}>
                Ver todos <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {protocols.length > 0 ? (
            <div className="space-y-2">
              {protocols.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 hover:bg-white/[0.04] hover:border-white/[0.06] transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/[0.08] border border-primary/[0.1]">
                      <Syringe className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground/50">
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/[0.08] border border-primary/[0.12] px-2.5 py-1 text-[10px] font-medium text-primary capitalize">{p.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.02] border border-white/[0.04] mb-4">
                <Activity className="h-7 w-7 text-muted-foreground/20" />
              </div>
              <p className="text-sm font-medium text-muted-foreground/60">Nenhum protocolo salvo</p>
              <p className="text-xs text-muted-foreground/40 mt-1 max-w-xs">Use o Finder para gerar seu primeiro protocolo personalizado</p>
              <Button size="sm" className="mt-5 gap-2" onClick={() => navigate("/app/finder")}>
                <Sparkles className="h-3.5 w-3.5" /> Gerar Protocolo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
