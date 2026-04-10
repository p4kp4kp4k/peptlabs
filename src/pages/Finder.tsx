import { useState } from "react";
import PremiumGateModal from "@/components/PremiumGateModal";
import {
  Crosshair, ArrowRight, ArrowLeft, Check, Sparkles, Zap,
  AlertTriangle, Star, Timer, Save, RotateCcw, ChevronRight,
  Shield, Activity, FlaskConical, Target, Loader2,
  Bone, Scale, BrainCircuit, Hourglass, Moon, ShieldPlus,
  HeartPulse, TrendingUp, Palette, Heart,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { runEngine, getAvailableGoals, type GeneratedProtocol } from "@/engine";
import { createProtocol } from "@/services/protocolService";
import { saveRecommendation } from "@/services/userService";
import { useEntitlements } from "@/hooks/useEntitlements";
import { checkFeatureAccess } from "@/modules/access";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

type Step = "goals" | "profile" | "preferences" | "analyzing" | "result";
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
  matchReason: string;
}

const PROFILE_OPTIONS = [
  {
    key: "beginner" as Experience,
    icon: Shield,
    label: "Primeira vez",
    desc: "Quero começar com segurança e entender os fundamentos",
  },
  {
    key: "intermediate" as Experience,
    icon: Activity,
    label: "Já experimentei",
    desc: "Tenho experiência com 1-3 compostos e quero otimizar",
  },
  {
    key: "advanced" as Experience,
    icon: FlaskConical,
    label: "Protocolo avançado",
    desc: "Uso regular com múltiplos compostos e stacks complexos",
  },
];

const ROUTE_OPTIONS = [
  {
    key: "injectable" as Administration,
    label: "Subcutâneo",
    desc: "Absorção direta, maior precisão de dosagem",
    tag: "Mais eficaz",
  },
  {
    key: "nasal" as Administration,
    label: "Intranasal",
    desc: "Sem agulhas, ideal para nootrópicos e peptídeos leves",
    tag: "Mais prático",
  },
  {
    key: "topical" as Administration,
    label: "Tópico",
    desc: "Aplicação local em pele, articulações ou cabelo",
    tag: "Não invasivo",
  },
  {
    key: "any" as Administration,
    label: "Qualquer via",
    desc: "Priorizo resultados independente do método",
    tag: "Flexível",
  },
];

const GOAL_ICON_MAP: Record<string, { icon: LucideIcon; gradient: string }> = {
  "Recuperação & Cicatrização": { icon: Bone, gradient: "from-emerald-500 to-teal-400" },
  "Emagrecimento & Composição Corporal": { icon: Scale, gradient: "from-orange-500 to-amber-400" },
  "Desempenho Cognitivo": { icon: BrainCircuit, gradient: "from-violet-500 to-purple-400" },
  "Anti-aging & Longevidade": { icon: Hourglass, gradient: "from-amber-500 to-yellow-400" },
  "Sono & Recuperação Noturna": { icon: Moon, gradient: "from-indigo-500 to-blue-400" },
  "Imunidade & Anti-inflamatório": { icon: ShieldPlus, gradient: "from-rose-500 to-pink-400" },
  "Saúde Hormonal & Sexual": { icon: HeartPulse, gradient: "from-red-500 to-rose-400" },
  "Hormônio do Crescimento (GH)": { icon: TrendingUp, gradient: "from-cyan-500 to-teal-400" },
  "Estética & Pele": { icon: Palette, gradient: "from-pink-500 to-fuchsia-400" },
  "Saúde Cardiovascular": { icon: Heart, gradient: "from-red-500 to-orange-400" },
};

const STEP_META: Record<Step, { num: number; title: string; sub: string }> = {
  goals: { num: 1, title: "Quais são seus objetivos?", sub: "Selecione de 1 a 4 objetivos que mais importam para você." },
  profile: { num: 2, title: "Seu perfil de uso", sub: "Adaptamos a complexidade e dosagens ao seu nível." },
  preferences: { num: 3, title: "Via de aplicação", sub: "Cada método tem vantagens distintas. Qual combina com você?" },
  analyzing: { num: 4, title: "Processando análise", sub: "Cruzando dados de compatibilidade e interações..." },
  result: { num: 4, title: "Análise completa", sub: "" },
};

export default function Finder() {
  const [step, setStep] = useState<Step>("goals");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [administration, setAdministration] = useState<Administration | null>(null);
  const [dbResults, setDbResults] = useState<MatchedPeptide[]>([]);
  const [engineResult, setEngineResult] = useState<GeneratedProtocol | null>(null);
  const [saving, setSaving] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateReason, setGateReason] = useState("");
  const { user } = useAuth();
  const { isAdmin, isPro } = useEntitlements();
  const { toast } = useToast();
  const navigate = useNavigate();

  const goals = getAvailableGoals();
  const currentMeta = STEP_META[step];
  const progressWidth = (currentMeta.num / 4) * 100;

  const toggleGoal = (label: string) => {
    setSelectedGoals((prev) =>
      prev.includes(label)
        ? prev.filter((s) => s !== label)
        : prev.length < 4 ? [...prev, label] : prev
    );
  };

  const buildMatchReason = (peptide: any, goals: string[]): string => {
    const pGoals = (peptide.goals as string[]) || [];
    const matched = goals.filter((sg) => {
      const kw = sg.toLowerCase().split(" ")[0];
      return pGoals.some((g: string) => g.toLowerCase().includes(kw));
    });
    if (matched.length > 1) return `Relevante para ${matched.length} dos seus objetivos`;
    if (matched.length === 1) return `Indicado para ${matched[0].toLowerCase()}`;
    return "Match por categoria";
  };

  const getExperienceLabel = () => {
    if (!experience) return "";
    return PROFILE_OPTIONS.find((o) => o.key === experience)?.label || "";
  };

  const getAdminLabel = () => {
    if (!administration) return "";
    return ROUTE_OPTIONS.find((o) => o.key === administration)?.label || "";
  };

  const handleGenerate = async () => {
    setStep("analyzing");

    // Simulate analysis delay for premium feel
    await new Promise((r) => setTimeout(r, 1800));

    try {
      const protocol = runEngine({
        goals: selectedGoals,
        experience: experience || "intermediate",
      });
      setEngineResult(protocol);

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
            matchReason: buildMatchReason(p, selectedGoals),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 6);

        setDbResults(matched as MatchedPeptide[]);
      }
    } catch (err) {
      console.error("Error generating results:", err);
    } finally {
      setStep("result");
    }
  };

  const handleSave = async () => {
    if (!user || !engineResult) return;
    if (!isAdmin && !isPro) {
      setGateReason("Limite atingido no plano gratuito. Faça upgrade para continuar.");
      setGateOpen(true);
      return;
    }
    setSaving(true);
    try {
      const check = await checkFeatureAccess("create_protocol");
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
        notes: `Score: ${engineResult.totalScore}. Quiz v3.`,
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
    <>
    <div className="flex items-start justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        {/* ── Header ── */}
        <div className="mb-1 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Crosshair className="h-4 w-4 text-primary" />
          </div>
          <h1
            className="text-xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            PeptiLab Matcher
          </h1>
        </div>
        <p className="mb-5 text-xs text-muted-foreground pl-[42px]">
          Engine de recomendação inteligente — 3 etapas, resultado personalizado.
        </p>

        {/* ── Progress ── */}
        <div className="mb-6 flex items-center gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex-1 flex flex-col gap-1">
              <div
                className={`h-1 rounded-full transition-all duration-500 ${
                  n <= currentMeta.num ? "bg-primary" : "bg-secondary"
                }`}
              />
            </div>
          ))}
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {step === "result" ? "Concluído" : `${currentMeta.num}/4`}
          </span>
        </div>

        {/* Step title */}
        {step !== "analyzing" && step !== "result" && (
          <div className="mb-5">
            <h2
              className="text-base font-bold text-foreground"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {currentMeta.title}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{currentMeta.sub}</p>
          </div>
        )}

        {/* ════════ Step 1: Goals ════════ */}
        {step === "goals" && (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {goals.map((goal) => {
                const isSelected = selectedGoals.includes(goal.goal);
                const iconData = GOAL_ICON_MAP[goal.goal];
                const Icon = iconData?.icon || Target;
                const grad = iconData?.gradient || "from-primary to-primary";
                return (
                  <button
                    key={goal.goal}
                    onClick={() => toggleGoal(goal.goal)}
                    className={`group relative flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-primary/50 bg-primary/8 ring-1 ring-primary/20"
                        : "border-border/30 bg-card/60 hover:border-border/60 hover:bg-card"
                    }`}
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${grad} shadow-lg shadow-black/20`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className={`flex-1 text-[13px] font-medium ${isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                      {goal.goal}
                    </span>
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                        isSelected
                          ? "border-primary bg-primary"
                          : "border-border/40 bg-transparent"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedGoals.length > 0 && (
              <p className="mt-3 text-[10px] text-primary font-medium">
                {selectedGoals.length} alvo{selectedGoals.length > 1 ? "s" : ""} selecionado{selectedGoals.length > 1 ? "s" : ""}
                {selectedGoals.length < 4 && ` — pode adicionar mais ${4 - selectedGoals.length}`}
              </p>
            )}
            <Button
              className="mt-5 w-full gap-2 h-10"
              disabled={selectedGoals.length === 0}
              onClick={() => setStep("profile")}
            >
              Próxima etapa <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* ════════ Step 2: Profile ════════ */}
        {step === "profile" && (
          <>
            <div className="space-y-2">
              {PROFILE_OPTIONS.map((opt) => {
                const isSelected = experience === opt.key;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setExperience(opt.key)}
                    className={`w-full flex items-start gap-3 rounded-lg border px-4 py-3.5 text-left transition-all ${
                      isSelected
                        ? "border-primary/50 bg-primary/8 ring-1 ring-primary/20"
                        : "border-border/30 bg-card/60 hover:border-border/60"
                    }`}
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <div>
                      <span className="text-sm font-semibold text-foreground block">{opt.label}</span>
                      <span className="text-[11px] text-muted-foreground">{opt.desc}</span>
                    </div>
                    <div
                      className={`ml-auto mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                        isSelected ? "border-primary bg-primary" : "border-border/40"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setStep("goals")}>
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar
              </Button>
              <Button className="flex-1 gap-2 h-10" disabled={!experience} onClick={() => setStep("preferences")}>
                Próxima etapa <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* ════════ Step 3: Preferences ════════ */}
        {step === "preferences" && (
          <>
            <div className="space-y-2">
              {ROUTE_OPTIONS.map((opt) => {
                const isSelected = administration === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setAdministration(opt.key)}
                    className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-all ${
                      isSelected
                        ? "border-primary/50 bg-primary/8 ring-1 ring-primary/20"
                        : "border-border/30 bg-card/60 hover:border-border/60"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border/40 text-muted-foreground">
                          {opt.tag}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-muted-foreground">{opt.desc}</span>
                    </div>
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                        isSelected ? "border-primary bg-primary" : "border-border/40"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Summary chips */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[10px]">{selectedGoals.length} alvo{selectedGoals.length > 1 ? "s" : ""}</Badge>
              <Badge variant="secondary" className="text-[10px]">{getExperienceLabel()}</Badge>
              {administration && <Badge variant="secondary" className="text-[10px]">{getAdminLabel()}</Badge>}
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setStep("profile")}>
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar
              </Button>
              <Button className="flex-1 gap-2 h-10" disabled={!administration} onClick={handleGenerate}>
                <Target className="h-4 w-4" /> Gerar análise
              </Button>
            </div>
          </>
        )}

        {/* ════════ Analyzing (transition) ════════ */}
        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-7 w-7 text-primary animate-spin" />
              </div>
            </div>
            <h2 className="text-base font-bold text-foreground mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Analisando compatibilidade
            </h2>
            <p className="text-xs text-muted-foreground max-w-xs">
              Cruzando {selectedGoals.length} objetivo{selectedGoals.length > 1 ? "s" : ""} com a base de {">"}70 compostos, verificando interações e sinergias...
            </p>
          </div>
        )}

        {/* ════════ Step 4: Results ════════ */}
        {step === "result" && (
          <>
            {/* Result header with context */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2
                  className="text-base font-bold text-foreground"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Sua análise personalizada
                </h2>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {selectedGoals.length} objetivo{selectedGoals.length > 1 ? "s" : ""} analisado{selectedGoals.length > 1 ? "s" : ""}
                {" · "}perfil {getExperienceLabel().toLowerCase()}
                {" · "}via {getAdminLabel().toLowerCase()}
              </p>
              {/* Show selected goals as context */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedGoals.map((g) => (
                  <Badge key={g} className="text-[10px] bg-primary/10 text-primary border-0">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Matched peptides from DB */}
            {dbResults.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                  <Zap className="h-3 w-3 text-primary" /> Compostos recomendados
                </h3>
                <div className="space-y-1.5">
                  {dbResults.map((p, i) => (
                    <button
                      key={p.slug}
                      onClick={() => navigate(`/peptide/${p.slug}`)}
                      className="w-full flex items-center gap-3 rounded-lg border border-border/25 bg-card/60 px-3 py-2.5 text-left hover:bg-card hover:border-primary/20 transition-all group"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/8 text-[11px] font-bold text-primary">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-bold text-foreground">{p.name}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-primary font-medium">{p.category}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground line-clamp-1">
                          {p.matchReason}
                        </p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Engine protocol */}
            {engineResult && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <Star className="h-3 w-3 text-primary" /> Protocolo montado
                  </h3>
                  <Badge className="text-[9px] border-0 bg-primary/10 text-primary h-5">
                    <Timer className="h-2.5 w-2.5 mr-0.5" /> {engineResult.duration}
                  </Badge>
                </div>

                <Card className="border-border/25 bg-card/60 mb-3">
                  <CardContent className="p-2 space-y-1">
                    {engineResult.peptides.map((p, i) => {
                      const slug = p.slug || p.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                      return (
                        <button
                          key={p.name}
                          onClick={() => navigate(`/peptide/${slug}`)}
                          className="w-full rounded-md bg-secondary/15 px-3 py-2.5 text-left hover:bg-secondary/30 transition-colors group"
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                              {i + 1}. {p.name}
                            </span>
                            <Badge variant="outline" className="text-[8px] h-4 px-1.5">{p.duration}</Badge>
                          </div>
                          <p className="text-[10px] text-primary font-medium">{p.dose}</p>
                          <p className="text-[10px] text-muted-foreground">{p.frequency}</p>
                          {p.notes && <p className="text-[9px] text-muted-foreground/60 mt-0.5 italic">{p.notes}</p>}
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Synergies */}
                {engineResult.synergies.length > 0 && (
                  <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-3 py-2 mb-2">
                    <p className="text-[10px] font-semibold text-emerald-400 mb-1">✓ Sinergias identificadas</p>
                    {engineResult.synergies.map((s, i) => (
                      <p key={i} className="text-[10px] text-muted-foreground leading-relaxed">{s}</p>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {engineResult.warnings.length > 0 && (
                  <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2 mb-2">
                    <p className="text-[10px] font-semibold text-amber-400 flex items-center gap-1 mb-1">
                      <AlertTriangle className="h-2.5 w-2.5" /> Pontos de atenção
                    </p>
                    {engineResult.warnings.map((w, i) => (
                      <p key={i} className="text-[10px] text-muted-foreground leading-relaxed">{w}</p>
                    ))}
                  </div>
                )}

                {/* Score */}
                <div className="flex items-center justify-between rounded-lg bg-secondary/10 px-3 py-2 mt-3">
                  <span className="text-[10px] text-muted-foreground">Score de compatibilidade</span>
                  <span className="text-sm font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {engineResult.totalScore}<span className="text-muted-foreground text-[10px] font-normal">/100</span>
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={resetQuiz}>
                <RotateCcw className="h-3.5 w-3.5" /> Nova análise
              </Button>
              {user && engineResult ? (
                <Button className="flex-1 gap-2 h-10" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar protocolo"}
                </Button>
              ) : (
                <Button className="flex-1 gap-2 h-10" onClick={() => navigate("/app/peptides")}>
                  Explorar biblioteca <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
      <PremiumGateModal open={gateOpen} onClose={() => setGateOpen(false)} reason={gateReason} />
      <PremiumGateModal open={gateOpen} onClose={() => setGateOpen(false)} reason="O PeptiLab Matcher é exclusivo para assinantes." />
    </div>
    </>
  );
}

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
