import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import type { Json } from "@/integrations/supabase/types";
import { Layers, Search } from "lucide-react";
import { StackCard } from "@/components/stacks/StackCard";
import { categoryConfig, getCatConfig, getCatIcon } from "@/components/stacks/stackUtils";

interface Stack {
  nome: string;
  descricao?: string;
  peptideos: string[];
  objetivo: string;
}

export interface FlatStack extends Stack {
  sourcePeptide: string;
  sourceSlug: string;
  sourceCategory: string;
}

function normalizeStacks(stacks: Json | null): Stack[] {
  if (!stacks || !Array.isArray(stacks)) return [];
  return stacks as unknown as Stack[];
}

export default function Stacks() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: peptides, isLoading } = useQuery({
    queryKey: ["peptides-with-stacks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("peptides")
        .select("name, slug, category, stacks")
        .not("stacks", "is", null);
      if (error) throw error;
      return data;
    },
  });

  const flatStacks = useMemo(() => {
    if (!peptides) return [];
    const all: FlatStack[] = [];
    for (const p of peptides) {
      const stacks = normalizeStacks(p.stacks);
      for (const s of stacks) {
        if (s.nome && s.peptideos?.length) {
          all.push({ ...s, sourcePeptide: p.name, sourceSlug: p.slug, sourceCategory: p.category });
        }
      }
    }
    return all;
  }, [peptides]);

  const categories = useMemo(() => {
    const cats = new Set(flatStacks.map((s) => s.sourceCategory));
    return Array.from(cats).sort();
  }, [flatStacks]);

  const filtered = useMemo(() => {
    let result = flatStacks;
    if (selectedCategory) {
      result = result.filter((s) => s.sourceCategory === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.nome.toLowerCase().includes(q) ||
          s.objetivo.toLowerCase().includes(q) ||
          s.peptideos.some((p) => p.toLowerCase().includes(q)) ||
          s.sourcePeptide.toLowerCase().includes(q)
      );
    }
    return result;
  }, [flatStacks, selectedCategory, search]);

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
        <Badge variant="secondary" className="text-[10px] shrink-0">
          {flatStacks.length} stacks
        </Badge>
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

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
            !selectedCategory
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => {
          const config = getCatConfig(cat);
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
                selectedCategory === cat
                  ? `${config.bgColor} ${config.color} border ${config.borderColor}`
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-card/50 animate-pulse border border-border/20" />
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((stack, i) => (
              <StackCard key={`${stack.sourceSlug}-${i}`} stack={stack} />
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground text-center pt-2">
            {filtered.length} de {flatStacks.length} stacks
          </p>
        </>
      )}
    </div>
  );
}
