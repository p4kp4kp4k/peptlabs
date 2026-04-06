import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import type { Json } from "@/integrations/supabase/types";

interface Reference {
  titulo: string;
  fonte: string;
  ano: number;
}

interface ResearchTabProps {
  evidence_level?: string | null;
  scientific_references?: Json | null;
}

export default function ResearchTab({ evidence_level, scientific_references }: ResearchTabProps) {
  const refs = scientific_references as unknown as Reference[] | null;

  return (
    <div className="space-y-4">
      <Card className="border-border/40 bg-card/80">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Nível de Evidência
          </h3>
          <Badge variant="outline" className="text-xs mb-3">{evidence_level || "Não classificado"}</Badge>
          <p className="text-xs text-muted-foreground leading-relaxed">
            As informações apresentadas são baseadas em estudos pré-clínicos e clínicos disponíveis na literatura científica.
            Consulte sempre um profissional de saúde qualificado antes de utilizar qualquer peptídeo.
          </p>
        </CardContent>
      </Card>

      {refs && refs.length > 0 && (
        <Card className="border-border/40 bg-card/80">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <BookOpen className="inline h-3.5 w-3.5 text-primary mr-1.5" />
              Referências Científicas
            </h3>
            <div className="space-y-3">
              {refs.map((ref, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-secondary/30">
                  <p className="text-xs text-foreground font-medium">{ref.titulo}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-muted-foreground">{ref.fonte}</span>
                    <Badge variant="outline" className="text-[10px]">{ref.ano}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
