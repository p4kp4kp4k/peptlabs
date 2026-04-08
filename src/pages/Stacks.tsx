import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Layers, Search, Clock } from "lucide-react";
import { getCatConfig, getCatIcon } from "@/components/stacks/stackUtils";
import { useStacks } from "@/hooks/useStacks";
import type { Stack } from "@/types";
import { STACK_CATEGORIES } from "@/types";

export default function Stacks() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");

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
          <h1
            className="text-lg sm:text-xl font-bold text-foreground"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            <Layers className="inline h-4.5 w-4.5 mr-2 text-primary" />
            Biblioteca de Stacks
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Combinações sinérgicas de peptídeos com protocolos completos por objetivo
          </p>
        </div>
        <Badge variant="secondary" className="text-[10px] shrink-0">
          {stacks?.length ?? 0} stacks
        </Badge>
      </div>

      {/* Category filters - pill style like reference */}
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
        <Input
          placeholder="Buscar por nome, objetivo ou peptídeo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-xs"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-xl bg-card/50 animate-pulse border border-border/20" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum stack encontrado.</p>
        </div>
      )}

      {/* Stack cards grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((stack) => {
            const config = getCatConfig(stack.category);
            const IconComp = getCatIcon(stack.category);
            return (
              <button
                key={stack.id}
                onClick={() => setSelectedStack(stack)}
                className="group text-left rounded-xl border border-border/20 bg-card/60 p-5 hover:border-border/40 hover:bg-card/80 transition-all duration-200"
              >
                {/* Top row: icon + category badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.bgColor}`}>
                    <IconComp className={`h-5 w-5 ${config.color}`} />
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${config.bgColor} ${config.color} ${config.borderColor} font-semibold px-2.5 py-0.5`}
                  >
                    {stack.category}
                  </Badge>
                </div>

                {/* Stack name */}
                <h3
                  className="text-sm font-bold text-foreground group-hover:text-primary transition-colors mb-0.5"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {stack.name}
                </h3>

                {/* Subtitle */}
                {stack.subtitle && (
                  <p className="text-[11px] text-muted-foreground mb-3">{stack.subtitle}</p>
                )}

                {/* Peptide list with doses */}
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

                {/* Duration */}
                {stack.duration && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
                    <Clock className="h-3 w-3" />
                    {stack.duration}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedStack && (
        <StackDetailModal stack={selectedStack} onClose={() => setSelectedStack(null)} />
      )}
    </div>
  );
}

// ── Stack Detail Modal ──
import {
  X, Syringe, AlertTriangle, Lightbulb, CheckCircle2, Timer
} from "lucide-react";

function StackDetailModal({ stack, onClose }: { stack: Stack; onClose: () => void }) {
  const config = getCatConfig(stack.category);
  const IconComp = getCatIcon(stack.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border/40 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${config.bgColor}`}>
            <IconComp className={`h-5 w-5 ${config.color}`} />
          </div>
          <div className="flex-1 pr-6">
            <h3
              className="text-base font-bold text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {stack.name}
            </h3>
            {stack.subtitle && (
              <p className="text-[11px] text-muted-foreground">{stack.subtitle}</p>
            )}
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] ${config.bgColor} ${config.color} ${config.borderColor} font-semibold shrink-0`}
          >
            {stack.category}
          </Badge>
        </div>

        {/* Description */}
        {stack.description && (
          <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
            {stack.description}
          </p>
        )}

        {/* Protocol card */}
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 mb-4 space-y-3">
          <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Protocolo</p>
          {stack.peptides.map((p) => (
            <div key={p.name} className="flex items-start gap-2">
              <Syringe className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[12px] font-semibold text-foreground">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">Dose: {p.dose}</p>
              </div>
            </div>
          ))}
          {stack.duration && (
            <div className="flex items-center gap-2 pt-1 border-t border-primary/10">
              <Timer className="h-3.5 w-3.5 text-primary" />
              <p className="text-[11px] text-foreground">Duração: {stack.duration}</p>
            </div>
          )}
          {stack.timing && (
            <div className="flex items-start gap-2">
              <Clock className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground">{stack.timing}</p>
            </div>
          )}
        </div>

        {/* Benefits */}
        {stack.benefits && stack.benefits.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Benefícios Esperados
            </p>
            <ul className="space-y-1.5">
              {stack.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                  <span className="text-primary mt-0.5">•</span> {b}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {stack.warnings && stack.warnings.length > 0 && (
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3">
            <p className="text-[10px] font-semibold text-destructive mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Avisos e Monitoramento
            </p>
            <ul className="space-y-1">
              {stack.warnings.map((w) => (
                <li key={w} className="text-[10px] text-muted-foreground flex items-start gap-2">
                  <span className="text-destructive mt-0.5">⚠</span> {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
