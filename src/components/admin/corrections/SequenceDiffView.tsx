import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Beaker, ArrowRight, XCircle, Info } from "lucide-react";
import { compareSequences, type SequenceDiffResult, type DiffChar } from "./sequenceDiff";

interface SequenceDiffViewProps {
  seqA: string | null;
  seqB: string | null;
  labelA?: string;
  labelB?: string;
}

const conflictColors: Record<string, string> = {
  low: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  moderate: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  critical: "text-red-400 bg-red-400/10 border-red-400/30",
};

const conflictLabels: Record<string, string> = {
  low: "Conflito Leve",
  moderate: "Conflito Moderado",
  critical: "Conflito Crítico",
};

const conflictIcons: Record<string, JSX.Element> = {
  low: <CheckCircle2 className="h-3 w-3" />,
  moderate: <AlertTriangle className="h-3 w-3" />,
  critical: <XCircle className="h-3 w-3" />,
};

export default function SequenceDiffView({ seqA, seqB, labelA = "PeptLabs", labelB = "Fonte Externa" }: SequenceDiffViewProps) {
  const result = compareSequences(seqA, seqB);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Beaker className="h-4 w-4 text-primary" />
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
          Análise de Sequência
        </h4>
        <Badge className={`text-[8px] ml-auto ${conflictColors[result.conflictLevel]}`}>
          {conflictIcons[result.conflictLevel]}
          <span className="ml-1">{conflictLabels[result.conflictLevel]}</span>
        </Badge>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MetricBox label="Similaridade" value={`${result.similarity}%`} color={result.similarity >= 80 ? "text-emerald-400" : result.similarity >= 40 ? "text-amber-400" : "text-red-400"} />
        <MetricBox label="Diferença" value={`${result.difference}%`} color="text-muted-foreground" />
        <MetricBox label={`Tam. ${labelA}`} value={`${result.lengthA} aa`} color="text-foreground" />
        <MetricBox label={`Tam. ${labelB}`} value={`${result.lengthB} aa`} color="text-foreground" />
      </div>

      {/* Similarity bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[9px] text-muted-foreground">
          <span>0%</span>
          <span>Similaridade</span>
          <span>100%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary/60 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              result.similarity >= 80 ? "bg-emerald-400" : result.similarity >= 40 ? "bg-amber-400" : "bg-red-400"
            }`}
            style={{ width: `${result.similarity}%` }}
          />
        </div>
      </div>

      {/* Aligned diff view */}
      {result.alignedA.length > 0 && result.alignedB.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Alinhamento</p>
          <div className="rounded-lg border border-border/20 bg-secondary/20 p-2 overflow-x-auto">
            <div className="space-y-0.5">
              <AlignmentRow label={labelA} chars={result.alignedA} />
              <MatchRow charsA={result.alignedA} charsB={result.alignedB} />
              <AlignmentRow label={labelB} chars={result.alignedB} />
            </div>
          </div>
          <div className="flex gap-3 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-emerald-400/40" /> Idêntico</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-red-400/40" /> Diferente</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-sm bg-amber-400/40" /> Gap</span>
          </div>
        </div>
      )}

      {/* Explanation */}
      <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/15">
        <p className="text-[10px] text-foreground flex items-start gap-1.5">
          <Info className="h-3 w-3 text-primary shrink-0 mt-0.5" />
          <span>{result.explanation}</span>
        </p>
      </div>

      {/* Recommendation */}
      <div className={`p-2.5 rounded-lg border ${
        result.requiresManualReview
          ? "bg-amber-400/5 border-amber-400/20"
          : "bg-emerald-400/5 border-emerald-400/20"
      }`}>
        <p className="text-[10px] font-medium flex items-start gap-1.5">
          {result.requiresManualReview
            ? <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
            : <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" />
          }
          <span className={result.requiresManualReview ? "text-amber-400" : "text-emerald-400"}>
            {result.recommendation}
          </span>
        </p>
      </div>
    </div>
  );
}

function MetricBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-2 rounded-lg bg-secondary/40 border border-border/15 text-center">
      <p className={`text-sm font-bold ${color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{value}</p>
      <p className="text-[9px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function AlignmentRow({ label, chars }: { label: string; chars: DiffChar[] }) {
  const maxShow = 120;
  const shown = chars.slice(0, maxShow);
  const truncated = chars.length > maxShow;

  return (
    <div className="flex items-start gap-1.5">
      <span className="text-[8px] text-muted-foreground w-14 shrink-0 text-right pt-0.5 truncate">{label}</span>
      <div className="font-mono text-[9px] leading-tight flex flex-wrap">
        {shown.map((c, i) => (
          <span
            key={i}
            className={`inline-block w-[8px] text-center ${
              c.type === "match" ? "text-emerald-400 bg-emerald-400/10"
              : c.type === "mismatch" ? "text-red-400 bg-red-400/15 font-bold"
              : "text-amber-400/60 bg-amber-400/5"
            }`}
          >
            {c.char}
          </span>
        ))}
        {truncated && <span className="text-muted-foreground ml-0.5">…</span>}
      </div>
    </div>
  );
}

function MatchRow({ charsA, charsB }: { charsA: DiffChar[]; charsB: DiffChar[] }) {
  const maxShow = 120;
  const len = Math.min(charsA.length, maxShow);

  return (
    <div className="flex items-start gap-1.5">
      <span className="w-14 shrink-0" />
      <div className="font-mono text-[7px] leading-tight flex flex-wrap text-muted-foreground/50">
        {Array.from({ length: len }).map((_, i) => {
          const a = charsA[i], b = charsB[i];
          const match = a?.char === b?.char && a?.type !== "gap";
          return (
            <span key={i} className="inline-block w-[8px] text-center">
              {match ? "|" : a?.type === "gap" || b?.type === "gap" ? " " : "×"}
            </span>
          );
        })}
      </div>
    </div>
  );
}
