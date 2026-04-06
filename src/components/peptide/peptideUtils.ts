export const categoryColors: Record<string, string> = {
  "Metabolismo": "from-amber-500/20 to-orange-500/20 text-amber-400",
  "Recuperação": "from-emerald-500/20 to-green-500/20 text-emerald-400",
  "Cognição": "from-violet-500/20 to-purple-500/20 text-violet-400",
  "Hormonal": "from-blue-500/20 to-cyan-500/20 text-blue-400",
  "Imunidade": "from-rose-500/20 to-pink-500/20 text-rose-400",
  "Anti-aging": "from-fuchsia-500/20 to-purple-500/20 text-fuchsia-400",
  "Estética": "from-pink-500/20 to-rose-500/20 text-pink-400",
  "Performance": "from-cyan-500/20 to-teal-500/20 text-cyan-400",
  "Saúde Sexual": "from-red-500/20 to-rose-500/20 text-red-400",
  "Sono": "from-indigo-500/20 to-blue-500/20 text-indigo-400",
  "Intestinal": "from-lime-500/20 to-green-500/20 text-lime-400",
  "Longevidade": "from-teal-500/20 to-emerald-500/20 text-teal-400",
  "Nootropicos": "from-violet-500/20 to-indigo-500/20 text-violet-400",
};

export function getCategoryColor(cat: string) {
  return categoryColors[cat] || "from-primary/20 to-primary/10 text-primary";
}
