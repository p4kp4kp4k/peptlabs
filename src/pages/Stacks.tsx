import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Layers, Users, Target, ArrowRight, Sparkles, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import type { Json } from "@/integrations/supabase/types";

interface Stack {
  nome: string;
  descricao?: string;
  peptideos: string[];
  objetivo: string;
}

interface PeptideWithStacks {
  name: string;
  slug: string;
  category: string;
  stacks: Stack[];
}

function normalizeStacks(stacks: Json | null): Stack[] {
  if (!stacks || !Array.isArray(stacks)) return [];
  return stacks as unknown as Stack[];
}

// Flatten all stacks with source peptide info, grouped by objetivo/category
interface FlatStack extends Stack {
  sourcePeptide: string;
  sourceSlug: string;
  sourceCategory: string;
}

const objectiveIcons: Record<string, string> = {
  "Cognição": "🧠",
  "Sono": "🌙",
  "Recuperação": "💪",
  "Emagrecimento": "🔥",
  "Anti-aging": "✨",
  "Longevidade": "🧬",
  "GH": "📈",
  "Neuroproteção": "🛡️",
  "Performance": "⚡",
  "Metabolismo": "🔬",
  "Saúde": "❤️",
};

function getObjectiveIcon(objetivo: string): string {
  for (const [key, icon] of Object.entries(objectiveIcons)) {
    if (objetivo.toLowerCase().includes(key.toLowerCase())) return icon;
  }
  return "💊";
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
          all.push({
            ...s,
            sourcePeptide: p.name,
            sourceSlug: p.slug,
            sourceCategory: p.category,
          });
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

  // Group filtered stacks by objetivo
  const grouped = useMemo(() => {
    const map = new Map<string, FlatStack[]>();
    for (const s of filtered) {
      const key = s.objetivo;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Layers className="h-4.5 w-4.5 text-primary" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Biblioteca de Stacks
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
          Combinações pré-montadas de peptídeos para objetivos específicos. Cada stack foi elaborado com base em sinergias comprovadas.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/60 px-3 py-2">
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-muted-foreground">Total:</span>
          <span className="text-xs font-bold text-foreground">{flatStacks.length} stacks</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/60 px-3 py-2">
          <Target className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs text-muted-foreground">Objetivos:</span>
          <span className="text-xs font-bold text-foreground">{new Set(flatStacks.map(s => s.objetivo)).size}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border/30 bg-card/60 px-3 py-2">
          <Users className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs text-muted-foreground">Categorias:</span>
          <span className="text-xs font-bold text-foreground">{categories.length}</span>
        </div>
      </div>

      {/* Search + Category Filters */}
      <div className="space-y-3">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar stacks, peptídeos, objetivos..."
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-card/50 animate-pulse border border-border/20" />
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

      {/* Grouped stacks */}
      {!isLoading && grouped.map(([objetivo, stacks]) => (
        <div key={objetivo} className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getObjectiveIcon(objetivo)}</span>
            <h2 className="text-sm font-bold text-foreground">{objetivo}</h2>
            <Badge variant="outline" className="text-[10px] text-muted-foreground ml-1">
              {stacks.length} {stacks.length === 1 ? "stack" : "stacks"}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stacks.map((stack, i) => (
                <Link
                  key={`${stack.sourceSlug}-${i}`}
                  to={`/peptide/${stack.sourceSlug}`}
                  className="group rounded-xl border border-border/25 bg-card/70 p-3.5 hover:border-primary/30 hover:bg-card transition-all duration-200"
                >
                  {/* Stack name + arrow */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {stack.nome}
                    </h3>
                    <ArrowRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors" />
                  </div>

                  {/* Category badge */}
                  <Badge variant="outline" className="text-[9px] bg-primary/15 text-primary border-primary/25 font-semibold px-2 mb-2.5">
                    {stack.sourceCategory}
                  </Badge>

                  {/* Peptides in stack */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {stack.peptideos.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground/80 border border-border/20"
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  {stack.descricao && (
                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 mb-2.5">
                      {stack.descricao}
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/15">
                    <span className="text-[10px] text-muted-foreground/60">
                      Fonte: {stack.sourcePeptide}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-primary/60 group-hover:text-primary transition-colors">
                      <Sparkles className="h-2.5 w-2.5" />
                      <span>{stack.peptideos.length} peptídeos</span>
                    </div>
                  </div>
                </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
