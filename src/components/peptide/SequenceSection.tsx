import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Dna, Copy, Check, ChevronDown, FlaskConical, Droplets, Zap as ZapIcon, Atom } from "lucide-react";

/* ─── Amino acid data ─── */
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

const AA_PK: Record<string, { pKa: number; pKb: number; pKr?: number }> = {
  G:{pKa:2.34,pKb:9.60},A:{pKa:2.34,pKb:9.69},V:{pKa:2.32,pKb:9.62},
  L:{pKa:2.36,pKb:9.60},I:{pKa:2.36,pKb:9.68},P:{pKa:1.99,pKb:10.96},
  F:{pKa:1.83,pKb:9.13},W:{pKa:2.83,pKb:9.39},M:{pKa:2.28,pKb:9.21},
  S:{pKa:2.21,pKb:9.15},T:{pKa:2.63,pKb:10.43},C:{pKa:1.71,pKb:10.78,pKr:8.33},
  Y:{pKa:2.20,pKb:9.11,pKr:10.07},H:{pKa:1.82,pKb:9.17,pKr:6.00},
  D:{pKa:1.88,pKb:9.60,pKr:3.65},E:{pKa:2.19,pKb:9.67,pKr:4.25},
  N:{pKa:2.02,pKb:8.80},Q:{pKa:2.17,pKb:9.13},K:{pKa:2.18,pKb:8.95,pKr:10.53},
  R:{pKa:2.17,pKb:9.04,pKr:12.48},
};

const WATER_MW = 18.015;

interface SequenceSectionProps {
  sequence: string | null;
  sequenceLength?: number | null;
  sourceOrigins?: string[] | null;
  confidenceScore?: number | null;
  lastSyncedAt?: string | null;
  updatedAt?: string;
}

/* ─── Analysis helpers ─── */
function analyzeSequence(seq: string) {
  const upper = seq.toUpperCase().replace(/[^A-Z]/g, "");
  const counts: Record<string, number> = {};
  let hydrophobic = 0, polar = 0, chargedPos = 0, chargedNeg = 0, aromatic = 0;
  let totalMw = WATER_MW; // start with water for peptide bond

  for (const ch of upper) {
    counts[ch] = (counts[ch] || 0) + 1;
    if (HYDROPHOBIC.has(ch)) hydrophobic++;
    if (POLAR.has(ch)) polar++;
    if (CHARGED_POS.has(ch)) chargedPos++;
    if (CHARGED_NEG.has(ch)) chargedNeg++;
    if (AROMATIC.has(ch)) aromatic++;
    totalMw += (AA_MW[ch] || 110) - WATER_MW; // subtract water per peptide bond
  }
  totalMw += WATER_MW; // add back terminal water

  const len = upper.length;
  const netCharge = chargedPos - chargedNeg;

  // Rough pI estimation (average of pKa values)
  const pKas: number[] = [];
  if (len > 0) {
    // N-terminal
    const firstAA = AA_PK[upper[0]];
    if (firstAA) pKas.push(firstAA.pKa);
    // C-terminal
    const lastAA = AA_PK[upper[len - 1]];
    if (lastAA) pKas.push(lastAA.pKb);
    // Side chains
    for (const ch of upper) {
      const pk = AA_PK[ch];
      if (pk?.pKr) pKas.push(pk.pKr);
    }
  }
  const pI = pKas.length >= 2
    ? pKas.sort((a, b) => a - b)[Math.floor(pKas.length / 2)]
    : null;

  // GRAVY (Grand Average of Hydropathicity) - Kyte-Doolittle
  const KD: Record<string, number> = {
    I:4.5,V:4.2,L:3.8,F:2.8,C:2.5,M:1.9,A:1.8,G:-0.4,T:-0.7,
    S:-0.8,W:-0.9,Y:-1.3,P:-1.6,H:-3.2,E:-3.5,Q:-3.5,D:-3.5,
    N:-3.5,K:-3.9,R:-4.5,
  };
  let gravySum = 0;
  for (const ch of upper) gravySum += KD[ch] || 0;
  const gravy = len > 0 ? gravySum / len : 0;

  // Top 5 most frequent AAs
  const topAA = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([aa, count]) => ({ aa, count, pct: ((count / len) * 100).toFixed(1) }));

  // Size classification
  let sizeClass: string;
  if (len <= 10) sizeClass = "Oligopeptídeo";
  else if (len <= 50) sizeClass = "Peptídeo";
  else if (len <= 100) sizeClass = "Polipeptídeo";
  else sizeClass = "Proteína";

  return {
    length: len,
    cleanSeq: upper,
    sizeClass,
    molecularWeight: totalMw,
    netCharge,
    pI,
    gravy,
    composition: {
      hydrophobic: { count: hydrophobic, pct: ((hydrophobic / len) * 100).toFixed(1) },
      polar: { count: polar, pct: ((polar / len) * 100).toFixed(1) },
      chargedPos: { count: chargedPos, pct: ((chargedPos / len) * 100).toFixed(1) },
      chargedNeg: { count: chargedNeg, pct: ((chargedNeg / len) * 100).toFixed(1) },
      aromatic: { count: aromatic, pct: ((aromatic / len) * 100).toFixed(1) },
    },
    topAA,
    counts,
  };
}

/* ─── Formatted sequence display ─── */
function FormattedSequence({ seq }: { seq: string }) {
  const GROUP = 10;
  const GROUPS_PER_LINE = 5;
  const chars = seq.toUpperCase().replace(/[^A-Z]/g, "");
  const lines: { start: number; groups: string[] }[] = [];

  for (let i = 0; i < chars.length; i += GROUP * GROUPS_PER_LINE) {
    const lineChars = chars.slice(i, i + GROUP * GROUPS_PER_LINE);
    const groups: string[] = [];
    for (let g = 0; g < lineChars.length; g += GROUP) {
      groups.push(lineChars.slice(g, g + GROUP));
    }
    lines.push({ start: i + 1, groups });
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-0">
        {lines.map((line, li) => (
          <div key={li} className="flex items-baseline gap-2 sm:gap-3">
            <span className="text-[10px] text-muted-foreground/50 font-mono w-8 sm:w-10 text-right shrink-0 select-none tabular-nums">
              {line.start}
            </span>
            <div className="flex gap-1.5 sm:gap-2.5 flex-wrap">
              {line.groups.map((group, gi) => (
                <span key={gi} className="font-mono text-[11px] sm:text-xs text-foreground/90 tracking-wider">
                  {group}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Composition bar ─── */
function CompositionBar({ label, pct, color, icon }: { label: string; pct: string; color: string; icon: React.ReactNode }) {
  const val = parseFloat(pct);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
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

/* ─── Main component ─── */
export default function SequenceSection({
  sequence,
  sequenceLength,
  sourceOrigins,
  confidenceScore,
  lastSyncedAt,
  updatedAt,
}: SequenceSectionProps) {
  const [copied, setCopied] = useState(false);
  const [showComposition, setShowComposition] = useState(false);

  if (!sequence) {
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

  const analysis = analyzeSequence(sequence);
  const displayLength = sequenceLength || analysis.length;

  const confidenceLabel = confidenceScore != null
    ? confidenceScore >= 80 ? "Alta" : confidenceScore >= 50 ? "Média" : "Baixa"
    : null;
  const confidenceColor = confidenceScore != null
    ? confidenceScore >= 80 ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/10"
    : confidenceScore >= 50 ? "text-amber-400 border-amber-500/25 bg-amber-500/10"
    : "text-red-400 border-red-500/25 bg-red-500/10"
    : "";

  const primarySource = sourceOrigins?.length ? sourceOrigins[0] : "Manual";

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis.cleanSeq);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatMW = (mw: number) => {
    if (mw >= 1000) return `${(mw / 1000).toFixed(2)} kDa`;
    return `${mw.toFixed(1)} Da`;
  };

  return (
    <div className="space-y-4">
      {/* ── Metadata badges ── */}
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
        {confidenceLabel && (
          <Badge variant="outline" className={`text-[10px] gap-1 font-semibold ${confidenceColor}`}>
            Confiança: {confidenceLabel}
          </Badge>
        )}
      </div>

      {/* ── Formatted sequence ── */}
      <div className="relative group">
        <div className="p-3 sm:p-4 rounded-lg bg-secondary/30 border border-border">
          <FormattedSequence seq={analysis.cleanSeq} />
        </div>
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-card/80 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all opacity-0 group-hover:opacity-100"
          title="Copiar sequência"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* ── Physicochemical properties grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { icon: <Atom className="h-3.5 w-3.5 text-primary" />, label: "Massa Molecular", value: formatMW(analysis.molecularWeight) },
          { icon: <ZapIcon className="h-3.5 w-3.5 text-amber-400" />, label: "Carga Líquida", value: analysis.netCharge > 0 ? `+${analysis.netCharge}` : `${analysis.netCharge}` },
          { icon: <Droplets className="h-3.5 w-3.5 text-sky-400" />, label: "pI Estimado", value: analysis.pI ? analysis.pI.toFixed(1) : "—" },
          { icon: <FlaskConical className="h-3.5 w-3.5 text-violet-400" />, label: "GRAVY", value: analysis.gravy.toFixed(2) },
        ].map((prop) => (
          <div key={prop.label} className="p-2.5 rounded-lg bg-secondary/30 border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              {prop.icon}
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">{prop.label}</span>
            </div>
            <p className="text-sm font-bold text-foreground tabular-nums">{prop.value}</p>
          </div>
        ))}
      </div>

      {/* ── Composition toggle ── */}
      <button
        onClick={() => setShowComposition(!showComposition)}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors group/comp"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${showComposition ? "rotate-180" : ""}`} />
        Composição de Aminoácidos
      </button>

      {showComposition && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Composition bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
            <CompositionBar
              label="Hidrofóbicos"
              pct={analysis.composition.hydrophobic.pct}
              color="bg-amber-500"
              icon={<div className="h-2 w-2 rounded-full bg-amber-500" />}
            />
            <CompositionBar
              label="Polares"
              pct={analysis.composition.polar.pct}
              color="bg-sky-500"
              icon={<div className="h-2 w-2 rounded-full bg-sky-500" />}
            />
            <CompositionBar
              label="Carregados (+)"
              pct={analysis.composition.chargedPos.pct}
              color="bg-emerald-500"
              icon={<div className="h-2 w-2 rounded-full bg-emerald-500" />}
            />
            <CompositionBar
              label="Carregados (−)"
              pct={analysis.composition.chargedNeg.pct}
              color="bg-rose-500"
              icon={<div className="h-2 w-2 rounded-full bg-rose-500" />}
            />
            <CompositionBar
              label="Aromáticos"
              pct={analysis.composition.aromatic.pct}
              color="bg-violet-500"
              icon={<div className="h-2 w-2 rounded-full bg-violet-500" />}
            />
          </div>

          {/* Top residues */}
          <div>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-2">Resíduos mais frequentes</p>
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

      {/* ── Footer note ── */}
      <p className="text-[10px] text-muted-foreground/30 leading-relaxed">
        Cada letra representa um aminoácido na sequência peptídica. Propriedades calculadas são estimativas baseadas na sequência primária.
        {lastSyncedAt && ` Última sincronização: ${new Date(lastSyncedAt).toLocaleDateString("pt-BR")}.`}
      </p>
    </div>
  );
}
