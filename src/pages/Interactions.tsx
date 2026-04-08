import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Shield, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { usePeptidesWithInteractions } from "@/hooks/usePeptides";
import type { PeptideWithInteractions, NormalizedInteraction } from "@/types";

function getStatusInfo(status: string) {
  const s = status.toUpperCase();
  if (s.includes("SINÉR") || s.includes("SINERG") || s.includes("COMPATÍV"))
    return { label: "SINÉRGICO", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400" };
  if (s.includes("COMPLEMENTAR"))
    return { label: "COMPLEMENTAR", color: "bg-sky-500/15 text-sky-400 border-sky-500/25", dot: "bg-sky-400" };
  if (s.includes("MONITOR") || s.includes("CAUTELA"))
    return { label: "MONITORAR", color: "bg-amber-500/15 text-amber-400 border-amber-500/25", dot: "bg-amber-400" };
  if (s.includes("EVITAR"))
    return { label: "EVITAR", color: "bg-red-500/15 text-red-400 border-red-500/25", dot: "bg-red-400" };
  return { label: status, color: "bg-secondary text-muted-foreground border-border/30", dot: "bg-muted-foreground" };
}

/** Get the "worst" interaction status for a peptide to show a warning icon */
function getWorstStatus(interactions: NormalizedInteraction[]): "none" | "caution" | "avoid" {
  let worst: "none" | "caution" | "avoid" = "none";
  for (const i of interactions) {
    const info = getStatusInfo(i.status);
    if (info.label === "EVITAR") return "avoid";
    if (info.label === "MONITORAR") worst = "caution";
  }
  return worst;
}

type Tab = "individual" | "cross";

export default function Interactions() {
  const [tab, setTab] = useState<Tab>("individual");
  const [search, setSearch] = useState("");
  const [selectedPeptide, setSelectedPeptide] = useState<string | null>(null);
  const [selectedPeptides, setSelectedPeptides] = useState<string[]>([]);

  const { data: allPeptides = [], isLoading } = usePeptidesWithInteractions();

  const filteredPeptides = useMemo(() => {
    if (!search.trim()) return allPeptides;
    const q = search.toLowerCase();
    return allPeptides.filter((p) => p.name.toLowerCase().includes(q));
  }, [allPeptides, search]);

  // Individual tab: selected peptide's interactions
  const individualData = useMemo(() => {
    if (!selectedPeptide) return null;
    return allPeptides.find((p) => p.slug === selectedPeptide) ?? null;
  }, [allPeptides, selectedPeptide]);

  // Cross-check tab: find interactions between selected peptides
  const crossData = useMemo(() => {
    if (selectedPeptides.length < 2) return [];
    const results: { peptideA: string; peptideB: string; interaction: NormalizedInteraction }[] = [];
    
    for (let i = 0; i < selectedPeptides.length; i++) {
      const pA = allPeptides.find((p) => p.slug === selectedPeptides[i]);
      if (!pA) continue;
      for (let j = i + 1; j < selectedPeptides.length; j++) {
        const pBName = allPeptides.find((p) => p.slug === selectedPeptides[j])?.name;
        if (!pBName) continue;
        const match = pA.interactions.find(
          (int) => int.nome.toLowerCase() === pBName.toLowerCase()
        );
        if (match) {
          results.push({ peptideA: pA.name, peptideB: pBName, interaction: match });
        }
      }
    }
    return results;
  }, [allPeptides, selectedPeptides]);

  const toggleCrossPeptide = (slug: string) => {
    setSelectedPeptides((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* Warning banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">⚡ Aviso Importante</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
            Esta ferramenta é apenas informativa e educacional. NÃO substitui orientação médica profissional. Sempre consulte um médico antes de iniciar, alterar ou combinar qualquer protocolo de peptídeos ou medicamentos.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Verificador de Interações
        </h1>
        <p className="text-xs text-muted-foreground">
          Verifique interações medicamentosas e combinações perigosas
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("individual")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
            tab === "individual"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "bg-card/60 text-muted-foreground border border-border/30 hover:text-foreground"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Peptídeo Individual
        </button>
        <button
          onClick={() => setTab("cross")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
            tab === "cross"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
              : "bg-card/60 text-muted-foreground border border-border/30 hover:text-foreground"
          }`}
        >
          <ShieldAlert className="h-3.5 w-3.5" />
          Verificação Cruzada
        </button>
      </div>

      {/* Peptide selector card */}
      <div className="rounded-xl border border-border/25 bg-card/70 p-4 space-y-3">
        <p className="text-xs font-semibold text-foreground">
          {tab === "individual" ? "Selecione um peptídeo:" : "Selecione 2 ou mais peptídeos para verificar:"}
        </p>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar peptídeo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-xs border-border/40 bg-background/50"
          />
        </div>

        {/* Peptide chips */}
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="h-7 w-24 rounded-md bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-3 gap-y-2 max-h-[220px] overflow-y-auto pr-1">
            {filteredPeptides.map((p) => {
              const worst = getWorstStatus(p.interactions);
              const isSelected = tab === "individual"
                ? selectedPeptide === p.slug
                : selectedPeptides.includes(p.slug);

              return (
                <button
                  key={p.slug}
                  onClick={() => {
                    if (tab === "individual") {
                      setSelectedPeptide(selectedPeptide === p.slug ? null : p.slug);
                    } else {
                      toggleCrossPeptide(p.slug);
                    }
                  }}
                  className={`inline-flex items-center gap-1 text-xs font-medium py-1 px-0.5 transition-all rounded-sm ${
                    isSelected
                      ? "text-primary font-bold underline underline-offset-2"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={isSelected ? "text-primary" : ""}>{p.name}</span>
                  {worst === "caution" && (
                    <AlertTriangle className="h-3 w-3 text-amber-400" />
                  )}
                  {worst === "avoid" && (
                    <AlertTriangle className="h-3 w-3 text-red-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results area */}
      {tab === "individual" && (
        <IndividualResults peptide={individualData} />
      )}
      {tab === "cross" && (
        <CrossResults 
          results={crossData} 
          selectedCount={selectedPeptides.length} 
        />
      )}
    </div>
  );
}

function IndividualResults({ peptide }: { peptide: PeptideWithInteractions | null }) {
  if (!peptide) {
    return (
      <div className="rounded-xl border border-border/25 bg-card/70 py-16 text-center">
        <Shield className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">Selecione um peptídeo para começar</p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          Escolha um peptídeo acima para ver todas as interações medicamentosas conhecidas.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/25 bg-card/70 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/15 bg-card/40">
        <div className="flex items-center gap-3">
          <Link
            to={`/peptide/${peptide.slug}`}
            className="text-sm font-bold text-foreground hover:text-primary transition-colors"
          >
            {peptide.name}
          </Link>
          <Badge variant="outline" className="text-[9px] bg-primary/15 text-primary border-primary/25 font-semibold px-2">
            {peptide.category}
          </Badge>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {peptide.interactions.length} interações
        </span>
      </div>

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
                <tr key={i} className="border-b border-border/10 last:border-0 hover:bg-secondary/20 transition-colors">
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
}

function CrossResults({ results, selectedCount }: { results: { peptideA: string; peptideB: string; interaction: NormalizedInteraction }[]; selectedCount: number }) {
  if (selectedCount < 2) {
    return (
      <div className="rounded-xl border border-border/25 bg-card/70 py-16 text-center">
        <Shield className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">Selecione um peptídeo para começar</p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          Escolha um peptídeo acima para ver todas as interações medicamentosas conhecidas.
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 py-12 text-center">
        <ShieldCheck className="h-10 w-10 text-emerald-400/40 mx-auto mb-3" />
        <p className="text-sm font-semibold text-emerald-400">Nenhuma interação encontrada</p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          Não foram encontradas interações conhecidas entre os peptídeos selecionados.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/25 bg-card/70 overflow-hidden">
      <div className="px-4 py-3 border-b border-border/15 bg-card/40">
        <p className="text-sm font-bold text-foreground">
          {results.length} interação(ões) encontrada(s)
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/20">
              <th className="text-left py-2 px-4 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">
                Peptídeo A
              </th>
              <th className="text-left py-2 px-4 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">
                Peptídeo B
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
            {results.map((r, i) => {
              const info = getStatusInfo(r.interaction.status);
              return (
                <tr key={i} className="border-b border-border/10 last:border-0 hover:bg-secondary/20 transition-colors">
                  <td className="py-2.5 px-4 text-foreground font-medium whitespace-nowrap">{r.peptideA}</td>
                  <td className="py-2.5 px-4 text-foreground font-medium whitespace-nowrap">{r.peptideB}</td>
                  <td className="py-2.5 px-4">
                    <Badge className={`text-[9px] ${info.color} border font-bold px-2`}>{info.label}</Badge>
                  </td>
                  <td className="py-2.5 px-4 text-muted-foreground leading-relaxed">{r.interaction.descricao}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
