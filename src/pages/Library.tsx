import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Lock, Star, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { categories, categoryGradients } from "@/data/peptides";
import { usePeptides } from "@/hooks/usePeptides";
import type { PeptideListItem } from "@/types";

export default function Library() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: peptides = [], isLoading } = usePeptides();

  const filtered = useMemo(() => {
    return peptides.filter((p) => {
      const matchCat = activeCategory === "Todos" || p.category === activeCategory;
      const matchSearch = !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchTerm, peptides]);

  const freeCount = 2;
  const totalCount = peptides.length;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Peptídeos Individuais
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Biblioteca completa com protocolos e referências científicas
        </p>
      </div>

      {/* Featured */}
      <div className="mb-6 rounded-xl border border-border/40 bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="h-20 w-20 shrink-0 rounded-lg bg-gradient-to-br from-orange-400 to-amber-600" />
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Badge className="border-0 bg-primary/15 text-primary text-[10px]">
                <Sparkles className="mr-1 h-3 w-3" /> PEPTÍDEO DO DIA
              </Badge>
              <span className="text-[10px] text-muted-foreground">Acesso gratuito por 24h</span>
            </div>
            <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Tirzepatide</h2>
            <p className="text-xs text-muted-foreground">Agonista duplo GIP/GLP-1 de última geração para emagrecimento.</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Perda de peso significativa", "Redução de HbA1c", "Melhora cardiovascular"].map((t) => (
                <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">{t}</span>
              ))}
            </div>
          </div>
          <Button size="sm" className="shrink-0 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
            <Sparkles className="h-3.5 w-3.5" /> Explorar Agora
          </Button>
        </div>
      </div>

      {/* Access bar */}
      <div className="mb-5 flex items-center justify-between rounded-lg border border-border/40 bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{freeCount} de {totalCount}</span> peptídeos acessíveis
          </span>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(freeCount / Math.max(totalCount, 1)) * 100}%` }} />
          </div>
        </div>
        <Badge className="border-0 bg-primary/15 text-primary text-[10px]">GRÁTIS</Badge>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar peptídeo por nome, categoria ou variante..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-10 border-border/50 bg-card pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-primary"
        />
      </div>

      {/* Category filters */}
      <div className="mb-6 flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Peptide Grid */}
      {!isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/peptide/${p.slug}`)}
              className="group cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className={`relative h-28 bg-gradient-to-br ${categoryGradients[p.category] || "from-gray-500 to-gray-700"} opacity-80 transition-opacity group-hover:opacity-100`}>
                <span className="absolute left-2 top-2 rounded-md bg-background/70 px-1.5 py-0.5 text-[9px] font-medium text-foreground backdrop-blur-sm">
                  {p.category}
                </span>
                <span className="absolute right-2 top-2 rounded-full bg-primary/90 px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
                  GRÁTIS
                </span>
              </div>
              <div className="p-3">
                <h3 className="text-xs font-semibold leading-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {p.name}
                </h3>
                <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Nenhum peptídeo encontrado para essa busca.
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-8 rounded-xl border border-primary/20 bg-card p-6 text-center">
        <p className="text-sm font-semibold text-foreground">Você está vendo apenas {freeCount} de {totalCount} peptídeos</p>
        <p className="mt-1 text-xs text-muted-foreground">Desbloqueie dosagens, protocolos e referências científicas completas</p>
        <Button className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
          Upgrade
        </Button>
        <p className="mt-2 text-[10px] text-muted-foreground">Dosagens, reconstituição, stacks e referências científicas</p>
      </div>
    </div>
  );
}
