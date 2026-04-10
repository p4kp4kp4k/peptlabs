import { useState, useMemo } from "react";
import PremiumGateModal from "@/components/PremiumGateModal";
import { ArrowLeftRight, Plus, X, Loader2 } from "lucide-react";
import ProBadge from "@/components/ProBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePeptides } from "@/hooks/usePeptides";
import type { PeptideListItem } from "@/types";
import { useEntitlements } from "@/hooks/useEntitlements";
import UsageBadge from "@/components/UsageBadge";

export default function Compare() {
  const { data: peptides = [], isLoading } = usePeptides();
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const { isAdmin, isPro } = useEntitlements();
  const hasAccess = isAdmin || isPro;

  const selectedPeptides = useMemo(
    () => peptides.filter((p) => selected.includes(p.id)),
    [peptides, selected]
  );

  const filteredPeptides = useMemo(
    () => peptides.filter((p) =>
      !selected.includes(p.id) &&
      p.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 20),
    [peptides, selected, search]
  );

  const addPeptide = (id: string) => {
    if (!hasAccess) { setGateOpen(true); return; }
    if (selected.length < 4) {
      setSelected((s) => [...s, id]);
      setShowPicker(false);
      setSearch("");
    }
  };

  const removePeptide = (id: string) => setSelected((s) => s.filter((x) => x !== id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const POPULAR_COMPARISONS = [
    { title: "Recuperação", desc: "Os dois peptídeos de recuperação mais populares", slugs: ["bpc-157", "tb-500"] },
    { title: "Secretagogos de GH", desc: "Compare os liberadores de GH", slugs: ["cjc-1295-no-dac", "ipamorelin"] },
    { title: "Emagrecimento", desc: "Líderes em perda de peso", slugs: ["semaglutide", "tirzepatide"] },
    { title: "Nootrópicos", desc: "Peptídeos russos nootrópicos", slugs: ["selank", "semax"] },
    { title: "Anti-aging", desc: "Peptídeos para longevidade", slugs: ["epithalon", "ghk-cu"] },
    { title: "Stack Completo", desc: "Recuperação completa", slugs: ["bpc-157", "tb-500", "ghk-cu"] },
  ];

  const loadPopularComparison = (slugs: string[]) => {
    const ids = peptides.filter((p) => slugs.includes(p.slug)).map((p) => p.id);
    setSelected(ids);
  };

  const getPeptideNameBySlug = (slug: string) => {
    const p = peptides.find((pep) => pep.slug === slug);
    return p?.name || slug.toUpperCase().replace(/-/g, " ");
  };

  return (
    <>
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <ArrowLeftRight className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Comparar Peptídeos</h1>
          <UsageBadge feature="compare" className="ml-2" />
        </div>
        <p className="text-sm text-muted-foreground">Compare até 3 peptídeos lado a lado — mecanismos, dosagens, benefícios e compatibilidade.</p>
      </div>

      {/* Selected chips */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {selectedPeptides.map((p) => (
          <Badge key={p.id} variant="secondary" className="gap-1 text-xs py-1 px-2.5">
            {p.name}
            <button onClick={() => removePeptide(p.id)}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {selected.length < 4 && (
          <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => hasAccess ? setShowPicker(true) : setGateOpen(true)}>
            <Plus className="h-3 w-3" /> Adicionar Peptídeo
          </Button>
        )}
      </div>

      {/* Picker dropdown */}
      {showPicker && (
        <Card className="mb-4 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <input
                autoFocus
                placeholder="Buscar peptídeo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-b border-border/50 pb-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button onClick={() => { setShowPicker(false); setSearch(""); }} className="p-1 rounded-md hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {filteredPeptides.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addPeptide(p.id)}
                  className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-secondary/60 transition-colors"
                >
                  <span className="text-foreground">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">{p.category}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison table */}
      {selectedPeptides.length >= 2 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-3 text-muted-foreground font-medium w-32">Atributo</th>
                {selectedPeptides.map((p) => (
                  <th key={p.id} className="text-left py-3 px-3 text-foreground font-semibold">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/20">
                <td className="py-3 px-3 text-muted-foreground">Categoria</td>
                {selectedPeptides.map((p) => (
                  <td key={p.id} className="py-3 px-3">
                    <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border/20">
                <td className="py-3 px-3 text-muted-foreground">Descrição</td>
                {selectedPeptides.map((p) => (
                  <td key={p.id} className="py-3 px-3 text-foreground">{p.description || "—"}</td>
                ))}
              </tr>
              <tr className="border-b border-border/20">
                <td className="py-3 px-3 text-muted-foreground">Benefícios</td>
                {selectedPeptides.map((p) => (
                  <td key={p.id} className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {(p.benefits || []).slice(0, 4).map((b) => (
                        <span key={b} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{b}</span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          {/* Popular comparisons */}
          <h2 className="text-base font-semibold text-foreground mb-4">Comparações Populares</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {POPULAR_COMPARISONS.map((comp) => (
              <button
                key={comp.title}
                onClick={() => {
                  if (!hasAccess) { setGateOpen(true); return; }
                  loadPopularComparison(comp.slugs);
                }}
                className="relative text-left rounded-xl border border-border/50 bg-card p-4 hover:border-primary/30 transition-colors"
              >
                {!hasAccess && (
                  <div className="absolute top-3 right-3">
                     <ProBadge />
                  </div>
                )}
                <h3 className="text-sm font-semibold text-foreground">{comp.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 mb-3">{comp.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {comp.slugs.map((s) => (
                    <span key={s} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] text-foreground">
                      {getPeptideNameBySlug(s)}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      <PremiumGateModal open={gateOpen} onClose={() => setGateOpen(false)} reason="O comparador de peptídeos é exclusivo para assinantes." />
    </div>
    </>
  );
}
