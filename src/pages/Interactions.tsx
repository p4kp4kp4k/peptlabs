import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Triangle, ArrowRight, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import type { Json } from "@/integrations/supabase/types";
import type { Json } from "@/integrations/supabase/types";

interface NormalizedInteraction {
  nome: string;
  status: string;
  descricao: string;
}

interface PeptideInteractions {
  name: string;
  slug: string;
  category: string;
  interactions: NormalizedInteraction[];
}

function normalizeInteractions(data: Json | null): NormalizedInteraction[] {
  if (!data) return [];
  if (Array.isArray(data)) {
    return (data as any[]).map((item) => ({
      nome: item.peptideo || item.nome || "",
      status: (item.tipo || item.status || "").toUpperCase(),
      descricao: item.descricao || "",
    }));
  }
  const old = data as any;
  return [
    ...(old.peptideos || []).map((i: any) => ({
      nome: i.nome || "",
      status: (i.status || "").toUpperCase(),
      descricao: i.descricao || "",
    })),
    ...(old.outras_substancias || []).map((i: any) => ({
      nome: i.nome || "",
      status: (i.status || "").toUpperCase(),
      descricao: i.descricao || "",
    })),
  ];
}

function getStatusInfo(status: string) {
  const s = status.toUpperCase();
  if (s.includes("SINÉR") || s.includes("SINERG") || s.includes("COMPATÍV"))
    return { label: "SINÉRGICO", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" };
  if (s.includes("COMPLEMENTAR"))
    return { label: "COMPLEMENTAR", color: "bg-sky-500/15 text-sky-400 border-sky-500/25" };
  if (s.includes("MONITOR") || s.includes("CAUTELA"))
    return { label: "MONITORAR", color: "bg-amber-500/15 text-amber-400 border-amber-500/25" };
  if (s.includes("EVITAR"))
    return { label: "EVITAR", color: "bg-red-500/15 text-red-400 border-red-500/25" };
  return { label: status, color: "bg-secondary text-muted-foreground border-border/30" };
}

type StatusFilter = "all" | "synergic" | "complementary" | "caution" | "avoid";

export default function Interactions() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data: peptides, isLoading } = useQuery({
    queryKey: ["peptides-interactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("peptides")
        .select("name, slug, category, interactions")
        .not("interactions", "is", null);
      if (error) throw error;
      return data;
    },
  });

  const allPeptides = useMemo<PeptideInteractions[]>(() => {
    if (!peptides) return [];
    return peptides
      .map((p) => ({
        name: p.name,
        slug: p.slug,
        category: p.category,
        interactions: normalizeInteractions(p.interactions),
      }))
      .filter((p) => p.interactions.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [peptides]);

  const categories = useMemo(() => {
    return Array.from(new Set(allPeptides.map((p) => p.category))).sort();
  }, [allPeptides]);

  const stats = useMemo(() => {
    const all = allPeptides.flatMap((p) => p.interactions);
    return {
      total: all.length,
      synergic: all.filter((i) => getStatusInfo(i.status).label === "SINÉRGICO").length,
      complementary: all.filter((i) => getStatusInfo(i.status).label === "COMPLEMENTAR").length,
      caution: all.filter((i) => getStatusInfo(i.status).label === "MONITORAR").length,
      avoid: all.filter((i) => getStatusInfo(i.status).label === "EVITAR").length,
    };
  }, [allPeptides]);

  const filtered = useMemo(() => {
    let result = allPeptides;

    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.interactions.some(
            (i) => i.nome.toLowerCase().includes(q) || i.descricao.toLowerCase().includes(q)
          )
      );
    }

    if (statusFilter !== "all") {
      const filterMap: Record<StatusFilter, string> = {
        all: "",
        synergic: "SINÉRGICO",
        complementary: "COMPLEMENTAR",
        caution: "MONITORAR",
        avoid: "EVITAR",
      };
      const target = filterMap[statusFilter];
      result = result
        .map((p) => ({
          ...p,
          interactions: p.interactions.filter((i) => getStatusInfo(i.status).label === target),
        }))
        .filter((p) => p.interactions.length > 0);
    }

    return result;
  }, [allPeptides, selectedCategory, search, statusFilter]);

  const statusFilters: { key: StatusFilter; label: string; count: number; dot: string }[] = [
    { key: "all", label: "Todos", count: stats.total, dot: "bg-muted-foreground" },
    { key: "synergic", label: "Sinérgicos", count: stats.synergic, dot: "bg-emerald-400" },
    { key: "complementary", label: "Complementares", count: stats.complementary, dot: "bg-sky-400" },
    { key: "caution", label: "Monitorar", count: stats.caution, dot: "bg-amber-400" },
    { key: "avoid", label: "Evitar", count: stats.avoid, dot: "bg-red-400" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Triangle className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Interações entre Peptídeos
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
          Matriz de compatibilidade entre peptídeos e outras substâncias. Consulte antes de montar seus protocolos.
        </p>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((sf) => (
          <button
            key={sf.key}
            onClick={() => setStatusFilter(sf.key)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              statusFilter === sf.key
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/30 bg-card/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${sf.dot}`} />
            {sf.label}
            <span className="text-[10px] font-bold opacity-70">{sf.count}</span>
          </button>
        ))}
      </div>

      {/* Search + Category */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar peptídeos ou substâncias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-xs border-border/40 bg-card/60"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full px-3 py-1 text-[10px] font-semibold transition-colors ${
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`rounded-full px-3 py-1 text-[10px] font-semibold transition-colors ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-card/50 animate-pulse border border-border/20" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <Triangle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma interação encontrada.</p>
        </div>
      )}

      {/* Interaction cards */}
      {!isLoading && filtered.map((peptide) => {
        const catColor = getCategoryColor(peptide.category);
        return (
          <div key={peptide.slug} className="rounded-xl border border-border/25 bg-card/70 overflow-hidden">
            {/* Peptide header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/15 bg-card/40">
              <div className="flex items-center gap-3 min-w-0">
                <Link
                  to={`/peptide/${peptide.slug}`}
                  className="text-sm font-bold text-foreground hover:text-primary transition-colors truncate"
                >
                  {peptide.name}
                </Link>
                <Badge variant="outline" className="text-[9px] bg-primary/15 text-primary border-primary/25 font-semibold px-2 shrink-0">
                  {peptide.category}
                </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {peptide.interactions.length} interações
              </span>
            </div>

            {/* Interactions table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/20">
                    <th className="text-left py-2 px-4 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider w-[180px]">
                      Substância
                    </th>
                    <th className="text-left py-2 px-4 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider w-[120px]">
                      Status
                    </th>
                    <th className="text-left py-2 px-4 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">
                      Descrição
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {peptide.interactions.map((interaction, i) => {
                    const info = getStatusInfo(interaction.status);
                    return (
                      <tr
                        key={i}
                        className="border-b border-border/10 last:border-0 hover:bg-secondary/20 transition-colors"
                      >
                        <td className="py-2.5 px-4 text-foreground font-medium whitespace-nowrap">
                          {interaction.nome}
                        </td>
                        <td className="py-2.5 px-4">
                          <Badge className={`text-[9px] ${info.color} border font-bold px-2`}>
                            {info.label}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-muted-foreground leading-relaxed">
                          {interaction.descricao}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
