import { Check, Crown, Zap, Shield, Sparkles, X, Star, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useState } from "react";

/* ─── Feature comparison rows ─── */
const comparisonRows: { label: string; free: string; starter: string; pro: string }[] = [
  { label: "Biblioteca de peptídeos", free: "1 peptídeo", starter: "Essenciais", pro: "Completa (78+)" },
  { label: "Protocolos por mês", free: "—", starter: "3", pro: "Ilimitados" },
  { label: "Comparador", free: "—", starter: "Até 5 / comparação", pro: "Ilimitado" },
  { label: "Calculadora de dosagem", free: "—", starter: "Básica", pro: "Avançada + presets" },
  { label: "Stack Builder", free: "—", starter: "—", pro: "PRO completo" },
  { label: "Histórico", free: "—", starter: "7 dias", pro: "Ilimitado" },
  { label: "Templates", free: "—", starter: "Essenciais", pro: "Premium + IA" },
  { label: "Exportação (PDF)", free: "—", starter: "Básica", pro: "Premium c/ timeline" },
  { label: "Verificação de interações", free: "—", starter: "Básica", pro: "Completa" },
  { label: "Body Map interativo", free: "—", starter: "—", pro: "✓" },
  { label: "Suporte", free: "—", starter: "E-mail (48h)", pro: "Prioritário" },
];

const plans = [
  {
    id: "free" as const,
    name: "Gratuito",
    price: "R$ 0",
    period: "/sempre",
    icon: Shield,
    tagline: "Explore a plataforma",
    highlight: false,
    cta: "Plano Atual",
  },
  {
    id: "starter" as const,
    name: "Starter",
    price: "R$ 39",
    priceCents: ",90",
    period: "/mês",
    icon: Zap,
    tagline: "Para quem está começando",
    highlight: false,
    cta: "Começar Agora",
  },
  {
    id: "pro" as const,
    name: "PRO",
    price: "R$ 59",
    priceCents: ",90",
    period: "/mês",
    icon: Crown,
    tagline: "Acesso completo e ilimitado",
    highlight: true,
    cta: "Fazer Upgrade PRO",
  },
];

function CellValue({ value, isPro }: { value: string; isPro?: boolean }) {
  if (value === "—") return <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />;
  if (value === "✓") return <Check className="h-4 w-4 text-primary mx-auto" />;
  return (
    <span className={`text-xs ${isPro ? "font-semibold text-primary" : "text-muted-foreground"}`}>
      {value}
    </span>
  );
}

export default function Billing() {
  const { plan, isActive, isAdmin, currentPeriodEnd } = useEntitlements();
  const [billingCycle] = useState<"monthly">("monthly");

  const currentPlan = isAdmin ? "pro" : (isActive ? plan : "free");

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-10 text-center">
        <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 text-[10px] font-bold gap-1">
          <Sparkles className="h-3 w-3" /> Planos PeptiLab
        </Badge>
        <h1
          className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-2"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Escolha o plano ideal para você
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          De pesquisadores iniciantes a profissionais médicos. Desbloqueie o acesso completo.
        </p>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" /> 2.847+ membros
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> 4.9 de avaliação
          </span>
        </div>
      </div>

      {/* ── Plan Cards ── */}
      <div className="grid gap-5 md:grid-cols-3 mb-12">
        {plans.map((p) => {
          const isCurrent = currentPlan === p.id;
          return (
            <div
              key={p.id}
              className={`relative rounded-2xl border overflow-hidden transition-all flex flex-col ${
                p.highlight
                  ? "border-primary/40 bg-gradient-to-b from-primary/[0.04] to-card shadow-xl shadow-primary/10 ring-1 ring-primary/20"
                  : "border-border/50 bg-card"
              }`}
            >
              {p.highlight && (
                <div className="bg-primary text-primary-foreground text-center py-1.5 text-[10px] font-bold uppercase tracking-wider">
                  ⭐ Mais Escolhido
                </div>
              )}

              <div className="p-5 sm:p-6 flex flex-col flex-1">
                {/* Icon + Name */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    p.highlight ? "bg-primary/15" : "bg-muted/50"
                  }`}>
                    <p.icon className={`h-4.5 w-4.5 ${p.highlight ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{p.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{p.tagline}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-5">
                  <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">{p.price}</span>
                  {"priceCents" in p && (
                    <span className="text-lg font-bold text-foreground">{p.priceCents}</span>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">{p.period}</span>
                </div>

                {/* Key features (top 4-5 for each plan) */}
                <ul className="space-y-2 mb-5 flex-1">
                  {(p.id === "free" ? [
                    "Acesso a 1 peptídeo completo",
                    "Visualizar biblioteca (bloqueada)",
                    "Criar conta gratuita",
                  ] : p.id === "starter" ? [
                    "Biblioteca essencial de peptídeos",
                    "Até 3 protocolos por mês",
                    "Comparador (até 5 peptídeos)",
                    "Calculadora básica",
                    "Histórico de 7 dias",
                    "Templates essenciais",
                  ] : [
                    "Tudo do Starter, mais:",
                    "Biblioteca completa (78+ peptídeos)",
                    "Protocolos e comparações ilimitados",
                    "Stack Builder PRO completo",
                    "Calculadora avançada + presets",
                    "Histórico e export ilimitados",
                    "Templates premium + IA",
                    "Suporte prioritário",
                  ]).map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                      <Check className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${p.highlight ? "text-primary" : "text-primary/60"}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  className={`w-full text-xs font-bold gap-2 h-10 ${
                    p.highlight ? "shadow-lg shadow-primary/20" : ""
                  }`}
                  variant={p.highlight ? "default" : "outline"}
                  disabled={isCurrent}
                >
                  {isCurrent ? (
                    "Plano Atual"
                  ) : (
                    <>
                      {p.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>

                {isCurrent && currentPeriodEnd && currentPlan !== "free" && (
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    Ativo até {new Date(currentPeriodEnd).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Feature Comparison Table ── */}
      <div className="mb-10">
        <h2
          className="text-lg font-bold text-foreground text-center mb-6"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Comparação detalhada
        </h2>

        <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
          {/* Table header */}
          <div className="grid grid-cols-4 bg-muted/30 border-b border-border/50">
            <div className="p-3 sm:p-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Recurso
            </div>
            {plans.map((p) => (
              <div
                key={p.id}
                className={`p-3 sm:p-4 text-center ${
                  p.highlight ? "bg-primary/[0.06]" : ""
                }`}
              >
                <p className={`text-[11px] font-bold ${p.highlight ? "text-primary" : "text-foreground"}`}>
                  {p.name}
                </p>
              </div>
            ))}
          </div>

          {/* Table rows */}
          {comparisonRows.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-4 ${
                i < comparisonRows.length - 1 ? "border-b border-border/30" : ""
              } ${i % 2 === 0 ? "" : "bg-muted/10"}`}
            >
              <div className="p-3 sm:p-4 text-xs text-foreground font-medium flex items-center">
                {row.label}
              </div>
              <div className="p-3 sm:p-4 flex items-center justify-center">
                <CellValue value={row.free} />
              </div>
              <div className="p-3 sm:p-4 flex items-center justify-center">
                <CellValue value={row.starter} />
              </div>
              <div className={`p-3 sm:p-4 flex items-center justify-center ${plans[2].highlight ? "bg-primary/[0.03]" : ""}`}>
                <CellValue value={row.pro} isPro />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ / Trust ── */}
      <div className="max-w-lg mx-auto text-center space-y-4 mb-6">
        <div className="flex items-center justify-center gap-6 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-primary" /> Pagamento seguro
          </span>
          <span>Cancele quando quiser</span>
          <span>Sem fidelidade</span>
        </div>

        <div className="rounded-xl border border-border/40 bg-secondary/10 p-4">
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            "Uso diariamente no consultório. A plataforma mais completa para protocolos de peptídeos."
          </p>
          <p className="text-xs font-semibold text-foreground mt-2">— Dr. Rafael M., Endocrinologista</p>
        </div>
      </div>
    </div>
  );
}
