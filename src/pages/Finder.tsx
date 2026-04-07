import { useState } from "react";
import { Search, ArrowRight, Check, Sparkles, ArrowLeft, Syringe, AlertTriangle, Star, Timer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { runEngine, getAvailableGoals, type GeneratedProtocol } from "@/engine";
import { createProtocol } from "@/services/protocolService";
import { saveRecommendation } from "@/services/userService";
import { useEntitlements, checkEntitlement } from "@/hooks/useEntitlements";
import PremiumGateModal from "@/components/PremiumGateModal";

type Step = "goals" | "details" | "result";

export default function Finder() {
  const [step, setStep] = useState<Step>("goals");
  const [selected, setSelected] = useState<string[]>([]);
  const [weight, setWeight] = useState("");
  const [experience, setExperience] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [result, setResult] = useState<GeneratedProtocol | null>(null);
  const [saving, setSaving] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [gateReason, setGateReason] = useState("");
  const { user } = useAuth();
  const { canCreate } = useEntitlements();
  const { toast } = useToast();

  const goals = getAvailableGoals();

  const toggle = (label: string) => {
    setSelected((prev) =>
      prev.includes(label)
        ? prev.filter((s) => s !== label)
        : prev.length < 4
        ? [...prev, label]
        : prev
    );
  };

  const handleGenerate = () => {
    const protocol = runEngine({
      goals: selected,
      weight: weight ? parseFloat(weight) : undefined,
      experience,
    });
    setResult(protocol);
    setStep("result");
  };

  const handleSave = async () => {
    if (!user || !result) return;

    // Quick client check
    if (!canCreate("protocol")) {
      setGateReason("Limite de 3 protocolos atingido no plano gratuito.");
      setGateOpen(true);
      return;
    }

    setSaving(true);
    try {
      // Backend enforcement
      const check = await checkEntitlement("protocol");
      if (!check.allowed) {
        setGateReason(check.reason || "Limite atingido.");
        setGateOpen(true);
        return;
      }

      await createProtocol({
        user_id: user.id,
        name: result.name,
        description: result.description,
        peptides: result.peptides as any,
        status: "draft",
      });
      await saveRecommendation({
        user_id: user.id,
        goals: selected as any,
        recommended_peptides: result.peptides as any,
        notes: `Score: ${result.totalScore}. Engine v1.`,
      });
      toast({ title: "Protocolo salvo!", description: "Acesse seu Dashboard para ver." });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const stepIndex = step === "goals" ? 0 : step === "details" ? 1 : 2;
  const progressWidth = ((stepIndex + 1) / 3) * 100;

  return (
    <div className="flex items-start justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <Search className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Encontre seu Protocolo
          </h1>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          Responda algumas perguntas e a engine inteligente gera um protocolo personalizado.
        </p>

        {/* Progress */}
        <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressWidth}%` }} />
        </div>

        {/* Step 1: Goals */}
        {step === "goals" && (
          <>
            <h2 className="mb-2 text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Quais são seus objetivos?
            </h2>
            <p className="mb-6 text-xs text-muted-foreground">Selecione de 1 a 4 objetivos.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {goals.map((goal) => {
                const isSelected = selected.includes(goal.goal);
                return (
                  <button
                    key={goal.goal}
                    onClick={() => toggle(goal.goal)}
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
            <Button className="mt-6 w-full gap-2" disabled={selected.length === 0} onClick={() => setStep("details")}>
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Step 2: Details */}
        {step === "details" && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setStep("goals")} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Dados complementares
              </h2>
            </div>
            <p className="mb-6 text-xs text-muted-foreground">Opcional — melhora a precisão da recomendação.</p>

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Peso corporal (kg)</Label>
                <Input type="number" placeholder="Ex: 80" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1" />
              </div>

              <div>
                <Label className="text-xs font-semibold text-muted-foreground">Experiência com peptídeos</Label>
                <div className="mt-2 flex gap-2">
                  {([
                    { key: "beginner" as const, label: "Iniciante" },
                    { key: "intermediate" as const, label: "Intermediário" },
                    { key: "advanced" as const, label: "Avançado" },
                  ]).map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setExperience(opt.key)}
                      className={`rounded-lg px-3 py-2 text-xs font-medium border transition-all ${
                        experience === opt.key
                          ? "bg-primary/15 border-primary/40 text-primary"
                          : "bg-secondary/40 border-border/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button className="mt-6 w-full gap-2" onClick={handleGenerate}>
              <Sparkles className="h-4 w-4" /> Gerar Protocolo
            </Button>
          </>
        )}

        {/* Step 3: Result */}
        {step === "result" && result && (
          <>
            <div className="flex items-center gap-2 mb-4">
              <button onClick={() => setStep("details")} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Seu Protocolo Personalizado
              </h2>
            </div>

            {/* Score */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {result.totalScore}/100
                </p>
                <p className="text-[10px] text-muted-foreground">Score de compatibilidade</p>
              </div>
              <Badge className="ml-auto text-[10px] border-0 bg-primary/10 text-primary">
                <Timer className="h-3 w-3 mr-1" /> {result.duration}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mb-4">{result.description}</p>

            {/* Peptides */}
            <Card className="border-border/40 bg-card/80 mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-[12px] flex items-center gap-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  <Syringe className="h-3.5 w-3.5 text-primary" /> Peptídeos Recomendados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.peptides.map((p, i) => (
                  <div key={p.name} className="rounded-lg bg-secondary/20 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-foreground">{i + 1}. {p.name}</span>
                      <Badge variant="outline" className="text-[9px]">{p.duration}</Badge>
                    </div>
                    <p className="text-[10px] text-primary font-medium">{p.dose}</p>
                    <p className="text-[10px] text-muted-foreground">{p.frequency}</p>
                    {p.notes && <p className="text-[9px] text-muted-foreground/70 mt-1 italic">{p.notes}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Synergies */}
            {result.synergies.length > 0 && (
              <Card className="border-emerald-500/20 bg-emerald-500/5 mb-3">
                <CardContent className="p-3 space-y-1.5">
                  <p className="text-[10px] font-semibold text-emerald-400">✓ Sinergias detectadas</p>
                  {result.synergies.map((s, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground">{s}</p>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <Card className="border-amber-500/20 bg-amber-500/5 mb-4">
                <CardContent className="p-3 space-y-1.5">
                  <p className="text-[10px] font-semibold text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Avisos
                  </p>
                  {result.warnings.map((w, i) => (
                    <p key={i} className="text-[10px] text-muted-foreground">{w}</p>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {user ? (
                <Button className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar Protocolo"}
                </Button>
              ) : (
                <Button className="flex-1 gap-2" onClick={() => window.location.href = "/auth"}>
                  Criar conta para salvar <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              <Button variant="outline" onClick={() => { setStep("goals"); setResult(null); setSelected([]); }}>
                Novo
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
