import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PremiumGateModal from "@/components/PremiumGateModal";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Layers, Search, Clock, X, Syringe, AlertTriangle,
  CheckCircle2, Timer, GitMerge, ChevronRight, Lock
} from "lucide-react";
import ProBadge from "@/components/ProBadge";
import { getCatConfig, getCatIcon } from "@/components/stacks/stackUtils";
import { stackImages } from "@/assets/stacks";
import UsageBadge from "@/components/UsageBadge";
import { useStacks } from "@/hooks/useStacks";
import type { Stack } from "@/types";
import { STACK_CATEGORIES } from "@/types";
import { useEntitlements, checkFeature, incrementUsage } from "@/hooks/useEntitlements";
import { toast } from "sonner";

/* ─── Status badge ─── */
function StatusBadge({ status }: { status: string }) {
  const u = status.toUpperCase();
  if (u.includes("SINÉR") || u.includes("SINERG")) return <Badge className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold px-1.5">SINÉRGICO</Badge>;
  if (u.includes("COMPATÍV") || u.includes("COMPAT")) return <Badge className="text-[9px] bg-orange-500/15 text-orange-400 border border-orange-500/25 font-bold px-1.5">COMPATÍVEL</Badge>;
  if (u.includes("MONITOR") || u.includes("CAUTELA")) return <Badge className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/25 font-bold px-1.5">MONITORAR</Badge>;
  if (u.includes("EVITAR")) return <Badge className="text-[9px] bg-red-500/15 text-red-400 border border-red-500/25 font-bold px-1.5">EVITAR</Badge>;
  return <Badge variant="outline" className="text-[9px] font-bold px-1.5">{status}</Badge>;
}

/* ═══ Stack Detail Modal ═══ */
function StackModal({ stack, onClose }: { stack: Stack; onClose: () => void }) {
  const navigate = useNavigate();
  const config = getCatConfig(stack.category);
  const IconComp = getCatIcon(stack.category);

  const peptideNames = useMemo(() => stack.peptides.map(p => p.name), [stack]);

  const { data: peptideRows } = useQuery({
    queryKey: ["stack-peptides", peptideNames],
    queryFn: async () => {
      if (!peptideNames.length) return [];
      const { data, error } = await supabase
        .from("peptides")
        .select("name, slug, interactions, category, half_life, benefits")
        .in("name", peptideNames);
      if (error) throw error;
      return data ?? [];
    },
    enabled: peptideNames.length > 0,
  });

  // Cross-interactions
  const crossInteractions = useMemo(() => {
    if (!peptideRows || peptideRows.length < 2) return [];
    const namesSet = new Set(peptideNames.map(n => n.toLowerCase()));
    const results: Array<{ from: string; to: string; status: string; descricao: string }> = [];
    const seen = new Set<string>();
    for (const pep of peptideRows) {
      if (!pep.interactions) continue;
      const items: Array<{ nome: string; status: string; descricao: string }> = [];
      if (Array.isArray(pep.interactions)) {
        for (const item of pep.interactions as any[]) items.push({ nome: item.peptideo || "", status: item.tipo || "", descricao: item.descricao || "" });
      } else {
        const old = pep.interactions as any;
        if (old.peptideos) items.push(...old.peptideos);
      }
      for (const item of items) {
        if (namesSet.has(item.nome.toLowerCase()) && item.nome.toLowerCase() !== pep.name.toLowerCase()) {
          const key = [pep.name, item.nome].sort().join("|");
          if (!seen.has(key)) { seen.add(key); results.push({ from: pep.name, to: item.nome, status: item.status, descricao: item.descricao }); }
        }
      }
    }
    return results;
  }, [peptideRows, peptideNames]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl border border-border/40 bg-card shadow-2xl animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} className="absolute right-3 top-3 z-10 p-1 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-start gap-3 mb-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.bgColor} shrink-0`}>
              <IconComp className={`h-5 w-5 ${config.color}`} />
            </div>
            <div className="flex-1 pr-6 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                <Badge className={`text-[9px] ${config.bgColor} ${config.color} ${config.borderColor} font-bold px-2`}>{stack.category}</Badge>
                {stack.duration && (
                  <Badge variant="outline" className="text-[9px] border-border text-muted-foreground gap-1">
                    <Clock className="h-2.5 w-2.5" /> {stack.duration}
                  </Badge>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight leading-tight">{stack.name}</h2>
              {stack.subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{stack.subtitle}</p>}
            </div>
          </div>
          {stack.description && (
            <p className="text-[11px] text-muted-foreground leading-relaxed">{stack.description}</p>
          )}
        </div>

        <div className="px-5 pb-5 space-y-3">
          {/* ── Protocolo ── */}
          <div className="rounded-lg bg-primary/5 border border-primary/15 p-3.5 space-y-2.5">
            <p className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Syringe className="h-3 w-3" /> Protocolo
            </p>
            {stack.peptides.map((pep, i) => {
              const pepData = peptideRows?.find(r => r.name === pep.name);
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[9px] font-bold">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-foreground">{pep.name}</span>
                      {pepData && (
                        <button onClick={() => { onClose(); navigate(`/peptide/${pepData.slug}`); }} className="text-[9px] text-primary hover:underline flex items-center">
                          ver <ChevronRight className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                    <span className="text-[10px] text-primary/80 font-medium">{pep.dose}</span>
                  </div>
                </div>
              );
            })}
            {stack.timing && (
              <div className="flex items-start gap-2 pt-1.5 border-t border-primary/10">
                <Timer className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                <p className="text-[10px] text-muted-foreground">{stack.timing}</p>
              </div>
            )}
          </div>

          {/* ── Interações ── */}
          {crossInteractions.length > 0 && (
            <div className="rounded-lg border border-border/30 p-3.5 space-y-2">
              <p className="text-[10px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <GitMerge className="h-3 w-3 text-primary" /> Interações
              </p>
              {crossInteractions.map((inter, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px]">
                  <GitMerge className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-1 mb-0.5">
                      <span className="font-semibold text-foreground">{inter.from}</span>
                      <span className="text-muted-foreground">↔</span>
                      <span className="font-semibold text-foreground">{inter.to}</span>
                      <StatusBadge status={inter.status} />
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{inter.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {crossInteractions.length === 0 && peptideRows && peptideRows.length >= 2 && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <p className="text-[10px] text-muted-foreground">Sem interações adversas conhecidas entre os peptídeos deste stack.</p>
            </div>
          )}

          {/* ── Benefícios ── */}
          {stack.benefits && stack.benefits.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Benefícios
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {stack.benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                    <span className="text-emerald-400 mt-0.5">•</span> {b}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Avisos ── */}
          {stack.warnings && stack.warnings.length > 0 && (
            <div className="rounded-lg bg-destructive/5 border border-destructive/15 p-3">
              <p className="text-[10px] font-bold text-destructive mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" /> Avisos
              </p>
              <div className="space-y-1">
                {stack.warnings.map((w, i) => (
                  <p key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5">
                    <span className="text-destructive mt-0.5">⚠</span> {w}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══ Main Stacks Page ═══ */
export default function Stacks() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedStack, setSelectedStack] = useState<Stack | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateReason, setGateReason] = useState("");
  const { isAdmin, isPro, isStarter } = useEntitlements();
  const hasAccess = isAdmin || isPro || isStarter;

  const handleOpenStack = useCallback(async (stack: Stack) => {
    if (!hasAccess) {
      setGateOpen(true);
      return;
    }
    // Check usage limit (PRO has 10/month, free has 1/month)
    if (!isAdmin) {
      try {
        const { allowed, reason } = await checkFeature("stack_builder");
        if (!allowed) {
          setGateReason(reason || "Limite de stacks atingido neste mês.");
          setGateOpen(true);
          return;
        }
        await incrementUsage("stack_builder");
      } catch {
        // If check fails, allow access gracefully
      }
    }
    setSelectedStack(stack);
  }, [hasAccess, isAdmin]);

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
    <>
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
                className={`group text-left rounded-xl border border-border/20 bg-card/60 overflow-hidden hover:border-border/40 hover:bg-card/80 transition-all duration-200 relative`}
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
                  {/* Category badge */}
                  <span className="absolute left-2.5 top-2.5 rounded-md bg-background/70 px-1.5 py-0.5 text-[9px] font-medium text-foreground backdrop-blur-sm">
                    {stack.category}
                  </span>
                  {/* PRO badge for non-premium users */}
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

      {/* Modal */}
      {selectedStack && <StackModal stack={selectedStack} onClose={() => setSelectedStack(null)} />}
      <PremiumGateModal open={gateOpen} onClose={() => { setGateOpen(false); setGateReason(""); }} reason={gateReason || "Stacks sinérgicos são exclusivos para assinantes. Faça upgrade para acessar combinações otimizadas."} />
    </div>
    </>
  );
}
