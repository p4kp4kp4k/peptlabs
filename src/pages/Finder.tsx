import { useState } from "react";
import { Search, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { finderGoals } from "@/data/peptides";

export default function Finder() {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (label: string) => {
    setSelected((prev) =>
      prev.includes(label)
        ? prev.filter((s) => s !== label)
        : prev.length < 4
        ? [...prev, label]
        : prev
    );
  };

  return (
    <div className="flex items-start justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Encontre seu Peptídeo
          </h1>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          Responda algumas perguntas e receba recomendações personalizadas.
        </p>

        {/* Progress bar */}
        <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-1/4 rounded-full bg-primary transition-all" />
        </div>

        {/* Question */}
        <h2 className="mb-2 text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Quais são seus objetivos?
        </h2>
        <p className="mb-6 text-xs text-muted-foreground">
          Selecione de 1 a 4 objetivos que mais importam para você.
        </p>

        {/* Goals grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {finderGoals.map((goal) => {
            const isSelected = selected.includes(goal.label);
            return (
              <button
                key={goal.label}
                onClick={() => toggle(goal.label)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/40 bg-card text-muted-foreground hover:border-primary/30"
                }`}
              >
                <span className="text-xl">{goal.emoji}</span>
                <span className="flex-1 text-sm font-medium">{goal.label}</span>
                {isSelected && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <Button
          className="mt-6 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={selected.length === 0}
        >
          Continuar <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
