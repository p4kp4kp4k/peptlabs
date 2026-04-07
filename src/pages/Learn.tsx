import { useState } from "react";
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
  const { isPremium, isAdmin } = useEntitlements();
  const hasFullAccess = isPremium || isAdmin;
  const navigate = useNavigate();

  const filtered = activeTab === "todos" ? guides : guides.filter((g) => g.tab === activeTab);

  const tabCounts: Record<TabKey, number> = {
    todos: guides.length,
    guias: guides.filter((g) => g.tab === "guias").length,
    estudos: guides.filter((g) => g.tab === "estudos").length,
    seguranca: guides.filter((g) => g.tab === "seguranca").length,
  };

  // On mobile, if slug is selected, show only the content
  // On desktop, always show two columns
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left Panel - Guide List */}
      <div
        className={cn(
          "shrink-0 border-r border-border/30 flex flex-col",
          slug ? "hidden md:flex md:w-80 lg:w-96" : "w-full md:w-80 lg:w-96"
        )}
      >
        {/* Header - fixed */}
        <div className="shrink-0 p-4 pb-0">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Aprender
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Guias, estudos e segurança
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="mb-3 grid grid-cols-3 gap-2">
            {[
              { label: "Guias", value: guides.length, icon: FileText },
              { label: "PRO", value: guides.filter((g) => g.isPro).length, icon: Lock },
              { label: "Grátis", value: guides.filter((g) => !g.isPro).length, icon: Check },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-border/30 bg-card/60 p-2 text-center">
                <stat.icon className="mx-auto mb-0.5 h-3 w-3 text-primary/70" />
                <p className="text-sm font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {stat.value}
                </p>
                <p className="text-[9px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5 pb-3">
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
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                      : "bg-card border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30"
                  )}
                >
                  <tab.icon className="h-3 w-3" />
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "ml-0.5 rounded-full px-1 py-0 text-[8px] font-bold",
                      isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {tabCounts[tab.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable guide list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-4">
          {activeTab === "seguranca" && <SafetyTab />}

          <div className="space-y-2">
            {filtered.map((guide) => {
              const CatIcon = categoryIcons[guide.category] || FileText;
              const isSelected = slug === guide.slug;
              return (
                <div
                  key={guide.slug}
                  onClick={() => {
                    if (guide.isPro && !hasFullAccess) return;
                    navigate(`/app/learn/${guide.slug}`);
                  }}
                  className={cn(
                    "group relative overflow-hidden rounded-lg border transition-all duration-200",
                    isSelected
                      ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/10"
                      : "border-border/30 bg-card hover:border-primary/30 hover:shadow-sm",
                    guide.isPro && !hasFullAccess ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                  )}
                >
                  <div className={cn("h-0.5 w-full bg-gradient-to-r", categoryGradients[guide.category] || "from-primary to-primary")} />

                  <div className="p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Badge className={cn("border-0 bg-gradient-to-r text-[8px] text-white px-1.5 py-0", categoryGradients[guide.category] || "from-primary to-primary")}>
                          {guide.category}
                        </Badge>
                      </div>

                      {guide.isPro && !hasFullAccess ? (
                        <div className="flex items-center gap-0.5 rounded-full bg-amber-500/10 px-1.5 py-0.5 shrink-0">
                          <Lock className="h-2 w-2 text-amber-400" />
                          <span className="text-[8px] font-semibold text-amber-400">PRO</span>
                        </div>
                      ) : guide.isPro && hasFullAccess ? (
                        <div className="flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 shrink-0">
                          <Unlock className="h-2 w-2 text-emerald-400" />
                          <span className="text-[8px] font-semibold text-emerald-400">DESBLOQUEADO</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 shrink-0">
                          <Check className="h-2 w-2 text-emerald-400" />
                          <span className="text-[8px] font-semibold text-emerald-400">GRÁTIS</span>
                        </div>
                      )}
                    </div>

                    <h3
                      className={cn(
                        "mb-1 text-[12px] font-semibold leading-snug transition-colors",
                        isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                      )}
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {guide.title}
                    </h3>
                    <p className="line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                      {guide.description}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 text-muted-foreground/50">
                      <Clock className="h-2.5 w-2.5" />
                      <span className="text-[9px]">{guide.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-lg border border-border/30 bg-card/60 p-8 text-center">
              <Microscope className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">Nenhum conteúdo nesta categoria.</p>
            </div>
          )}

          {/* Pricing CTA - only in list */}
          {!hasFullAccess && (
            <div className="mt-4 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-card p-4 text-center">
              <Sparkles className="mx-auto mb-2 h-5 w-5 text-primary" />
              <p className="text-[11px] font-semibold text-foreground mb-1">Acesso Completo</p>
              <p className="text-[9px] text-muted-foreground mb-3">Desbloqueie todos os guias e protocolos</p>
              <Button size="sm" className="text-[10px] h-7" onClick={() => navigate("/app/billing")}>
                Assinar PRO
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Content */}
      <div
        className={cn(
          "flex-1 min-w-0 flex flex-col",
          !slug ? "hidden md:flex" : "flex"
        )}
      >
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {slug ? (
            <div className="p-4 sm:p-6">
              <GuideDetailInline slug={slug} />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-6">
              <div className="text-center max-w-xs">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 border border-primary/10">
                  <BookOpen className="h-8 w-8 text-primary/30" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Selecione um guia
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Escolha um guia na lista ao lado para visualizar o conteúdo completo aqui.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
