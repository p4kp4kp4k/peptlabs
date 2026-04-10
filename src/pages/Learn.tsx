import { useState } from "react";
import PremiumGateModal from "@/components/PremiumGateModal";
import { useNavigate, useParams } from "react-router-dom";
import {
  BookOpen,
  FlaskConical,
  Shield,
  Lock,
  Clock,
  Check,
  ArrowRight,
  Sparkles,
  GraduationCap,
  FileText,
  Microscope,
  AlertTriangle,
  Unlock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { guides, categoryGradients } from "@/data/peptides";
import { cn } from "@/lib/utils";
import { useEntitlements } from "@/hooks/useEntitlements";
import SafetyTab from "@/components/learn/SafetyTab";
import GuideDetailInline from "@/components/learn/GuideDetailInline";

type TabKey = "todos" | "guias" | "estudos" | "seguranca";

const tabs: { key: TabKey; label: string; icon: typeof BookOpen }[] = [
  { key: "todos", label: "Todos", icon: BookOpen },
  { key: "guias", label: "Guias Práticos", icon: GraduationCap },
  { key: "estudos", label: "Estudos & Ciência", icon: Microscope },
  { key: "seguranca", label: "Segurança", icon: AlertTriangle },
];

const categoryIcons: Record<string, typeof BookOpen> = {
  "Recuperação": FileText,
  "Nootrópicos": FlaskConical,
  "Estética": Sparkles,
  "Performance": ArrowRight,
  "Longevidade": Clock,
  "Neuro / Cognitivo": FlaskConical,
  "Fundamentos": BookOpen,
  "Segurança": Shield,
};

export default function Learn() {
  const { slug } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>("todos");
  const [gateOpen, setGateOpen] = useState(false);
  const { isPro, isAdmin } = useEntitlements();
  const hasFullAccess = isPro || isAdmin;
  const navigate = useNavigate();

  const filtered = activeTab === "todos" ? guides : guides.filter((g) => g.tab === activeTab);
  const showFeaturedGuide = activeTab === "todos" || activeTab === "guias";

  const tabCounts: Record<TabKey, number> = {
    todos: guides.length,
    guias: guides.filter((g) => g.tab === "guias").length,
    estudos: guides.filter((g) => g.tab === "estudos").length,
    seguranca: guides.filter((g) => g.tab === "seguranca").length,
  };

  return (
    <>
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Aprender
            </h1>
            <p className="text-xs text-muted-foreground">
              Guias, estudos científicos e segurança em um só lugar.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: "Guias Disponíveis", value: guides.length, icon: FileText },
          { label: "Conteúdo PRO", value: guides.filter((g) => g.isPro).length, icon: Lock },
          { label: "Gratuitos", value: guides.filter((g) => !g.isPro).length, icon: Check },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border/30 bg-card/60 p-3 text-center">
            <stat.icon className="mx-auto mb-1 h-4 w-4 text-primary/70" />
            <p className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {stat.value}
            </p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (slug) navigate("/app/learn");
              }}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-card border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold",
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}
              >
                {tabCounts[tab.key]}
              </span>
            </button>
          );
        })}
      </div>

      {slug ? (
        <GuideDetailInline slug={slug} />
      ) : (
        <>
          {showFeaturedGuide && (
            <div className="mb-6 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <BookOpen className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <Badge className="mb-2 border-0 bg-emerald-500/15 text-emerald-400 text-[9px]">GRATUITO · RECOMENDADO</Badge>
                  <h2 className="mb-2 text-base sm:text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    O Que São Peptídeos? Guia para Iniciantes
                  </h2>
                  <p className="mb-4 text-xs text-muted-foreground leading-relaxed max-w-xl">
                    Entenda o que são peptídeos, como funcionam no corpo, a história desde a insulina até os neuropeptídeos modernos e por que são diferentes de esteroides.
                  </p>
                  <Button size="sm" className="text-xs gap-1.5" onClick={() => navigate("/app/learn/o-que-sao-peptideos")}>
                    Ler Agora <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "seguranca" && <SafetyTab />}

          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((guide) => {
              const CatIcon = categoryIcons[guide.category] || FileText;
              return (
                <div
                  key={guide.slug}
                  onClick={() => {
                    if (guide.isPro && !hasFullAccess) return;
                    navigate(`/app/learn/${guide.slug}`);
                  }}
                  className={cn(
                    "group relative overflow-hidden rounded-xl border border-border/30 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5",
                    guide.isPro && !hasFullAccess ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                  )}
                >
                  <div className={cn("h-0.5 w-full bg-gradient-to-r", categoryGradients[guide.category] || "from-primary to-primary")} />

                  <div className="p-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/60 shrink-0">
                          <CatIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <Badge className={cn("border-0 bg-gradient-to-r text-[9px] text-white", categoryGradients[guide.category] || "from-primary to-primary")}>
                          {guide.category}
                        </Badge>
                      </div>

                      {guide.isPro && !hasFullAccess ? (
                        <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 shrink-0">
                          <Lock className="h-2.5 w-2.5 text-amber-400" />
                          <span className="text-[9px] font-semibold text-amber-400">PRO</span>
                        </div>
                      ) : guide.isPro && hasFullAccess ? (
                        <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 shrink-0">
                          <Unlock className="h-2.5 w-2.5 text-emerald-400" />
                          <span className="text-[9px] font-semibold text-emerald-400">DESBLOQUEADO</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 shrink-0">
                          <Check className="h-2.5 w-2.5 text-emerald-400" />
                          <span className="text-[9px] font-semibold text-emerald-400">GRÁTIS</span>
                        </div>
                      )}
                    </div>

                    <h3 className="mb-2 text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {guide.title}
                    </h3>
                    <p className="mb-4 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                      {guide.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-muted-foreground/60">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px]">{guide.date}</span>
                      </div>
                      <span className="text-[11px] font-medium text-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        {guide.isPro && !hasFullAccess ? "Desbloquear →" : "Ler →"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-xl border border-border/30 bg-card/60 p-12 text-center">
              <Microscope className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhum conteúdo disponível nesta categoria ainda.</p>
              <p className="mt-1 text-xs text-muted-foreground/60">Novos artigos são publicados semanalmente.</p>
            </div>
          )}

          {!hasFullAccess && (
            <div className="mt-10 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
              <div className="p-6 sm:p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h2 className="mb-2 text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Acesso completo à Central de Conhecimento
                </h2>
                <p className="mx-auto mb-8 max-w-md text-xs text-muted-foreground">
                  Desbloqueie todos os guias, estudos científicos e protocolos de segurança com evidência real.
                </p>

                <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
                  <div className="rounded-xl border border-border/30 bg-background p-5 text-left">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 mb-1">PRO Mensal</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        R$59<span className="text-sm font-bold">,90</span>
                      </p>
                      <span className="text-xs text-muted-foreground">/mês</span>
                    </div>
                    <p className="mb-4 text-[10px] text-muted-foreground">Cancele quando quiser</p>
                    <ul className="mb-4 space-y-2">
                      {["Biblioteca completa (78+ peptídeos)", "Protocolos e comparações ilimitados", "Calculadora avançada + presets", "Stack Builder PRO (até 10/mês)", "Body Map interativo", "Suporte prioritário"].map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" /> {feature}
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => navigate("/app/billing")}>Ativar PRO Mensal</Button>
                  </div>

                  <div className="relative rounded-xl border-2 border-primary bg-background p-5 text-left shadow-lg shadow-primary/10">
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="border-0 bg-primary text-primary-foreground text-[9px] shadow-lg">
                        Mais Escolhido
                      </Badge>
                    </div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-primary mb-1">PRO Vitalício</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>R$397</p>
                      <span className="text-[10px] text-muted-foreground line-through">R$794</span>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] px-1.5 py-0">-50%</Badge>
                    </div>
                    <p className="mb-4 text-[10px] text-muted-foreground">Pagamento único · Use para sempre</p>
                    <ul className="mb-4 space-y-2">
                      {["Tudo do PRO Mensal, mais:", "Acesso vitalício — pague uma vez", "Contato direto com fornecedores", "Stacks ilimitados (sem cap)", "Guias práticos atualizados", "Export PRO com timeline visual", "Suporte VIP dedicado"].map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" /> {feature}
                        </li>
                      ))}
                    </ul>
                    <Button size="sm" className="w-full text-xs" onClick={() => navigate("/app/billing")}>Garantir Acesso Vitalício</Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <PremiumGateModal open={gateOpen} onClose={() => setGateOpen(false)} reason="A Central de Conhecimento completa é exclusiva para assinantes." />
    </div>
    </>
  );
}
