import { useState, useMemo } from "react";
import { Search, ArrowRight, ArrowLeft, Check, Sparkles, Syringe, AlertTriangle, Star, Timer, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { runEngine, getAvailableGoals, type GeneratedProtocol } from "@/engine";
import { createProtocol } from "@/services/protocolService";
import { saveRecommendation } from "@/services/userService";
import { useEntitlements, checkEntitlement } from "@/hooks/useEntitlements";
import PremiumGateModal from "@/components/PremiumGateModal";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type Step = "goals" | "experience" | "administration" | "result";

type Experience = "beginner" | "intermediate" | "advanced";
type Administration = "injectable" | "nasal" | "topical" | "any";

interface MatchedPeptide {
  name: string;
  slug: string;
  category: string;
  description: string | null;
  goals: string[];
  application: string | null;
  score: number;
}

const EXPERIENCE_OPTIONS = [
  { key: "beginner" as Experience, label: "Iniciante", desc: "Nunca usei peptídeos" },
  { key: "intermediate" as Experience, label: "Intermediário", desc: "Já usei 1-3 peptídeos" },
  { key: "advanced" as Experience, label: "Avançado", desc: "Experiência com múltiplos protocolos" },
];

const ADMIN_OPTIONS = [
  { key: "injectable" as Administration, label: "Injetável (Subcutâneo)", desc: "Maior biodisponibilidade" },
  { key: "nasal" as Administration, label: "Spray Nasal", desc: "Mais fácil de usar" },
  { key: "topical" as Administration, label: "Tópico (Creme/Gel)", desc: "Uso externo" },
  { key: "any" as Administration, label: "Sem preferência", desc: "Aberto a qualquer via" },
];

export default function Finder() {
  const [step, setStep] = useState<Step>("goals");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [administration, setAdministration] = useState<Administration | null>(null);
  const [dbResults, setDbResults] = useState<MatchedPeptide[]>([]);
  const [engineResult, setEngineResult] = useState<GeneratedProtocol | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateReason, setGateReason] = useState("");
  const { user } = useAuth();
  const { canCreate } = useEntitlements();
  const { toast } = useToast();
  const navigate = useNavigate();

  const goals = getAvailableGoals();

  const stepIndex = step === "goals" ? 0 : step === "experience" ? 1 : step === "administration" ? 2 : 3;
  const totalSteps = 4;
  const progressWidth = ((stepIndex + 1) / totalSteps) * 100;

  const toggleGoal = (label: string) => {
    setSelectedGoals((prev) =>
      prev.includes(label)
        ? prev.filter((s) => s !== label)
        : prev.length < 4 ? [...prev, label] : prev
    );
  };

  const handleGenerateResults = async () => {
    setLoading(true);
    try {
      // 1. Run local engine for protocol generation
      const protocol = runEngine({
        goals: selectedGoals,
        experience: experience || "intermediate",
      });
      setEngineResult(protocol);

      // 2. Query DB for matching peptides by goals
      const { data: peptides } = await supabase
        .from("peptides")
        .select("name, slug, category, description, goals, application")
        .order("name");

      if (peptides) {
        const matched = peptides
          .filter((p: any) => {
            const pGoals = (p.goals as string[]) || [];
            return pGoals.some((g: string) =>
              selectedGoals.some((sg) => g.toLowerCase().includes(sg.toLowerCase().split(" ")[0]))
            );
          })
          .filter((p: any) => {
            if (administration === "any" || !administration) return true;
            const app = (p.application || "").toLowerCase();
            if (administration === "injectable") return app.includes("subcutâne") || app.includes("injetável") || app.includes("injeção") || !app;
            if (administration === "nasal") return app.includes("nasal") || app.includes("spray") || !app;
            if (administration === "topical") return app.includes("tópic") || app.includes("creme") || app.includes("gel") || !app;
            return true;
          })
          .map((p: any) => ({
            name: p.name,
            slug: p.slug,
            category: p.category,
            description: p.description,
            goals: p.goals || [],
            application: p.application,
            score: calculateMatchScore(p, selectedGoals),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 8);

        setDbResults(matched as MatchedPeptide[]);
      }
    } catch (err) {
      console.error("Error generating results:", err);
    } finally {
      setLoading(false);
      setStep("result");
    }
  };

  const handleSave = async () => {
    if (!user || !engineResult) return;
    if (!canCreate("protocol")) {
      setGateReason("Limite de 3 protocolos atingido no plano gratuito.");
      setGateOpen(true);
      return;
    }
    setSaving(true);
    try {
      const check = await checkEntitlement("protocol");
      if (!check.allowed) {
        setGateReason(check.reason || "Limite atingido.");
        setGateOpen(true);
        return;
      }
      await createProtocol({
        user_id: user.id,
        name: engineResult.name,
        description: engineResult.description,
        peptides: engineResult.peptides as any,
        status: "draft",
      });
      await saveRecommendation({
        user_id: user.id,
        goals: selectedGoals as any,
        recommended_peptides: engineResult.peptides as any,
        notes: `Score: ${engineResult.totalScore}. Quiz v2.`,
      });
      toast({ title: "Protocolo salvo!", description: "Acesse seu Dashboard para ver." });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const resetQuiz = () => {
    setStep("goals");
    setSelectedGoals([]);
    setExperience(null);
    setAdministration(null);
    setDbResults([]);
    setEngineResult(null);
  };

  return (
    <div className="flex items-start justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
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
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressWidth}%` }}
          />
        </div>

        {/* ───── Step 1: Goals ───── */}
        {step === "goals" && (
          <>
            <h2 className="mb-1 text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Quais são seus objetivos?
            </h2>
            <p className="mb-6 text-xs text-muted-foreground">
              Selecione de 1 a 4 objetivos que mais importam para você.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {goals.map((goal) => {
                const isSelected = selectedGoals.includes(goal.goal);
                return (
                  <button
                    key={goal.goal}
                    onClick={() => toggleGoal(goal.goal)}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border/40 bg-card text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    <span className="text-xl">{goal.emoji}</span>
                    <span className="flex-1 text-sm font-medium">{goal.goal}</span>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
            <Button
              className="mt-6 w-full gap-2"
              disabled={selectedGoals.length === 0}
              onClick={() => setStep("experience")}
            >
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* ───── Step 2: Experience ───── */}
        {step === "experience" && (
          <>
            <h2 className="mb-1 text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Qual sua experiência com peptídeos?
            </h2>
            <p className="mb-6 text-xs text-muted-foreground">
              Isso nos ajuda a recomendar opções adequadas ao seu nível.
            </p>
            <div className="space-y-3">
              {EXPERIENCE_OPTIONS.map((opt) => {
                const isSelected = experience === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setExperience(opt.key)}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border/40 bg-card hover:border-primary/30"
                    }`}
                  >
                    <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => setStep("goals")}>
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button
                className="flex-1 gap-2"
                disabled={!experience}
                onClick={() => setStep("administration")}
              >
                Continuar <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* ───── Step 3: Administration ───── */}
        {step === "administration" && (
          <>
            <h2 className="mb-1 text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Preferência de administração?
            </h2>
            <p className="mb-6 text-xs text-muted-foreground">
              Qual via de administração você prefere?
            </p>
            <div className="space-y-3">
              {ADMIN_OPTIONS.map((opt) => {
                const isSelected = administration === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setAdministration(opt.key)}
                    className={`w-full rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border/40 bg-card hover:border-primary/30"
                    }`}
                  >
                    <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="gap-2" onClick={() => setStep("experience")}>
                <ArrowLeft className="h-4 w-4" /> Voltar
              </Button>
              <Button
                className="flex-1 gap-2"
                disabled={!administration || loading}
                onClick={handleGenerateResults}
              >
                {loading ? (
                  <>Analisando...</>
                ) : (
                  <>Ver Resultados <Sparkles className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </>
        )}

        {/* ───── Step 4: Results ───── */}
        {step === "result" && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Seus Peptídeos Recomendados
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              Baseado nos seus objetivos ({selectedGoals.length}) e nível de experiência.
            </p>

            {/* DB-matched peptides */}
            {dbResults.length > 0 && (
              <div className="space-y-3 mb-6">
                {dbResults.map((p) => (
                  <button
                    key={p.slug}
                    onClick={() => navigate(`/peptide/${p.slug}`)}
                    className="w-full flex items-center gap-4 rounded-xl border border-border/40 bg-card p-4 text-left hover:border-primary/30 transition-all group"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Syringe className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">{p.name}</span>
                      </div>
                      <p className="text-xs text-primary font-medium">{p.category}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {p.description || "—"}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Engine protocol card */}
            {engineResult && (
              <>
                <div className="border-t border-border/30 pt-4 mb-4">
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    <Star className="h-4 w-4 text-primary" /> Protocolo Sugerido
                    <Badge className="ml-auto text-[10px] border-0 bg-primary/10 text-primary">
                      <Timer className="h-3 w-3 mr-1" /> {engineResult.duration}
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">{engineResult.description}</p>

                  <Card className="border-border/40 bg-card/80 mb-3">
                    <CardContent className="p-3 space-y-2">
                      {engineResult.peptides.map((p, i) => {
                        // Find slug from engine rules
                        const slug = p.slug || p.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                        return (
                          <button
                            key={p.name}
                            onClick={() => navigate(`/peptide/${slug}`)}
                            className="w-full rounded-lg bg-secondary/20 p-3 text-left hover:bg-secondary/40 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-foreground">{i + 1}. {p.name}</span>
                              <Badge variant="outline" className="text-[9px]">{p.duration}</Badge>
                            </div>
                            <p className="text-[10px] text-primary font-medium">{p.dose}</p>
                            <p className="text-[10px] text-muted-foreground">{p.frequency}</p>
                            {p.notes && <p className="text-[9px] text-muted-foreground/70 mt-1 italic">{p.notes}</p>}
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {engineResult.synergies.length > 0 && (
                    <Card className="border-emerald-500/20 bg-emerald-500/5 mb-3">
                      <CardContent className="p-3 space-y-1.5">
                        <p className="text-[10px] font-semibold text-emerald-400">✓ Sinergias detectadas</p>
                        {engineResult.synergies.map((s, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground">{s}</p>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {engineResult.warnings.length > 0 && (
                    <Card className="border-amber-500/20 bg-amber-500/5 mb-3">
                      <CardContent className="p-3 space-y-1.5">
                        <p className="text-[10px] font-semibold text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Avisos
                        </p>
                        {engineResult.warnings.map((w, i) => (
                          <p key={i} className="text-[10px] text-muted-foreground">{w}</p>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2" onClick={resetQuiz}>
                <RotateCcw className="h-4 w-4" /> Recomeçar
              </Button>
              {user && engineResult ? (
                <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar Protocolo"}
                </Button>
              ) : (
                <Button className="flex-1 gap-2" onClick={() => navigate("/app/peptides")}>
                  Ver Biblioteca Completa <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
      <PremiumGateModal open={gateOpen} onClose={() => setGateOpen(false)} reason={gateReason} />
    </div>
  );
}

/** Calculate match score based on goal overlap */
function calculateMatchScore(peptide: any, selectedGoals: string[]): number {
  const pGoals = (peptide.goals as string[]) || [];
  let score = 0;
  for (const sg of selectedGoals) {
    const keyword = sg.toLowerCase().split(" ")[0];
    if (pGoals.some((g: string) => g.toLowerCase().includes(keyword))) {
      score += 25;
    }
  }
  return Math.min(100, score);
}
