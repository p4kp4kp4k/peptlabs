import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { compareSequences } from "@/components/admin/corrections/sequenceDiff";
import {
  Dna, Copy, Check, ChevronDown, FlaskConical, Droplets,
  Zap as ZapIcon, Atom, ExternalLink, History, AlertTriangle,
  Shield, Search, Box, Layers, MapPin,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   AMINO ACID REFERENCE DATA
   ═══════════════════════════════════════════════════════════════ */
const AA_MW: Record<string, number> = {
  G:57.05,A:71.08,V:99.13,L:113.16,I:113.16,P:97.12,F:147.18,W:186.21,
  M:131.20,S:87.08,T:101.10,C:103.14,Y:163.18,H:137.14,D:115.09,E:129.12,
  N:114.10,Q:128.13,K:128.17,R:156.19,
};
const HYDROPHOBIC = new Set(["A","V","I","L","F","W","M","P"]);
const POLAR       = new Set(["S","T","C","Y","N","Q"]);
const CHARGED_POS = new Set(["K","R","H"]);
const CHARGED_NEG = new Set(["D","E"]);
const AROMATIC    = new Set(["F","W","Y","H"]);
const KD: Record<string, number> = {
  I:4.5,V:4.2,L:3.8,F:2.8,C:2.5,M:1.9,A:1.8,G:-0.4,T:-0.7,
  S:-0.8,W:-0.9,Y:-1.3,P:-1.6,H:-3.2,E:-3.5,Q:-3.5,D:-3.5,
  N:-3.5,K:-3.9,R:-4.5,
};
const WATER_MW = 18.015;

/* ═══════════════════════════════════════════════════════════════
   ANALYSIS ENGINE
   ═══════════════════════════════════════════════════════════════ */
function analyzeSequence(seq: string) {
  const upper = seq.toUpperCase().replace(/[^A-Z]/g, "");
  const counts: Record<string, number> = {};
  let hydrophobic = 0, polar = 0, chargedPos = 0, chargedNeg = 0, aromatic = 0;
  let totalMw = WATER_MW;

  for (const ch of upper) {
    counts[ch] = (counts[ch] || 0) + 1;
    if (HYDROPHOBIC.has(ch)) hydrophobic++;
    if (POLAR.has(ch)) polar++;
    if (CHARGED_POS.has(ch)) chargedPos++;
    if (CHARGED_NEG.has(ch)) chargedNeg++;
    if (AROMATIC.has(ch)) aromatic++;
    totalMw += (AA_MW[ch] || 110) - WATER_MW;
  }
  totalMw += WATER_MW;

  const len = upper.length;
  const netCharge = chargedPos - chargedNeg;

  // pI estimation via median of pK values
  const pKs: number[] = [];
  const PK: Record<string, { a: number; b: number; r?: number }> = {
    G:{a:2.34,b:9.60},A:{a:2.34,b:9.69},V:{a:2.32,b:9.62},L:{a:2.36,b:9.60},
    I:{a:2.36,b:9.68},P:{a:1.99,b:10.96},F:{a:1.83,b:9.13},W:{a:2.83,b:9.39},
    M:{a:2.28,b:9.21},S:{a:2.21,b:9.15},T:{a:2.63,b:10.43},
    C:{a:1.71,b:10.78,r:8.33},Y:{a:2.20,b:9.11,r:10.07},H:{a:1.82,b:9.17,r:6.00},
    D:{a:1.88,b:9.60,r:3.65},E:{a:2.19,b:9.67,r:4.25},N:{a:2.02,b:8.80},
    Q:{a:2.17,b:9.13},K:{a:2.18,b:8.95,r:10.53},R:{a:2.17,b:9.04,r:12.48},
  };
  if (len > 0) {
    const f = PK[upper[0]]; if (f) pKs.push(f.a);
    const l = PK[upper[len - 1]]; if (l) pKs.push(l.b);
    for (const ch of upper) { const p = PK[ch]; if (p?.r) pKs.push(p.r); }
  }
  const pI = pKs.length >= 2 ? pKs.sort((a, b) => a - b)[Math.floor(pKs.length / 2)] : null;

  let gravySum = 0;
  for (const ch of upper) gravySum += KD[ch] || 0;
  const gravy = len > 0 ? gravySum / len : 0;

  const topAA = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([aa, count]) => ({ aa, count, pct: ((count / len) * 100).toFixed(1) }));

  let sizeClass: string;
  if (len <= 10) sizeClass = "Oligopeptídeo";
  else if (len <= 50) sizeClass = "Peptídeo";
  else if (len <= 100) sizeClass = "Polipeptídeo";
  else sizeClass = "Proteína";

  return {
    length: len, cleanSeq: upper, sizeClass, molecularWeight: totalMw,
    netCharge, pI, gravy,
    composition: {
      hydrophobic: { count: hydrophobic, pct: ((hydrophobic / len) * 100).toFixed(1) },
      polar: { count: polar, pct: ((polar / len) * 100).toFixed(1) },
      chargedPos: { count: chargedPos, pct: ((chargedPos / len) * 100).toFixed(1) },
      chargedNeg: { count: chargedNeg, pct: ((chargedNeg / len) * 100).toFixed(1) },
      aromatic: { count: aromatic, pct: ((aromatic / len) * 100).toFixed(1) },
    },
    topAA, counts,
  };
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

/* Formatted sequence with position numbering */
function FormattedSequence({ seq, regions }: { seq: string; regions?: FunctionalRegion[] }) {
  const GROUP = 10;
  const GROUPS_PER_LINE = 5;
  const lines: { start: number; groups: string[] }[] = [];

  for (let i = 0; i < seq.length; i += GROUP * GROUPS_PER_LINE) {
    const lineChars = seq.slice(i, i + GROUP * GROUPS_PER_LINE);
    const groups: string[] = [];
    for (let g = 0; g < lineChars.length; g += GROUP) {
      groups.push(lineChars.slice(g, g + GROUP));
    }
    lines.push({ start: i + 1, groups });
  }

  // Build position→region map for highlights
  const posMap = useMemo(() => {
    const m = new Map<number, string>();
    if (regions) {
      for (const r of regions) {
        for (let i = r.start; i <= r.end; i++) m.set(i, r.color);
      }
    }
    return m;
  }, [regions]);

  const hasRegions = posMap.size > 0;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-0 space-y-0.5">
        {lines.map((line, li) => (
          <div key={li} className="flex items-baseline gap-2 sm:gap-3">
            <span className="text-[10px] text-muted-foreground/40 font-mono w-8 sm:w-10 text-right shrink-0 select-none tabular-nums">
              {line.start}
            </span>
            <div className="flex gap-1.5 sm:gap-2.5 flex-wrap">
              {line.groups.map((group, gi) => {
                const groupStart = line.start + gi * GROUP;
                if (!hasRegions) {
                  return (
                    <span key={gi} className="font-mono text-[11px] sm:text-xs text-foreground/90 tracking-wider">
                      {group}
                    </span>
                  );
                }
                // Render char-by-char for region highlighting
                return (
                  <span key={gi} className="font-mono text-[11px] sm:text-xs tracking-wider">
                    {group.split("").map((ch, ci) => {
                      const pos = groupStart + ci;
                      const color = posMap.get(pos);
                      return (
                        <span
                          key={ci}
                          className={color ? `${color} font-bold` : "text-foreground/90"}
                          title={color ? `Posição ${pos}` : undefined}
                        >
                          {ch}
                        </span>
                      );
                    })}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Composition progress bar */
function CompositionBar({ label, pct, color, dot }: { label: string; pct: string; color: string; dot: string }) {
  const val = parseFloat(pct);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <div className={`h-2 w-2 rounded-full ${dot}`} />
          {label}
        </span>
        <span className="text-foreground font-semibold tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.min(val, 100)}%` }} />
      </div>
    </div>
  );
}

/* Property card */
function PropCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-secondary/30 border border-border">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-bold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

/* Tab button */
function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all ${
        active
          ? "bg-primary/10 text-primary border border-primary/20"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
      }`}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
interface FunctionalRegion {
  label: string;
  type: string;
  start: number;
  end: number;
  color: string;
  description?: string;
}

interface SequenceSectionProps {
  sequence: string | null;
  sequenceLength?: number | null;
  sourceOrigins?: string[] | null;
  confidenceScore?: number | null;
  lastSyncedAt?: string | null;
  updatedAt?: string;
  structureInfo?: any | null;
  peptideId?: string;
  peptideName?: string;
}

type ActiveTab = "sequence" | "properties" | "regions" | "structure" | "history";

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function SequenceSection({
  sequence,
  sequenceLength,
  sourceOrigins,
  confidenceScore,
  lastSyncedAt,
  updatedAt,
  structureInfo,
  peptideId,
  peptideName,
}: SequenceSectionProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("sequence");

  // Fetch change history for this peptide's sequence
  const { data: changeHistory } = useQuery({
    queryKey: ["seq-history", peptideId],
    queryFn: async () => {
      if (!peptideId) return [];
      const { data } = await supabase
        .from("peptide_change_history")
        .select("*")
        .eq("peptide_id", peptideId)
        .order("applied_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!peptideId,
  });

  // Fetch audit corrections for sequence field
  const { data: seqCorrections } = useQuery({
    queryKey: ["seq-corrections", peptideId],
    queryFn: async () => {
      if (!peptideId) return [];
      const { data } = await supabase
        .from("audit_corrections")
        .select("*")
        .eq("peptide_id", peptideId)
        .eq("field_name", "sequence")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!peptideId,
  });

  const analysis = sequence ? analyzeSequence(sequence) : null;
  const displayLength = sequenceLength || analysis?.length || 0;
  const primarySource = sourceOrigins?.length ? sourceOrigins[0] : "Manual";

  const confidenceLabel = confidenceScore != null
    ? confidenceScore >= 80 ? "Alta" : confidenceScore >= 50 ? "Média" : "Baixa"
    : null;
  const confidenceColor = confidenceScore != null
    ? confidenceScore >= 80 ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/10"
    : confidenceScore >= 50 ? "text-amber-400 border-amber-500/25 bg-amber-500/10"
    : "text-red-400 border-red-500/25 bg-red-500/10"
    : "";

  const pdbId = structureInfo?.pdb_id || structureInfo?.pdbId || null;

  const regions: FunctionalRegion[] = useMemo(() => {
    if (!structureInfo?.regions && !structureInfo?.functional_regions) return [];
    const raw = structureInfo.regions || structureInfo.functional_regions || [];
    const colorMap: Record<string, string> = {
      domain: "text-primary",
      active_site: "text-emerald-400",
      binding_site: "text-amber-400",
      signal_peptide: "text-violet-400",
      transmembrane: "text-rose-400",
      default: "text-sky-400",
    };
    return (raw as any[]).map((r: any) => ({
      label: r.label || r.name || r.type,
      type: r.type || "domain",
      start: r.start || 1,
      end: r.end || (analysis?.length || 0),
      color: colorMap[r.type] || colorMap.default,
      description: r.description,
    }));
  }, [structureInfo, analysis?.length]);

  const hasConflict = seqCorrections?.some(c => c.status === "pending") || false;

  const previousSequence = useMemo(() => {
    if (!changeHistory?.length || !sequence) return null;
    for (const h of changeHistory) {
      const before = h.before_snapshot as any;
      if (before?.sequence && before.sequence !== sequence) {
        return { seq: before.sequence as string, date: h.applied_at, origin: h.change_origin };
      }
    }
    return null;
  }, [changeHistory, sequence]);

  const diffResult = previousSequence ? compareSequences(previousSequence.seq, sequence!) : null;

  /* ── Empty state ── */
  if (!sequence || !analysis) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground/60 gap-1">
            <Dna className="h-3 w-3" /> Não disponível
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground/50 italic">
          Sequência peptídica ainda não cadastrada nesta base.
        </p>
        <p className="text-[10px] text-muted-foreground/30 leading-relaxed">
          A sequência de aminoácidos será adicionada quando disponível em fontes científicas validadas (UniProt, NCBI, DRAMP).
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis.cleanSeq);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatMW = (mw: number) => mw >= 1000 ? `${(mw / 1000).toFixed(2)} kDa` : `${mw.toFixed(1)} Da`;

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-4">
      {/* ── HEADER: badges + status ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="outline" className="text-[10px] border-primary/25 text-primary bg-primary/5 gap-1 font-semibold">
            <Dna className="h-3 w-3" />
            {displayLength} aa
          </Badge>
          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground gap-1">
            {analysis.sizeClass}
          </Badge>
          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground gap-1">
            Fonte: {primarySource}
          </Badge>
          {hasConflict && (
            <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10 gap-1 font-semibold">
              <AlertTriangle className="h-3 w-3" /> Conflito
            </Badge>
          )}
          {seqCorrections && seqCorrections.some(c => c.status === "applied") && (
            <Badge variant="outline" className="text-[10px] border-emerald-500/25 text-emerald-400 bg-emerald-500/10 gap-1">
              <Shield className="h-3 w-3" /> Validado via auditoria
            </Badge>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-muted-foreground hover:text-foreground bg-secondary/40 border border-border hover:border-primary/30 transition-all"
          title="Copiar sequência FASTA"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>

      {/* ── TABS ── */}
      <div className="flex items-center gap-1 flex-wrap border-b border-border pb-2">
        <TabBtn active={activeTab === "sequence"} onClick={() => setActiveTab("sequence")}>
          <span className="flex items-center gap-1"><Dna className="h-3 w-3" /> Sequência</span>
        </TabBtn>
        <TabBtn active={activeTab === "properties"} onClick={() => setActiveTab("properties")}>
          <span className="flex items-center gap-1"><Atom className="h-3 w-3" /> Propriedades</span>
        </TabBtn>
        <TabBtn active={activeTab === "regions"} onClick={() => setActiveTab("regions")}>
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Regiões</span>
        </TabBtn>
        <TabBtn active={activeTab === "structure"} onClick={() => setActiveTab("structure")}>
          <span className="flex items-center gap-1"><Box className="h-3 w-3" /> 3D</span>
        </TabBtn>
        {(previousSequence || (changeHistory && changeHistory.length > 0)) && (
          <TabBtn active={activeTab === "history"} onClick={() => setActiveTab("history")}>
            <span className="flex items-center gap-1"><History className="h-3 w-3" /> Histórico</span>
          </TabBtn>
        )}
      </div>

      {/* ═══ TAB: SEQUENCE ═══ */}
      {activeTab === "sequence" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Formatted sequence */}
          <div className="p-3 sm:p-4 rounded-lg bg-secondary/20 border border-border">
            <FormattedSequence seq={analysis.cleanSeq} regions={regions.length > 0 ? regions : undefined} />
          </div>

          {/* Quick properties row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <PropCard icon={<Atom className="h-3.5 w-3.5 text-primary" />} label="Massa Molecular" value={formatMW(analysis.molecularWeight)} />
            <PropCard icon={<ZapIcon className="h-3.5 w-3.5 text-amber-400" />} label="Carga Líquida" value={analysis.netCharge > 0 ? `+${analysis.netCharge}` : `${analysis.netCharge}`} />
            <PropCard icon={<Droplets className="h-3.5 w-3.5 text-sky-400" />} label="pI Estimado" value={analysis.pI ? analysis.pI.toFixed(1) : "—"} />
            <PropCard icon={<FlaskConical className="h-3.5 w-3.5 text-violet-400" />} label="GRAVY" value={analysis.gravy.toFixed(2)} />
          </div>

          {/* Footer */}
          <p className="text-[10px] text-muted-foreground/30 leading-relaxed">
            Cada letra representa um aminoácido. Propriedades calculadas a partir da sequência primária.
            {lastSyncedAt && ` Sincronizado: ${new Date(lastSyncedAt).toLocaleDateString("pt-BR")}.`}
          </p>
        </div>
      )}

      {/* ═══ TAB: PROPERTIES ═══ */}
      {activeTab === "properties" && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Physicochemical */}
          <div>
            <h4 className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-3 font-bold">Propriedades Físico-Químicas</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <PropCard icon={<Atom className="h-3.5 w-3.5 text-primary" />} label="Massa Molecular" value={formatMW(analysis.molecularWeight)} />
              <PropCard icon={<ZapIcon className="h-3.5 w-3.5 text-amber-400" />} label="Carga Líquida (pH 7)" value={analysis.netCharge > 0 ? `+${analysis.netCharge}` : `${analysis.netCharge}`} />
              <PropCard icon={<Droplets className="h-3.5 w-3.5 text-sky-400" />} label="Ponto Isoelétrico" value={analysis.pI ? `pI ${analysis.pI.toFixed(2)}` : "—"} />
              <PropCard icon={<FlaskConical className="h-3.5 w-3.5 text-violet-400" />} label="Hidrofobicidade (GRAVY)" value={`${analysis.gravy.toFixed(3)} ${analysis.gravy > 0 ? "(hidrofóbico)" : "(hidrofílico)"}`} />
              <PropCard icon={<Layers className="h-3.5 w-3.5 text-emerald-400" />} label="Comprimento" value={`${analysis.length} aminoácidos`} />
              <PropCard icon={<Dna className="h-3.5 w-3.5 text-rose-400" />} label="Classificação" value={analysis.sizeClass} />
            </div>
          </div>

          {/* Composition */}
          <div>
            <h4 className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-3 font-bold">Composição de Aminoácidos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
              <CompositionBar label="Hidrofóbicos" pct={analysis.composition.hydrophobic.pct} color="bg-amber-500" dot="bg-amber-500" />
              <CompositionBar label="Polares" pct={analysis.composition.polar.pct} color="bg-sky-500" dot="bg-sky-500" />
              <CompositionBar label="Carregados (+)" pct={analysis.composition.chargedPos.pct} color="bg-emerald-500" dot="bg-emerald-500" />
              <CompositionBar label="Carregados (−)" pct={analysis.composition.chargedNeg.pct} color="bg-rose-500" dot="bg-rose-500" />
              <CompositionBar label="Aromáticos" pct={analysis.composition.aromatic.pct} color="bg-violet-500" dot="bg-violet-500" />
            </div>
          </div>

          {/* Top residues */}
          <div>
            <h4 className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mb-2 font-bold">Resíduos Mais Frequentes</h4>
            <div className="flex gap-1.5 flex-wrap">
              {analysis.topAA.map(({ aa, count, pct }) => (
                <div key={aa} className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/40 border border-border">
                  <span className="font-mono text-xs font-bold text-primary">{aa}</span>
                  <span className="text-[9px] text-muted-foreground">{count}× ({pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: REGIONS ═══ */}
      {activeTab === "regions" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {regions.length > 0 ? (
            <>
              <div className="space-y-2">
                {regions.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary/60 ${r.color}`}>
                      <MapPin className="h-3 w-3" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{r.label}</span>
                        <Badge variant="outline" className="text-[9px] border-border text-muted-foreground">
                          {r.start}–{r.end}
                        </Badge>
                      </div>
                      {r.description && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{r.description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={`text-[9px] ${r.color} border-current/20`}>
                      {r.type}
                    </Badge>
                  </div>
                ))}
              </div>
              {/* Sequence with region highlights */}
              <div className="p-3 rounded-lg bg-secondary/20 border border-border">
                <p className="text-[10px] text-muted-foreground/50 mb-2">Sequência com regiões destacadas:</p>
                <FormattedSequence seq={analysis.cleanSeq} regions={regions} />
              </div>
            </>
          ) : (
            <div className="text-center py-8 space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/40 border border-border mx-auto">
                <Search className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-xs text-muted-foreground/60">Nenhuma região funcional mapeada ainda</p>
              <p className="text-[10px] text-muted-foreground/30 max-w-xs mx-auto leading-relaxed">
                Domínios funcionais, sítios ativos e regiões de ligação serão exibidos quando disponíveis via UniProt ou PDB.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: 3D STRUCTURE ═══ */}
      {activeTab === "structure" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {pdbId ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] border-primary/25 text-primary bg-primary/5 gap-1">
                    <Box className="h-3 w-3" /> PDB: {pdbId}
                  </Badge>
                </div>
                <a
                  href={`https://www.rcsb.org/structure/${pdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                >
                  Abrir no RCSB <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              {/* Mol* 3D Viewer embed */}
              <div className="rounded-lg border border-border overflow-hidden bg-black/50" style={{ height: 380 }}>
                <iframe
                  src={`https://molstar.org/viewer/?pdb=${pdbId}&hide-controls=1`}
                  className="w-full h-full border-0"
                  title={`Estrutura 3D - ${peptideName || pdbId}`}
                  allow="fullscreen"
                  loading="lazy"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/40 border border-border mx-auto">
                <Box className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-xs text-muted-foreground/60">Estrutura 3D não disponível</p>
              <p className="text-[10px] text-muted-foreground/30 max-w-xs mx-auto leading-relaxed">
                A visualização 3D será habilitada quando um ID PDB for associado a este peptídeo.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: HISTORY + DIFF ═══ */}
      {activeTab === "history" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Diff comparison */}
          {previousSequence && diffResult && (
            <div className="space-y-3">
              <h4 className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold">Comparação de Versões</h4>
              <div className="grid grid-cols-3 gap-2">
                <PropCard icon={<Dna className="h-3.5 w-3.5 text-sky-400" />} label="Similaridade" value={`${diffResult.similarity}%`} />
                <PropCard icon={<Layers className="h-3.5 w-3.5 text-amber-400" />} label="Anterior" value={`${diffResult.lengthA} aa`} />
                <PropCard icon={<Layers className="h-3.5 w-3.5 text-emerald-400" />} label="Atual" value={`${diffResult.lengthB} aa`} />
              </div>
              {/* Visual diff */}
              <div className="p-3 rounded-lg bg-secondary/20 border border-border space-y-2">
                <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider">Alinhamento</p>
                <div className="overflow-x-auto">
                  <div className="space-y-1 font-mono text-[10px]">
                    <div className="flex items-baseline gap-2">
                      <span className="text-muted-foreground/40 w-12 shrink-0 text-right">Anterior</span>
                      <span className="tracking-wider">
                        {diffResult.alignedA.map((c, i) => (
                          <span
                            key={i}
                            className={
                              c.type === "match" ? "text-emerald-400" :
                              c.type === "mismatch" ? "text-rose-400 font-bold" :
                              "text-amber-400/60"
                            }
                          >
                            {c.char}
                          </span>
                        ))}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-muted-foreground/40 w-12 shrink-0 text-right">Atual</span>
                      <span className="tracking-wider">
                        {diffResult.alignedB.map((c, i) => (
                          <span
                            key={i}
                            className={
                              c.type === "match" ? "text-emerald-400" :
                              c.type === "mismatch" ? "text-rose-400 font-bold" :
                              "text-amber-400/60"
                            }
                          >
                            {c.char}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1 text-[9px] text-muted-foreground/40">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Idêntico</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" /> Diferente</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> Gap</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/40">
                Origem: {previousSequence.origin} • {new Date(previousSequence.date).toLocaleDateString("pt-BR")}
              </p>
            </div>
          )}

          {/* Change history list */}
          <div>
            <h4 className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold mb-2">Histórico de Alterações</h4>
            {changeHistory && changeHistory.length > 0 ? (
              <div className="space-y-1.5">
                {changeHistory.map((h: any) => (
                  <div key={h.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20 border border-border">
                    <History className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-foreground/80 truncate">
                        {h.change_summary || h.change_origin}
                      </p>
                      <p className="text-[9px] text-muted-foreground/40">
                        {new Date(h.applied_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[9px] border-border text-muted-foreground shrink-0">
                      {h.change_origin}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground/40 italic">Nenhuma alteração registrada.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
