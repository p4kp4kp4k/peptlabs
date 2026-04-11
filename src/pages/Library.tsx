import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, Loader2, Lock, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { categories } from "@/data/peptides";
import { usePeptides } from "@/hooks/usePeptides";
import { peptideImages } from "@/assets/peptides";
import { peptideVideos } from "@/assets/videos";
import { categoryGradients as catGradients } from "@/data/peptides";
import { LazyVideo } from "@/components/LazyVideo";
import { useEntitlements } from "@/hooks/useEntitlements";

const FREE_PEPTIDE_LIMIT = 1;

export default function Library() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: peptides = [], isLoading } = usePeptides();
  const { plan, isAdmin, isPro } = useEntitlements();

  const hasAccess = isAdmin || isPro;

  const filtered = useMemo(() => {
    return peptides
      .filter((p) => {
        const matchCat = activeCategory === "Todos" || p.category === activeCategory;
        const matchSearch = !searchTerm ||
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category.toLowerCase().includes(searchTerm.toLowerCase());
        return matchCat && matchSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [activeCategory, searchTerm, peptides]);

  const accessibleCount = hasAccess ? filtered.length : FREE_PEPTIDE_LIMIT;
  const totalCount = peptides.length || 78;

  const planLabel = hasAccess
    ? "PRO"
    : "GRÁTIS";

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Biblioteca de Peptídeos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Biblioteca completa com protocolos e referências científicas
        </p>
      </div>

      {/* Access bar */}
      <div className="mb-5 flex items-center justify-between rounded-lg border border-border/40 bg-card px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {hasAccess ? totalCount : FREE_PEPTIDE_LIMIT} de {totalCount}
            </span>{" "}
            peptídeos acessíveis
          </span>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${((hasAccess ? totalCount : FREE_PEPTIDE_LIMIT) / Math.max(totalCount, 1)) * 100}%` }}
            />
          </div>
        </div>
        <Badge className={`border-0 text-[10px] ${hasAccess ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
          {planLabel}
        </Badge>
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border/40 bg-card">
              <Skeleton className="h-28 w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-2.5 w-full" />
                <Skeleton className="h-2.5 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Peptide Grid */}
      {!isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((p, index) => {
            const isLocked = !hasAccess && index >= FREE_PEPTIDE_LIMIT;

            return (
              <div
                key={p.id}
                onClick={() => {
                  if (isLocked) {
                    navigate("/app/billing");
                  } else {
                    navigate(`/peptide/${p.slug}`);
                  }
                }}
                className={`group relative cursor-pointer overflow-hidden rounded-xl border transition-all ${
                  isLocked
                    ? "border-border/30 bg-card/60"
                    : "border-border/40 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                }`}
              >
                {/* Image / Video */}
                <div className={`relative h-28 overflow-hidden ${isLocked ? "brightness-[0.35] saturate-[0.2]" : ""}`}>
                  {peptideVideos[p.slug] ? (
                    isLocked ? (
                      // Don't load video for locked cards — show poster or gradient
                      peptideImages[p.slug] ? (
                        <img
                          src={peptideImages[p.slug]}
                          alt={p.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className={`h-full bg-gradient-to-br ${catGradients[p.category] || "from-gray-500 to-gray-700"}`} />
                      )
                    ) : (
                      <LazyVideo
                        src={peptideVideos[p.slug]}
                        poster={peptideImages[p.slug]}
                        className="h-full w-full object-cover opacity-80 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110"
                      />
                    )
                  ) : peptideImages[p.slug] ? (
                    <img
                      src={peptideImages[p.slug]}
                      alt={p.name}
                      loading="lazy"
                      className={`h-full w-full object-cover ${isLocked ? "" : "opacity-80 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110"}`}
                    />
                  ) : (
                    <div className={`h-full bg-gradient-to-br ${catGradients[p.category] || "from-gray-500 to-gray-700"} ${isLocked ? "" : "opacity-80 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110"}`} />
                  )}

                  {/* Category badge */}
                  <span className="absolute left-2 top-2 rounded-md bg-background/70 px-1.5 py-0.5 text-[9px] font-medium text-foreground backdrop-blur-sm">
                    {p.category}
                  </span>

                  {/* Tier badge */}
                  {isLocked ? (
                    <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-muted/90 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground backdrop-blur-sm">
                      <Lock className="h-2.5 w-2.5" />
                      PRO
                    </span>
                  ) : hasAccess ? (
                    <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-semibold text-white backdrop-blur-sm">
                      <Crown className="h-2.5 w-2.5" />
                      PRO
                    </span>
                  ) : (
                    <span className="absolute right-2 top-2 rounded-full bg-primary/90 px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground">
                      GRÁTIS
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className={`p-3 ${isLocked ? "opacity-50" : ""}`}>
                  <h3 className="text-xs font-semibold leading-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {p.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                    {isLocked ? (p.benefits?.slice(0, 2).join(" · ") || p.description?.slice(0, 50)) : p.description}
                  </p>
                </div>

                {/* Lock overlay */}
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/10 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex flex-col items-center gap-1 rounded-lg bg-background/80 px-3 py-2 backdrop-blur-sm border border-primary/20 shadow-lg">
                      <Crown className="h-4 w-4 text-primary" />
                      <span className="text-[10px] font-semibold text-foreground">Desbloquear</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Nenhum peptídeo encontrado para essa busca.
        </div>
      )}

      {/* Bottom CTA — only for free users */}
      {!hasAccess && (
        <div className="mt-8 rounded-xl border border-primary/20 bg-card p-6 text-center">
          <Crown className="mx-auto h-8 w-8 text-primary mb-2" />
          <p className="text-sm font-semibold text-foreground">
            Você está vendo apenas {FREE_PEPTIDE_LIMIT} de {totalCount} peptídeos
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Desbloqueie dosagens, protocolos e referências científicas completas
          </p>
          <Button
            className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => navigate("/app/billing")}
          >
            Fazer Upgrade
          </Button>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Dosagens, reconstituição, stacks e referências científicas
          </p>
        </div>
      )}
    </div>
  );
}
