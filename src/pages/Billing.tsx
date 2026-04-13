import { Check, Crown, Zap, Shield, Sparkles, X, Star, Users, ArrowRight, Infinity, Clock, Gift, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useBilling } from "@/hooks/useBilling";
import { motion } from "framer-motion";
import { ScrollReveal } from "@/components/ScrollReveal";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* ─── Feature comparison rows ─── */
const comparisonRows: { label: string; free: string; proMonthly: string; proLifetime: string }[] = [
  { label: "Biblioteca de peptídeos", free: "1 peptídeo", proMonthly: "Completa (78+)", proLifetime: "Completa (78+)" },
  { label: "Protocolos", free: "1 / mês", proMonthly: "Ilimitados", proLifetime: "Ilimitados" },
  { label: "Comparador", free: "1 / mês", proMonthly: "Ilimitado", proLifetime: "Ilimitado" },
  { label: "Calculadora de dosagem", free: "1 / mês", proMonthly: "Avançada + presets", proLifetime: "Avançada + presets" },
  { label: "Stack Builder", free: "1 / mês", proMonthly: "PRO (até 10/mês)", proLifetime: "Ilimitado" },
  { label: "Histórico", free: "—", proMonthly: "Ilimitado", proLifetime: "Ilimitado" },
  { label: "Templates", free: "1 / mês", proMonthly: "Premium + IA", proLifetime: "Premium + IA" },
  { label: "Exportação (PDF)", free: "1 / mês", proMonthly: "Premium", proLifetime: "Premium c/ timeline" },
  { label: "Verificação de interações", free: "1 / mês", proMonthly: "Completa", proLifetime: "Completa" },
  { label: "Body Map interativo", free: "—", proMonthly: "✓", proLifetime: "✓" },
  { label: "Contato com fornecedores", free: "—", proMonthly: "—", proLifetime: "✓" },
  { label: "Guias práticos atualizados", free: "—", proMonthly: "—", proLifetime: "✓" },
  { label: "Atualizações e novos peptídeos", free: "—", proMonthly: "—", proLifetime: "✓" },
  { label: "Prioridade em novas funcionalidades", free: "—", proMonthly: "—", proLifetime: "✓" },
  { label: "Suporte", free: "—", proMonthly: "Prioritário", proLifetime: "VIP dedicado" },
];

const plans = [
  {
    id: "free" as const,
    name: "Explorer",
    price: "R$ 0",
    period: "/sempre",
    icon: Shield,
    tagline: "Explore o poder dos peptídeos",
    highlight: false,
    cta: "Plano Atual",
    features: [
      "Acesso a 1 peptídeo completo",
      "1 protocolo por mês",
      "1 comparação por mês",
      "1 cálculo de dosagem por mês",
      "1 stack por mês",
      "1 template por mês",
      "1 exportação PDF por mês",
      "1 verificação de interação por mês",
    ],
  },
  {
    id: "pro" as const,
    name: "PRO Mensal",
    price: "R$ 59",
    priceCents: ",90",
    period: "/mês",
    icon: Zap,
    tagline: "Acesso total. Cancele quando quiser.",
    highlight: false,
    cta: "Ativar PRO Mensal",
    annualEquiv: "Equivale a R$ 718,80 por ano",
    features: [
      "Acesso a toda a biblioteca (78+ peptídeos)",
      "Protocolos e comparações ilimitados",
      "Calculadora avançada + presets",
      "Stack Builder PRO (até 10/mês)",
      "Stacks sinérgicos exclusivos",
      "Histórico e export ilimitados",
      "Templates premium + IA",
      "Body Map interativo",
      "Suporte prioritário",
    ],
  },
  {
    id: "lifetime" as const,
    name: "PRO Vitalício",
    price: "R$ 397",
    period: "único",
    originalPrice: "R$ 794",
    discount: "-50% OFF",
    icon: Crown,
    tagline: "Pague uma vez. Use para sempre.",
    highlight: true,
    cta: "Garantir Acesso Vitalício",
    installments: "ou 12x de R$ 41,06 no cartão",
    savings: "Você economiza R$ 321,80 comparado ao plano mensal no 1º ano.",
    features: [
      "Tudo do PRO Mensal, mais:",
      "Acesso vitalício — pague uma vez, use para sempre",
      "Contato direto com fornecedores parceiros",
      "Atualizações e novos peptídeos inclusos",
      "Prioridade em novas funcionalidades",
      "Guias práticos atualizados mensalmente",
      "Export PRO com timeline visual",
      "Stacks ilimitados (sem cap de 10/mês)",
      "Suporte VIP dedicado",
    ],
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
  const { plan, billingType, isActive, isAdmin, isLifetime, currentPeriodEnd } = useEntitlements();
  const { checkout, isCheckingOut, cancel, isCanceling, canUpgradeTo } = useBilling();
  const [searchParams] = useSearchParams();

  // Fetch admin-configured plan links
  const { data: planLinks = [] } = useQuery({
    queryKey: ["plan-links"],
    queryFn: async () => {
      const { data } = await supabase.from("plan_links").select("*");
      return (data ?? []) as { plan_id: string; checkout_url: string; is_active: boolean }[];
    },
  });

  const getPlanLink = (planId: string) => {
    const link = planLinks.find((l) => l.plan_id === planId && l.is_active && l.checkout_url);
    return link?.checkout_url ?? null;
  };

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Pagamento confirmado! Bem-vindo ao PRO 🎉");
    }
    if (searchParams.get("canceled") === "true") {
      toast.info("Checkout cancelado.");
    }
  }, [searchParams]);

  const currentPlan = isAdmin ? "lifetime" : (isLifetime ? "lifetime" : (isActive && plan === "pro" ? "pro" : (isActive ? plan : "free")));

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <div className="mb-10 text-center">
        <Badge className="mb-3 bg-primary/10 text-primary border-primary/20 text-[10px] font-bold gap-1">
          <Sparkles className="h-3 w-3" /> Acesso VIP
        </Badge>
        <h1
          className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-2 font-display"
        >
          Desbloqueie acesso VIP aos melhores protocolos
          <br className="hidden sm:block" />
          e comunidade exclusiva.
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          De pesquisadores iniciantes a médicos de elite. Escolha o acesso que transforma sua prática.
        </p>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-primary" /> 2.847+ membros ativos
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> 4.9 de avaliação
          </span>
        </div>
      </div>

      {/* ── Plan Cards ── */}
      <div className="grid gap-5 md:grid-cols-3 mb-12">
        {plans.map((p, idx) => {
          const isCurrent = (p.id === "lifetime" && currentPlan === "lifetime") || (p.id === "pro" && currentPlan === "pro") || (p.id === "free" && currentPlan === "free");
          return (
            <ScrollReveal key={p.id} delay={idx * 0.1}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`relative rounded-2xl border overflow-hidden transition-all flex flex-col h-full ${
                  p.highlight
                    ? "border-primary/40 bg-gradient-to-b from-primary/[0.06] to-card shadow-xl shadow-primary/10 ring-1 ring-primary/20"
                    : "border-border/50 bg-card"
                }`}
              >
                {p.highlight && (
                  <div className="bg-primary text-primary-foreground text-center py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <Crown className="h-3 w-3" /> Mais Escolhido
                  </div>
                )}

                <div className="p-5 sm:p-6 flex flex-col flex-1">
                  {/* Icon + Name */}
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      p.highlight ? "bg-primary/15" : "bg-muted/50"
                    }`}>
                      <p.icon className={`h-4.5 w-4.5 ${p.highlight ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground font-display">{p.name}</h3>
                      <p className="text-[10px] text-muted-foreground">{p.tagline}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-1">
                    {"originalPrice" in p && p.originalPrice && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-muted-foreground line-through">{p.originalPrice}</span>
                        {"discount" in p && p.discount && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                            {p.discount}
                          </Badge>
                        )}
                      </div>
                    )}
                    <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight font-display">{p.price}</span>
                    {"priceCents" in p && p.priceCents && (
                      <span className="text-lg font-bold text-foreground">{p.priceCents}</span>
                    )}
                    <span className="text-xs text-muted-foreground ml-1">/{p.period}</span>
                  </div>

                  {"annualEquiv" in p && p.annualEquiv && (
                    <p className="text-[10px] text-amber-400/80 mb-3 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {p.annualEquiv}
                    </p>
                  )}

                  {"installments" in p && p.installments && (
                    <p className="text-[10px] text-muted-foreground mb-1">{p.installments}</p>
                  )}

                  {"savings" in p && p.savings && (
                    <p className="text-[10px] text-emerald-400 mb-3 font-medium flex items-center gap-1">
                      <Gift className="h-3 w-3 shrink-0" /> {p.savings}
                    </p>
                  )}

                  {!("annualEquiv" in p) && !("installments" in p) && <div className="mb-3" />}

                  {/* Features */}
                  <ul className="space-y-2 mb-5 flex-1">
                    {p.features.map((f) => (
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
                    disabled={(isCurrent && p.id === "free") || isCheckingOut}
                    onClick={() => {
                      if (p.id === "free") return;
                      if (isCurrent) return;
                      const planId = p.id === "lifetime" ? "pro_lifetime" : "pro_monthly";
                      const externalLink = getPlanLink(planId);
                      if (externalLink) {
                        window.open(externalLink, "_blank");
                        return;
                      }
                      checkout({ planId: planId as any });
                    }}
                  >
                    {isCheckingOut ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isCurrent && p.id === "free" ? (
                      "Plano Atual"
                    ) : isCurrent ? (
                      "Plano Atual"
                    ) : (
                      <>
                        {p.cta} <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>

                  {p.id !== "free" && p.id !== "lifetime" && (
                    <p className="text-[10px] text-muted-foreground text-center mt-2">
                      Cobrança mensal · Cancele quando quiser
                    </p>
                  )}

                  {p.id === "lifetime" && (
                    <p className="text-[10px] text-muted-foreground text-center mt-2">
                      Acesso único. Para sempre. Sem mensalidade.
                    </p>
                  )}

                  {isCurrent && currentPeriodEnd && currentPlan !== "free" && (
                    <p className="text-[10px] text-muted-foreground text-center mt-2">
                      Ativo até {new Date(currentPeriodEnd).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              </motion.div>
            </ScrollReveal>
          );
        })}
      </div>

      {/* ── Feature Comparison Table ── */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-foreground text-center mb-6 font-display">
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
                <CellValue value={row.proMonthly} />
              </div>
              <div className={`p-3 sm:p-4 flex items-center justify-center ${plans[2].highlight ? "bg-primary/[0.03]" : ""}`}>
                <CellValue value={row.proLifetime} isPro />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust Section ── */}
      <div className="max-w-lg mx-auto text-center space-y-4 mb-6">
        <div className="flex items-center justify-center gap-6 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-primary" /> Pagamento seguro
          </span>
          <span className="flex items-center gap-1.5">
            <Infinity className="h-3.5 w-3.5 text-primary" /> Garantia de 7 dias
          </span>
          <span>Sem fidelidade</span>
        </div>

        <div className="rounded-xl border border-border/40 bg-secondary/10 p-4">
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            "Uso diariamente no consultório. A plataforma mais completa para protocolos de peptídeos que já encontrei."
          </p>
          <p className="text-xs font-semibold text-foreground mt-2">— Dr. Rafael M., Endocrinologista</p>
        </div>
      </div>
    </div>
  );
}
