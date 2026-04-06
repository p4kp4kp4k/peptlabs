import { Card, CardContent } from "@/components/ui/card";
import { Tag, Activity, Clock, Beaker } from "lucide-react";

interface QuickFactsProps {
  classification?: string | null;
  evidence_level?: string | null;
  half_life?: string | null;
  reconstitution?: string | null;
}

export default function QuickFacts({ classification, evidence_level, half_life, reconstitution }: QuickFactsProps) {
  const facts = [
    { icon: Tag, label: "Classificação", value: classification },
    { icon: Activity, label: "Evidência", value: evidence_level },
    { icon: Clock, label: "Meia-Vida", value: half_life },
    { icon: Beaker, label: "Reconstituição", value: reconstitution },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {facts.map((fact) => (
        <Card key={fact.label} className="border-border/40 bg-card/80">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <fact.icon className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{fact.label}</span>
            </div>
            <p className="text-xs text-foreground font-medium">{fact.value || "—"}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
