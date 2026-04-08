import {
  Heart, Brain, Zap, Shield, Sparkles, Dumbbell,
  Sun, Clock, Leaf, FlaskConical, Pill, Layers
} from "lucide-react";

export const categoryConfig: Record<string, { color: string; bgColor: string; borderColor: string }> = {
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
  "Definição": { color: "text-sky-400", bgColor: "bg-sky-500/15", borderColor: "border-sky-500/30" },
};

export function getCatConfig(cat: string) {
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
  "Definição": Zap,
};

export function getCatIcon(cat: string) {
  return categoryIcons[cat] || Layers;
}
