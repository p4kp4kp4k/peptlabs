import { useState } from "react";
import { BookOpen, FlaskConical, Shield, Lock, Clock, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { guides, categoryGradients } from "@/data/peptides";

const tabs = [
  { key: "guias", label: "Guias", icon: BookOpen },
  { key: "estudos", label: "Estudos", icon: FlaskConical },
  { key: "seguranca", label: "Segurança", icon: Shield },
] as const;

export default function Learn() {
  const [activeTab, setActiveTab] = useState<"guias" | "estudos" | "seguranca">("guias");

  const filtered = guides.filter((g) => g.tab === activeTab);

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Aprender
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Guias, estudos científicos e segurança em um só lugar.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8 grid grid-cols-3 gap-1 rounded-xl border border-border/40 bg-card p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-medium transition-all ${
              activeTab === tab.key
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Guides grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((guide) => (
          <div
            key={guide.title}
            className="group cursor-pointer rounded-xl border border-border/40 bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="mb-3 flex items-center justify-between">
              <Badge className={`border-0 bg-gradient-to-r ${categoryGradients[guide.category] || "from-gray-500 to-gray-600"} text-[9px] text-white`}>
                {guide.category}
              </Badge>
              {guide.isPro ? (
                <Badge className="border-0 bg-primary/15 text-primary text-[9px]">
                  <Lock className="mr-1 h-2.5 w-2.5" /> PRO
                </Badge>
              ) : (
                <Badge className="border-0 bg-primary/15 text-primary text-[9px]">GRÁTIS</Badge>
              )}
            </div>
            <h3 className="mb-2 text-sm font-semibold leading-snug text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {guide.title}
            </h3>
            <p className="mb-3 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
              {guide.description}
            </p>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{guide.date}</span>
            </div>
            <p className="mt-3 text-[11px] font-medium text-primary">
              {guide.isPro ? "Desbloqueie com PRO →" : "Ler guia →"}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-10 rounded-xl border border-primary/20 bg-card p-8 text-center">
        <h2 className="mb-2 text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Desbloqueie todos os guias e estudos
        </h2>
        <p className="mb-6 text-xs text-muted-foreground">
          Acesse conteúdo exclusivo com base científica para elevar seus resultados.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* PRO Mensal */}
          <div className="rounded-xl border border-border/40 bg-background p-4 text-left">
            <h3 className="text-sm font-bold text-foreground">PRO Mensal</h3>
            <p className="mt-1 text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>R$ 147<span className="text-xs font-normal text-muted-foreground">/mês</span></p>
            <p className="mb-3 text-[10px] text-muted-foreground">Cobrança mensal · Cancele quando quiser</p>
            <ul className="mb-3 space-y-1.5">
              {["Biblioteca completa de protocolos", "Calculadora de dose avançada", "Guias práticos atualizados", "Suporte por e-mail"].map(f => (
                <li key={f} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="w-full text-xs">Começar Agora</Button>
          </div>

          {/* PRO Vitalício */}
          <div className="relative rounded-xl border-2 border-primary bg-background p-4 text-left">
            <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 border-0 bg-primary text-primary-foreground text-[9px]">🔥 Mais Escolhido</Badge>
            <h3 className="text-sm font-bold text-foreground">PRO Vitalício</h3>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>R$ 397</span>
              <span className="text-[10px] text-muted-foreground">único</span>
            </div>
            <p className="text-[10px] text-muted-foreground"><s>R$ 794</s> <span className="text-primary">-50%</span></p>
            <p className="mb-3 text-[10px] text-muted-foreground">Pagamento único · Acesso vitalício</p>
            <ul className="mb-3 space-y-1.5">
              {["Tudo do plano Mensal", "Acesso antecipado a novos protocolos", "Lives exclusivas com especialistas", "Consultoria em grupo quinzenal"].map(f => (
                <li key={f} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button size="sm" className="w-full bg-primary text-primary-foreground text-xs hover:bg-primary/90">Garantir Acesso Vitalício</Button>
          </div>

          {/* Vitalício Premium */}
          <div className="rounded-xl border border-border/40 bg-background p-4 text-left">
            <h3 className="text-sm font-bold text-foreground">Vitalício Premium</h3>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>R$ 997</span>
              <span className="text-[10px] text-muted-foreground">único</span>
            </div>
            <p className="text-[10px] text-muted-foreground"><s>R$ 1.997</s> <span className="text-primary">-50%</span></p>
            <p className="mb-3 text-[10px] text-muted-foreground">Acesso vitalício + comunidade + fornecedores</p>
            <ul className="mb-3 space-y-1.5">
              {["Tudo do plano Vitalício incluído", "Contato com fornecedores confiáveis", "Comunidade com +700 membros", "Suporte prioritário via WhatsApp"].map(f => (
                <li key={f} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="w-full border-primary text-primary text-xs hover:bg-primary hover:text-primary-foreground">Pagar Uma Única Vez</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
