import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, FlaskConical, Clock, Beaker, Tag, Activity,
  CheckCircle2, AlertTriangle, Zap, TrendingUp, BookOpen
} from "lucide-react";

const categoryColors: Record<string, string> = {
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
};

function getCategoryColor(cat: string) {
  return categoryColors[cat] || "from-primary/20 to-primary/10 text-primary";
}

export default function PeptideDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: peptide, isLoading } = useQuery({
    queryKey: ["peptide", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("peptides")
        .select("*")
        .eq("slug", slug!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!peptide) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center flex-col gap-3">
        <p className="text-sm text-muted-foreground">Peptídeo não encontrado.</p>
        <button onClick={() => navigate("/library")} className="text-xs text-primary hover:underline">
          Voltar à Biblioteca
        </button>
      </div>
    );
  }

  const timeline = peptide.timeline as Array<{ period: string; description: string }> | null;
  const catColor = getCategoryColor(peptide.category);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate("/library")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar à Biblioteca
        </button>

        <div className="flex items-start gap-4">
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${catColor}`}>
            <FlaskConical className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {peptide.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Badge variant="outline" className="text-[10px] border-border/60">{peptide.category}</Badge>
              {peptide.classification && (
                <span className="text-[10px] text-muted-foreground">{peptide.classification}</span>
              )}
            </div>
            {peptide.description && (
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed max-w-2xl">{peptide.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Facts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Tag, label: "Classificação", value: peptide.classification },
          { icon: Activity, label: "Evidência", value: peptide.evidence_level },
          { icon: Clock, label: "Meia-Vida", value: peptide.half_life },
          { icon: Beaker, label: "Reconstituição", value: peptide.reconstitution },
        ].map((fact) => (
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

      {/* Alt Names */}
      {peptide.alternative_names && peptide.alternative_names.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Nomes Alternativos</p>
          <div className="flex flex-wrap gap-1.5">
            {peptide.alternative_names.map((n: string) => (
              <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-secondary/50 w-full justify-start gap-0.5">
          <TabsTrigger value="overview" className="text-xs gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Zap className="h-3 w-3" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="dosage" className="text-xs gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Beaker className="h-3 w-3" /> Dosagem
          </TabsTrigger>
          <TabsTrigger value="research" className="text-xs gap-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <BookOpen className="h-3 w-3" /> Pesquisa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* Mechanism */}
          {peptide.mechanism && (
            <Card className="border-border/40 bg-card/80">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Mecanismo de Ação
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{peptide.mechanism}</p>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          {peptide.benefits && peptide.benefits.length > 0 && (
            <Card className="border-border/40 bg-card/80">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Benefícios Comprovados
                </h3>
                <div className="space-y-2">
                  {peptide.benefits.map((b: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <span className="text-xs text-foreground">{b}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Side Effects */}
          {peptide.side_effects && (
            <Card className="border-border/40 bg-card/80">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  <AlertTriangle className="inline h-3.5 w-3.5 text-amber-400 mr-1.5" />
                  Efeitos Colaterais
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{peptide.side_effects}</p>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          {timeline && timeline.length > 0 && (
            <Card className="border-border/40 bg-card/80">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  <TrendingUp className="inline h-3.5 w-3.5 text-primary mr-1.5" />
                  Linha do Tempo de Resultados
                </h3>
                <div className="space-y-3">
                  {timeline.map((t, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="flex flex-col items-center">
                        <div className="h-2.5 w-2.5 rounded-full bg-primary shrink-0 mt-1" />
                        {i < timeline.length - 1 && <div className="w-px flex-1 bg-border/60 min-h-[20px]" />}
                      </div>
                      <div className="pb-2">
                        <p className="text-xs font-semibold text-foreground">{t.period}</p>
                        <p className="text-[11px] text-muted-foreground">{t.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dosage" className="mt-4">
          <Card className="border-border/40 bg-card/80">
            <CardContent className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Informações de Dosagem
              </h3>
              {peptide.dosage_info ? (
                <p className="text-xs text-muted-foreground leading-relaxed">{peptide.dosage_info}</p>
              ) : (
                <p className="text-xs text-muted-foreground italic">Informações de dosagem não disponíveis.</p>
              )}
              {peptide.reconstitution && (
                <div className="pt-2 border-t border-border/40">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Reconstituição</p>
                  <p className="text-xs text-foreground">{peptide.reconstitution}</p>
                </div>
              )}
              {peptide.half_life && (
                <div className="pt-2 border-t border-border/40">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Meia-Vida</p>
                  <p className="text-xs text-foreground">{peptide.half_life}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="research" className="mt-4">
          <Card className="border-border/40 bg-card/80">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Nível de Evidência
              </h3>
              <Badge variant="outline" className="text-xs mb-3">{peptide.evidence_level || "Não classificado"}</Badge>
              <p className="text-xs text-muted-foreground leading-relaxed">
                As informações apresentadas são baseadas em estudos pré-clínicos e clínicos disponíveis na literatura científica. 
                Consulte sempre um profissional de saúde qualificado antes de utilizar qualquer peptídeo.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
