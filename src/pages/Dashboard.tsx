import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePeptideCount } from "@/hooks/usePeptides";
import { useUserProtocolCount, useUserProtocols } from "@/hooks/useProtocols";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Layers, Search, Calculator, Sparkles, ArrowRight,
  Activity, Target, Clock, FlaskConical, Syringe,
  ArrowLeftRight, History, TrendingUp
} from "lucide-react";

export default function Dashboard() {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: peptideCount = 0, isLoading: pepLoading } = usePeptideCount();
  const { data: protocolCount = 0, isLoading: protLoading } = useUserProtocolCount();
  const { data: protocols = [], isLoading: protListLoading } = useUserProtocols();
  const isLoading = pepLoading || protLoading;

  const quickActions = [
    { icon: Search, label: "Finder", desc: "Gerar protocolo", path: "/app/finder", color: "text-primary" },
    { icon: Layers, label: "Biblioteca", desc: `${peptideCount} peptídeos`, path: "/app/peptides", color: "text-success" },
    { icon: ArrowLeftRight, label: "Comparador", desc: "Comparar 2+", path: "/app/compare", color: "text-accent" },
    { icon: Calculator, label: "Calculadora", desc: "Doses e reconstituição", path: "/app/calculator", color: "text-warning" },
  ];

  const daysSinceJoined = user?.created_at
    ? Math.max(1, Math.floor((Date.now() - new Date(user.created_at).getTime()) / 86400000))
    : 1;

  const stats = [
    { icon: FlaskConical, label: "Peptídeos", value: String(peptideCount), sub: "no banco de dados" },
    { icon: Layers, label: "Protocolos", value: String(protocolCount), sub: protocolCount > 0 ? "salvos" : "crie o primeiro" },
    { icon: Target, label: "Recomendações", value: "0", sub: "use o Finder" },
    { icon: Clock, label: "Dias Ativos", value: String(daysSinceJoined), sub: daysSinceJoined === 1 ? "bem-vindo!" : "na plataforma" },
  ];

  return (
    <div className="p-4 sm:p-5 space-y-5 max-w-6xl mx-auto">
      {/* Welcome */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Olá, {profile?.display_name || user?.email?.split("@")[0] || "Usuário"} 👋
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Seu painel de peptídeos personalizado</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3.5">
                  <Skeleton className="h-7 w-7 rounded-md mb-2.5" />
                  <Skeleton className="h-7 w-16 mb-1" />
                  <Skeleton className="h-3 w-20 mb-0.5" />
                  <Skeleton className="h-2.5 w-14" />
                </CardContent>
              </Card>
            ))
          : stats.map((s) => (
              <Card key={s.label} className="hover:border-primary/20 transition-colors">
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/8">
                      <s.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">{s.sub}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Acesso Rápido</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {quickActions.map((a) => (
            <Card
              key={a.label}
              className="group cursor-pointer transition-colors hover:border-primary/20"
              onClick={() => navigate(a.path)}
            >
              <CardContent className="flex flex-col items-center gap-1.5 p-3.5">
                <a.icon className={`h-4.5 w-4.5 ${a.color} transition-transform duration-150 group-hover:scale-110`} />
                <span className="text-xs font-medium text-foreground">{a.label}</span>
                <span className="text-[10px] text-muted-foreground">{a.desc}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Protocols */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Protocolos Recentes</CardTitle>
            {protocols.length > 0 && (
              <Button variant="ghost" size="sm" className="text-[10px] text-primary gap-1 h-6" onClick={() => navigate("/app/history")}>
                Ver todos <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {protocols.length > 0 ? (
            <div className="space-y-1.5">
              {protocols.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md bg-secondary/40 p-3 hover:bg-secondary/60 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Syringe className="h-3.5 w-3.5 text-primary" />
                    <div>
                      <p className="text-xs font-medium text-foreground">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] text-primary capitalize">{p.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <Activity className="h-7 w-7 text-muted-foreground/15 mb-3" />
              <p className="text-xs text-muted-foreground">Nenhum protocolo salvo</p>
              <p className="text-[10px] text-muted-foreground/50 mt-1">Use o Finder para gerar seu primeiro protocolo</p>
              <Button size="sm" className="mt-3 gap-1.5 text-xs" onClick={() => navigate("/app/finder")}>
                <Sparkles className="h-3 w-3" /> Gerar Protocolo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
