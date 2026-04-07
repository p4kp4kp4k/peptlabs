import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Layers, Search, Heart, Brain, Zap, Shield, Sparkles, Dumbbell,
  Sun, Clock, Leaf, FlaskConical, Pill
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import type { Json } from "@/integrations/supabase/types";

interface Stack {
  nome: string;
  descricao?: string;
  peptideos: string[];
  objetivo: string;
}

interface FlatStack extends Stack {
  sourcePeptide: string;
  sourceSlug: string;
  sourceCategory: string;
}

function normalizeStacks(stacks: Json | null): Stack[] {
  if (!stacks || !Array.isArray(stacks)) return [];
  return stacks as unknown as Stack[];
}

const categoryConfig: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  "Recuperação": { color: "text-emerald-400", bgColor: "bg-emerald-500/15", borderColor: "border-emerald-500/30" },
  "Emagrecimento": { color: "text-orange-400", bgColor: "bg-orange-500/15", borderColor: "border-orange-500/30" },
  "Nootrópicos": { color: "text-violet-400", bgColor: "bg-violet-500/15", borderColor: "border-violet-500/30" },
  "Cognição": { color: "text-violet-400", bgColor: "bg-violet-500/15", borderColor: "border-violet-500/30" },
  "Longevidade": { color: "text-amber-400", bgColor: "bg-amber-500/15", borderColor: "border-amber-500/30" },
  "Performance": { color: "text-cyan-400", bgColor: "bg-cyan-500/15", borderColor: "border-cyan-500/30" },
  "Imunidade": { color: "text-rose-400", bgColor: "bg-rose-500/15", borderColor: "border-rose-500/30" },
  "Estética": { color: "text-pink-400", bgColor: "bg-pink-500/15", borderColor: "border-pink-500/30" },
  "Anti-aging": { color: "text-fuchsia-400", bgColor: "bg-fuchsia-500/15", borderColor: "border-fuchsia-500/30" },
  "Metabolismo": { color: "text-amber-400", bgColor: "bg-amber-500/15", borderColor: "border-amber-500/30" },
  "Hormonal": { color: "text-blue-400", bgColor: "bg-blue-500/15", borderColor: "border-blue-500/30" },
  "GH / Secretagogos": { color: "text-teal-400", bgColor: "bg-teal-500/15", borderColor: "border-teal-500/30" },
  "Cardiovascular": { color: "text-red-400", bgColor: "bg-red-500/15", borderColor: "border-red-500/30" },
  "Sono / Recuperação": { color: "text-indigo-400", bgColor: "bg-indigo-500/15", borderColor: "border-indigo-500/30" },
  "Biorregulador": { color: "text-teal-400", bgColor: "bg-teal-500/15", borderColor: "border-teal-500/30" },
  "Sexual": { color: "text-red-400", bgColor: "bg-red-500/15", borderColor: "border-red-500/30" },
  "Antioxidante": { color: "text-lime-400", bgColor: "bg-lime-500/15", borderColor: "border-lime-500/30" },
  "Neuroproteção": { color: "text-violet-400", bgColor: "bg-violet-500/15", borderColor: "border-violet-500/30" },
};

function getCatConfig(cat: string) {
  return categoryConfig[cat] || { color: "text-primary", bgColor: "bg-primary/15", borderColor: "border-primary/30" };
}

const categoryIcons: Record<string, React.ElementType> = {
  "Recuperação": Heart,
  "Emagrecimento": Zap,
  "Nootrópicos": Brain,
  "Cognição": Brain,
  "Longevidade": Sparkles,
  "Performance": Dumbbell,
  "Imunidade": Shield,
  "Estética": Sun,
  "Anti-aging": Sparkles,
  "Metabolismo": FlaskConical,
  "Hormonal": Pill,
  "GH / Secretagogos": Zap,
  "Cardiovascular": Heart,
  "Sono / Recuperação": Clock,
  "Biorregulador": Leaf,
  "Neuroproteção": Shield,
};

function getCatIcon(cat: string) {
  return categoryIcons[cat] || Layers;
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

  // Unique categories from stacks for filter
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
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Biblioteca de Stacks
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Combinações sinérgicas de peptídeos com protocolos completos por objetivo.
        </p>
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
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
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
            {filtered.map((stack, i) => {
              const config = getCatConfig(stack.sourceCategory);
              const IconComp = getCatIcon(stack.sourceCategory);
              return (
                <Link
                  key={`${stack.sourceSlug}-${i}`}
                  to={`/peptide/${stack.sourceSlug}`}
                  className="group rounded-xl border border-border/20 bg-card/60 p-4 hover:border-border/40 hover:bg-card/80 transition-all duration-200"
                >
                  {/* Top row: icon + category badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${config.bgColor}`}>
                      <IconComp className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${config.bgColor} ${config.color} ${config.borderColor} font-semibold px-2 py-0.5`}
                    >
                      {stack.sourceCategory}
                    </Badge>
                  </div>

                  {/* Stack name */}
                  <h3 className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors mb-0.5">
                    {stack.nome}
                  </h3>

                  {/* Objetivo subtitle */}
                  <p className="text-[11px] text-muted-foreground mb-3">
                    {stack.objetivo}
                  </p>

                  {/* Peptide list with dots */}
                  <div className="space-y-1.5 mb-3">
                    {stack.peptideos.map((p) => (
                      <div key={p} className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                        <span className="text-[11px] font-medium text-foreground/90">{p}</span>
                      </div>
                    ))}
                  </div>

                  {/* Description if available */}
                  {stack.descricao && (
                    <p className="text-[10px] text-muted-foreground/70 leading-relaxed line-clamp-2">
                      {stack.descricao}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Footer count */}
          <p className="text-xs text-muted-foreground text-center pt-2">
            {filtered.length} stacks disponíveis
          </p>
        </>
      )}
    </div>
  );
}
