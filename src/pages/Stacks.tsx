import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Layers, Search, Clock,
  CheckCircle2
} from "lucide-react";
import ProBadge from "@/components/ProBadge";
import { getCatConfig, getCatIcon } from "@/components/stacks/stackUtils";
import { stackImages } from "@/assets/stacks";
import UsageBadge from "@/components/UsageBadge";
import { useStacks } from "@/hooks/useStacks";
import type { Stack } from "@/types";
import { STACK_CATEGORIES } from "@/types";
import { useEntitlements } from "@/hooks/useEntitlements";

export default function Stacks() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const { isAdmin, isPro } = useEntitlements();
  const hasAccess = isAdmin || isPro;

  const handleOpenStack = useCallback((stack: Stack) => {
    navigate(`/app/stacks/${stack.id}`);
  }, [navigate]);

  const { data: stacks, isLoading } = useStacks();

  const filtered = useMemo(() => {
    if (!stacks) return [];
    let result = stacks;
    if (selectedCategory !== "Todos") {
      result = result.filter((s) => s.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.subtitle || "").toLowerCase().includes(q) ||
          (s.description || "").toLowerCase().includes(q) ||
          s.peptides.some((p) => p.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [stacks, selectedCategory, search]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <Layers className="inline h-4.5 w-4.5 mr-2 text-primary" />
            Biblioteca de Stacks
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Combinações sinérgicas de peptídeos com protocolos completos por objetivo
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <UsageBadge feature="stack" />
          <Badge variant="secondary" className="text-[10px]">{stacks?.length ?? 0} stacks</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STACK_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          const config = cat !== "Todos" ? getCatConfig(cat) : null;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-3.5 py-1.5 text-[11px] font-medium border transition-colors ${
                isActive
                  ? cat === "Todos"
                    ? "bg-primary text-primary-foreground border-primary"
                    : `${config!.bgColor} ${config!.color} ${config!.borderColor}`
                  : "bg-transparent border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Buscar por nome, objetivo ou peptídeo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-xs" />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-xl bg-card/50 animate-pulse border border-border/20" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum stack encontrado.</p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((stack) => {
            const config = getCatConfig(stack.category);
            const IconComp = getCatIcon(stack.category);
            return (
              <button
                key={stack.id}
                onClick={() => handleOpenStack(stack)}
                className="group text-left rounded-xl border border-border/20 bg-card/60 overflow-hidden hover:border-border/40 hover:bg-card/80 transition-all duration-200 relative"
              >
                {/* Stack image */}
                <div className="relative h-28 overflow-hidden">
                  {stackImages[stack.category] ? (
                    <img
                      src={stackImages[stack.category]}
                      alt={stack.category}
                      loading="lazy"
                      className="h-full w-full object-cover opacity-80 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110"
                    />
                  ) : (
                    <div className={`h-full ${config.bgColor}`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                  <span className="absolute left-2.5 top-2.5 rounded-md bg-background/70 px-1.5 py-0.5 text-[9px] font-medium text-foreground backdrop-blur-sm">
                    {stack.category}
                  </span>
                  {!hasAccess && (
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <ProBadge />
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors mb-0.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {stack.name}
                  </h3>
                  {stack.subtitle && <p className="text-[11px] text-muted-foreground mb-3">{stack.subtitle}</p>}
                  <div className="space-y-1.5 mb-3">
                    {stack.peptides.map((p) => (
                      <div key={p.name} className="flex items-baseline gap-2">
                        <span className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${config.color.replace("text-", "bg-")}`} />
                        <span className="text-[11px]">
                          <span className="font-semibold text-foreground/90">{p.name}</span>
                          <span className="text-muted-foreground"> – {p.dose.split(" ")[0]}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    {stack.duration && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
                        <Clock className="h-3 w-3" /> {stack.duration}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Sinergia Verificada</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
