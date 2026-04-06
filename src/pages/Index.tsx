import { useState, useMemo } from "react";
import { Search, Sparkles, Lock, Zap, FlaskConical, ChevronRight, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { peptides, categories, categoryGradients, featuredPeptide } from "@/data/peptides";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = useMemo(() => {
    return peptides.filter((p) => {
      const matchesCategory = activeCategory === "Todos" || p.category === activeCategory;
      const matchesSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm]);

  const categoryCount = useMemo(() => {
    const counts: Record<string, number> = { Todos: peptides.length };
    peptides.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Peptídeos<span className="text-primary">Health</span>
            </span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Biblioteca</a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Protocolos</a>
            <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Artigos</a>
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Acesso PRO
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Hero - Peptídeo do Dia */}
        <section className="mb-10">
          <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 sm:p-8">
            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Peptídeo do Dia
                  </span>
                </div>
                <h1 className="mb-2 text-3xl font-bold text-foreground sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {featuredPeptide.name}
                </h1>
                <Badge className="mb-4 border-0 bg-primary/15 text-primary">
                  {featuredPeptide.category}
                </Badge>
                <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {featuredPeptide.description}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-3">
                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  Explorar Agora <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="border-border text-muted-foreground hover:border-primary/50 hover:text-foreground">
                  Ver Protocolo
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Search */}
        <section className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar peptídeos por nome, categoria ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 border-border/50 bg-card pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            />
          </div>
        </section>

        {/* Category Filters */}
        <section className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {cat}
                <span className="ml-1.5 opacity-60">{categoryCount[cat] || 0}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Results count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span> peptídeos encontrados
          </p>
        </div>

        {/* Peptide Grid */}
        <section className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((peptide) => (
            <div
              key={peptide.name}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border/40 bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Gradient header */}
              <div className={`relative h-24 bg-gradient-to-br ${categoryGradients[peptide.category] || "from-gray-500 to-gray-700"} opacity-80 transition-opacity group-hover:opacity-100`}>
                {peptide.isPro && (
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold text-primary backdrop-blur-sm">
                    <Lock className="h-2.5 w-2.5" /> PRO
                  </div>
                )}
                <div className="absolute bottom-2 left-2">
                  <span className="rounded-md bg-background/70 px-1.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-sm">
                    {peptide.category}
                  </span>
                </div>
              </div>
              {/* Content */}
              <div className="flex flex-1 flex-col p-3">
                <h3 className="mb-1 text-sm font-semibold leading-tight text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {peptide.name}
                </h3>
                <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                  {peptide.description}
                </p>
              </div>
            </div>
          ))}
        </section>

        {/* CTA Bottom */}
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-card to-secondary p-8 text-center">
            <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
            <div className="relative">
              <Zap className="mx-auto mb-3 h-8 w-8 text-primary" />
              <h2 className="mb-2 text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Desbloqueie Todos os Peptídeos
              </h2>
              <p className="mx-auto mb-5 max-w-md text-sm text-muted-foreground">
                Acesse protocolos completos, dosagens detalhadas, estudos científicos e muito mais com o plano PRO.
              </p>
              <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Sparkles className="h-4 w-4" /> Começar Agora
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <p className="text-xs text-muted-foreground">
            © 2026 PeptídeosHealth. Todos os direitos reservados. Conteúdo educacional — consulte um profissional de saúde.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
