import { useState, useMemo } from "react";
import PremiumGateModal from "@/components/PremiumGateModal";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Shield, AlertTriangle, ShieldCheck, ShieldAlert, ChevronDown, CheckCircle2, XCircle } from "lucide-react";
import ProBadge from "@/components/ProBadge";
import { Link } from "react-router-dom";
import { usePeptidesWithInteractions } from "@/hooks/usePeptides";
import type { PeptideWithInteractions, NormalizedInteraction } from "@/types";
import { useEntitlements } from "@/hooks/useEntitlements";
import UsageBadge from "@/components/UsageBadge";

function getStatusInfo(status: string) {
  const s = status.toUpperCase();
  if (s.includes("SINÉR") || s.includes("SINERG") || s.includes("COMPATÍV"))
    return { label: "SINÉRGICO", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400", risk: "Sinérgico", riskColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" };
  if (s.includes("COMPLEMENTAR"))
    return { label: "COMPLEMENTAR", color: "bg-sky-500/15 text-sky-400 border-sky-500/25", dot: "bg-sky-400", risk: "Complementar", riskColor: "bg-sky-500/15 text-sky-400 border-sky-500/25" };
  if (s.includes("MONITOR") || s.includes("CAUTELA") || s.includes("PRECAU"))
    return { label: "MONITORAR", color: "bg-amber-500/15 text-amber-400 border-amber-500/25", dot: "bg-amber-400", risk: "Risco Baixo", riskColor: "bg-amber-500/15 text-amber-400 border-amber-500/25" };
  if (s.includes("EVITAR") || s.includes("CONTRAIND"))
    return { label: "EVITAR", color: "bg-red-500/15 text-red-400 border-red-500/25", dot: "bg-red-400", risk: "Risco Alto", riskColor: "bg-red-500/15 text-red-400 border-red-500/25" };
  return { label: status, color: "bg-secondary text-muted-foreground border-border/30", dot: "bg-muted-foreground", risk: status, riskColor: "bg-secondary text-muted-foreground border-border/30" };
}

function getActionLabel(status: string) {
  const s = status.toUpperCase();
  if (s.includes("MONITOR") || s.includes("CAUTELA")) return "Monitorar";
  if (s.includes("PRECAU")) return "Precaução";
  if (s.includes("EVITAR") || s.includes("CONTRAIND")) return "Contraindicado";
  if (s.includes("SINÉR") || s.includes("SINERG") || s.includes("COMPATÍV")) return "Compatível";
  if (s.includes("COMPLEMENTAR")) return "Complementar";
  return "Info";
}

// Helper: fuzzy match interaction name against peptide name
const namesMatch = (interactionName: string, peptideName: string): boolean => {
  const a = interactionName.toLowerCase().trim();
  const b = peptideName.toLowerCase().trim();
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return false;
};

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
  const [gateOpen, setGateOpen] = useState(false);
  const { isAdmin, isPro } = useEntitlements();
  const hasAccess = isAdmin || isPro;

  const { data: allPeptides = [], isLoading } = usePeptidesWithInteractions();

  const filteredPeptides = useMemo(() => {
    if (!search.trim()) return allPeptides;
    const q = search.toLowerCase();
    return allPeptides.filter((p) => p.name.toLowerCase().includes(q));
  }, [allPeptides, search]);

  const individualData = useMemo(() => {
    if (!selectedPeptide) return null;
    return allPeptides.find((p) => p.slug === selectedPeptide) ?? null;
  }, [allPeptides, selectedPeptide]);

  // Cross-check: gather all interactions from selected peptides
  const crossData = useMemo(() => {
    if (selectedPeptides.length === 0) return { safe: false, interactions: [] };

    // With 1 peptide, show all its interactions (same as individual)
    if (selectedPeptides.length === 1) {
      const p = allPeptides.find((pp) => pp.slug === selectedPeptides[0]);
      if (!p) return { safe: false, interactions: [] };
      return {
        safe: false,
        interactions: p.interactions.map((int) => ({
          peptideA: p.name,
          peptideB: int.nome,
          interaction: int,
        })),
      };
    }

    const selectedNames = selectedPeptides.map(
      (slug) => allPeptides.find((p) => p.slug === slug)?.name ?? ""
    ).filter(Boolean);

    const allInteractions: { peptideA: string; peptideB: string; interaction: NormalizedInteraction }[] = [];
    let hasDirectNegative = false;
    const addedPairs = new Set<string>();

    // namesMatch is now a module-level function

    // Check pairwise direct interactions (bidirectional)
    for (let i = 0; i < selectedPeptides.length; i++) {
      const pA = allPeptides.find((p) => p.slug === selectedPeptides[i]);
      if (!pA) continue;
      for (let j = i + 1; j < selectedPeptides.length; j++) {
        const pB = allPeptides.find((p) => p.slug === selectedPeptides[j]);
        if (!pB) continue;
        const pairKey = [pA.slug, pB.slug].sort().join("|");

        // A → B
        const matchAB = pA.interactions.find((int) => namesMatch(int.nome, pB.name));
        if (matchAB && !addedPairs.has(pairKey)) {
          const info = getStatusInfo(matchAB.status);
          if (info.label === "EVITAR" || info.label === "MONITORAR") hasDirectNegative = true;
          allInteractions.push({ peptideA: pA.name, peptideB: pB.name, interaction: matchAB });
          addedPairs.add(pairKey);
        }

        // B → A (if not already found)
        if (!addedPairs.has(pairKey)) {
          const matchBA = pB.interactions.find((int) => namesMatch(int.nome, pA.name));
          if (matchBA) {
            const info = getStatusInfo(matchBA.status);
            if (info.label === "EVITAR" || info.label === "MONITORAR") hasDirectNegative = true;
            allInteractions.push({ peptideA: pB.name, peptideB: pA.name, interaction: matchBA });
            addedPairs.add(pairKey);
          }
        }
      }
    }

    // Also gather each selected peptide's individual interactions
    for (const slug of selectedPeptides) {
      const p = allPeptides.find((pp) => pp.slug === slug);
      if (!p) continue;
      for (const int of p.interactions) {
        // Skip if it's an interaction with another selected peptide (already covered above)
        if (selectedNames.some((n) => namesMatch(int.nome, n))) continue;
        // Include all individual interactions
        allInteractions.push({ peptideA: p.name, peptideB: int.nome, interaction: int });
      }
    }

    return { safe: !hasDirectNegative, interactions: allInteractions };
  }, [allPeptides, selectedPeptides]);

  const toggleCrossPeptide = (slug: string) => {
    setSelectedPeptides((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  // Compute which peptides are blocked (would create EVITAR interaction with any selected peptide)
  const blockedSlugs = useMemo(() => {
    if (tab !== "cross" || selectedPeptides.length === 0) return new Map<string, "evitar" | "monitorar">();

    const blocked = new Map<string, "evitar" | "monitorar">();
    const selectedData = selectedPeptides
      .map((slug) => allPeptides.find((p) => p.slug === slug))
      .filter(Boolean) as PeptideWithInteractions[];

    for (const candidate of allPeptides) {
      if (selectedPeptides.includes(candidate.slug)) continue;

      for (const sel of selectedData) {
        const checkInteraction = (int: NormalizedInteraction) => {
          const label = getStatusInfo(int.status).label;
          return label === "EVITAR" ? "evitar" : label === "MONITORAR" ? "monitorar" : null;
        };

        // Check sel → candidate
        for (const int of sel.interactions) {
          if (!namesMatch(int.nome, candidate.name)) continue;
          const level = checkInteraction(int);
          if (level === "evitar") { blocked.set(candidate.slug, "evitar"); break; }
          if (level === "monitorar" && !blocked.has(candidate.slug)) blocked.set(candidate.slug, "monitorar");
        }
        if (blocked.get(candidate.slug) === "evitar") break;

        // Check candidate → sel
        for (const int of candidate.interactions) {
          if (!namesMatch(int.nome, sel.name)) continue;
          const level = checkInteraction(int);
          if (level === "evitar") { blocked.set(candidate.slug, "evitar"); break; }
          if (level === "monitorar" && !blocked.has(candidate.slug)) blocked.set(candidate.slug, "monitorar");
        }
        if (blocked.get(candidate.slug) === "evitar") break;
      }
    }

    return blocked;
  }, [tab, allPeptides, selectedPeptides]);

  return (
    <>
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
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Verificador de Interações
          </h1>
          {!hasAccess && (
             <ProBadge />
           )}
          <UsageBadge feature="interaction" />
        </div>
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

      {/* Peptide selector */}
      <div className="rounded-xl border border-border/25 bg-card/70 p-4 space-y-3">
        <p className="text-xs font-semibold text-foreground">
          {tab === "individual" ? "Selecione um peptídeo:" : "Selecione 2 ou mais peptídeos para verificar:"}
        </p>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar peptídeo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-xs border-border/40 bg-background/50"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="h-7 w-24 rounded-md bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {tab === "cross" && selectedPeptides.length > 0 && (
              <div className="flex items-center gap-3 text-[11px] mb-1">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <ShieldCheck className="h-3 w-3" />
                  {filteredPeptides.filter(p => !selectedPeptides.includes(p.slug) && !blockedSlugs.has(p.slug)).length} disponíveis
                </span>
                {[...blockedSlugs.values()].filter(v => v === "evitar").length > 0 && (
                  <span className="flex items-center gap-1 text-red-400/70 font-semibold">
                    <ShieldAlert className="h-3 w-3" />
                    {[...blockedSlugs.values()].filter(v => v === "evitar").length} evitar
                  </span>
                )}
                {[...blockedSlugs.values()].filter(v => v === "monitorar").length > 0 && (
                  <span className="flex items-center gap-1 text-amber-400/70 font-semibold">
                    <AlertTriangle className="h-3 w-3" />
                    {[...blockedSlugs.values()].filter(v => v === "monitorar").length} monitorar
                  </span>
                )}
                <span className="text-muted-foreground/50">
                  {selectedPeptides.length} selecionado(s)
                </span>
              </div>
            )}
          <div className="flex flex-wrap gap-x-3 gap-y-2 max-h-[220px] overflow-y-auto pr-1">
            {filteredPeptides.map((p) => {
              const worst = getWorstStatus(p.interactions);
              const isSelected = tab === "individual"
                ? selectedPeptide === p.slug
                : selectedPeptides.includes(p.slug);
              const blockLevel = tab === "cross" && !isSelected ? blockedSlugs.get(p.slug) ?? null : null;
              const isHardBlocked = blockLevel === "evitar";
              const isCaution = blockLevel === "monitorar";

              return (
                <button
                  key={p.slug}
                  disabled={isHardBlocked}
                  onClick={() => {
                    if (isHardBlocked) return;
                    if (!hasAccess) { setGateOpen(true); return; }
                    if (tab === "individual") {
                      setSelectedPeptide(selectedPeptide === p.slug ? null : p.slug);
                    } else {
                      toggleCrossPeptide(p.slug);
                    }
                  }}
                  className={`inline-flex items-center gap-1 text-xs font-medium py-1 px-1.5 transition-all rounded ${
                    isSelected
                      ? "bg-primary/20 text-primary font-bold ring-1 ring-primary/40"
                      : isHardBlocked
                        ? "text-muted-foreground/30 line-through cursor-not-allowed opacity-30"
                        : isCaution
                          ? "text-amber-400/80 hover:text-amber-300 ring-1 ring-amber-500/20 bg-amber-500/5"
                          : "text-muted-foreground hover:text-foreground"
                  }`}
                  title={isHardBlocked ? "Interação EVITAR — bloqueado" : isCaution ? "⚠️ Monitorar: requer acompanhamento" : undefined}
                >
                  {isSelected && <span className="text-primary">✓</span>}
                  {isHardBlocked && <ShieldAlert className="h-3 w-3 text-red-400/60" />}
                  {isCaution && <AlertTriangle className="h-3 w-3 text-amber-400" />}
                  <span>{p.name}</span>
                  {!isHardBlocked && !isCaution && worst === "caution" && (
                    <AlertTriangle className="h-3 w-3 text-amber-400" />
                  )}
                  {!isHardBlocked && !isCaution && worst === "avoid" && (
                    <AlertTriangle className="h-3 w-3 text-red-400" />
                  )}
                </button>
              );
            })}
          </div>
          </>
        )}
      </div>

      {/* Results */}
      {tab === "individual" && <IndividualResults peptide={individualData} />}
      {tab === "cross" && (
        <CrossResults
          safe={crossData.safe}
          interactions={crossData.interactions}
          selectedCount={selectedPeptides.length}
        />
      )}
      <PremiumGateModal open={gateOpen} onClose={() => setGateOpen(false)} reason="O verificador de interações é exclusivo para assinantes." />
    </div>
    </>
  );
}

/* ── Individual Results ── */
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
    <div className="space-y-3">
      <p className="text-sm font-semibold text-foreground">
        {peptide.interactions.length} interação(ões) encontrada(s):
      </p>
      {peptide.interactions.map((interaction, i) => (
        <InteractionCard
          key={i}
          substance={interaction.nome}
          source={peptide.name}
          status={interaction.status}
          description={interaction.descricao}
          mecanismo={interaction.mecanismo}
          consequencias={interaction.consequencias}
          fonte={interaction.fonte}
        />
      ))}
    </div>
  );
}

/* ── Cross Results ── */
function CrossResults({
  safe,
  interactions,
  selectedCount,
}: {
  safe: boolean;
  interactions: { peptideA: string; peptideB: string; interaction: NormalizedInteraction }[];
  selectedCount: number;
}) {
  if (selectedCount < 1) {
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

  // Separate direct (between selected) vs individual interactions
  const directInteractions = interactions.filter((r) => {
    const info = getStatusInfo(r.interaction.status);
    // Check if peptideB is one of the selected peptides (direct cross-interaction)
    return r.interaction.nome !== undefined; // all are valid
  });

  // Sort: EVITAR first, then MONITORAR, then others
  const sorted = [...interactions].sort((a, b) => {
    const order = (s: string) => {
      const u = s.toUpperCase();
      if (u.includes("EVITAR") || u.includes("CONTRAIND")) return 0;
      if (u.includes("MONITOR") || u.includes("CAUTELA")) return 1;
      if (u.includes("SINÉR") || u.includes("SINERG") || u.includes("COMPATÍV")) return 3;
      return 2;
    };
    return order(a.interaction.status) - order(b.interaction.status);
  });

  // Count EVITAR interactions
  const evitarCount = interactions.filter(r => {
    const info = getStatusInfo(r.interaction.status);
    return info.label === "EVITAR";
  }).length;

  const monitorarCount = interactions.filter(r => {
    const info = getStatusInfo(r.interaction.status);
    return info.label === "MONITORAR";
  }).length;

  return (
    <div className="space-y-4">
      {/* Safe combination banner */}
      {selectedCount >= 2 && safe && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 py-6 text-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-emerald-400">🟢 Combinação segura</p>
          <p className="text-[11px] text-muted-foreground/70 mt-1">
            Nenhuma interação negativa direta encontrada entre os peptídeos selecionados.
          </p>
        </div>
      )}

      {selectedCount >= 2 && !safe && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-400">🔴 Combinação não segura</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                Foram encontradas interações perigosas entre os peptídeos selecionados.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {evitarCount > 0 && (
              <Badge className="text-[10px] bg-red-500/15 text-red-400 border-red-500/25 font-bold px-2">
                {evitarCount} EVITAR
              </Badge>
            )}
            {monitorarCount > 0 && (
              <Badge className="text-[10px] bg-amber-500/15 text-amber-400 border-amber-500/25 font-bold px-2">
                {monitorarCount} MONITORAR
              </Badge>
            )}
          </div>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">
            {sorted.length} interação(ões) encontrada(s):
          </p>
          {sorted.map((r, i) => (
            <InteractionCard
              key={i}
              substance={r.peptideB}
              source={r.peptideA}
              status={r.interaction.status}
              description={r.interaction.descricao}
              mecanismo={r.interaction.mecanismo}
              consequencias={r.interaction.consequencias}
              fonte={r.interaction.fonte}
            />
          ))}
        </div>
      )}

      {sorted.length === 0 && selectedCount >= 2 && (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 py-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-emerald-400">Sem interações registradas</p>
          <p className="text-[11px] text-muted-foreground/60 mt-1">Nenhuma interação conhecida entre os peptídeos selecionados.</p>
        </div>
      )}

      {sorted.length === 0 && selectedCount < 2 && (
        <div className="rounded-xl border border-border/25 bg-card/70 py-12 text-center">
          <Shield className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma interação registrada para esta combinação.</p>
        </div>
      )}
    </div>
  );
}

/* ── Interaction Card ── */
function InteractionCard({
  substance,
  source,
  status,
  description,
  mecanismo,
  consequencias,
  fonte,
}: {
  substance: string;
  source: string;
  status: string;
  description: string;
  mecanismo?: string;
  consequencias?: string;
  fonte?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const info = getStatusInfo(status);
  const action = getActionLabel(status);

  const dotColor = info.label === "EVITAR" ? "bg-red-500"
    : info.label === "MONITORAR" ? "bg-amber-500"
    : info.label === "SINÉRGICO" ? "bg-emerald-500"
    : info.label === "COMPLEMENTAR" ? "bg-sky-500"
    : "bg-muted-foreground";

  const hasDetails = mecanismo || consequencias || fonte;

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className="w-full text-left rounded-xl border border-border/25 bg-card/70 hover:bg-card/90 transition-all overflow-hidden cursor-pointer"
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className={`h-3 w-3 rounded-full shrink-0 ${dotColor}`} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">{substance}</span>
            <Badge className="text-[9px] bg-secondary text-muted-foreground border-border/30 font-medium px-1.5 py-0">
              {source}
            </Badge>
          </div>
          {!expanded && description && (
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge className={`text-[9px] border font-semibold px-2 ${info.color}`}>
            {action}
          </Badge>
          <Badge className={`text-[9px] border font-semibold px-2 ${info.riskColor}`}>
            {info.risk}
          </Badge>
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/15 ml-6">
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          )}

          {mecanismo && (
            <div>
              <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <span>⚙️</span> Mecanismo da Interação:
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{mecanismo}</p>
            </div>
          )}

          {consequencias && (
            <div>
              <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <span>⚡</span> Consequências Possíveis:
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{consequencias}</p>
            </div>
          )}

          {fonte && (
            <div>
              <p className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <span>📚</span> Fonte:
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{fonte}</p>
            </div>
          )}

          {!hasDetails && !description && (
            <p className="text-[11px] text-muted-foreground/50 italic">Detalhes não disponíveis.</p>
          )}
        </div>
      )}
    </div>
  );
}
