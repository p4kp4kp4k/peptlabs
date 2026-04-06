import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, ChevronRight, BookOpen, Calculator, Users, Zap, Shield,
  Star, Check, ArrowRight, Beaker, Brain, Dumbbell, Lock,
  ChevronDown, Stethoscope, Activity, Gift, FlaskConical, LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

const featuredPeptides = [
  { name: "Tirzepatide", category: "Emagrecimento", desc: "Perda de peso significativa", free: true, gradient: "from-orange-400 to-amber-600" },
  { name: "BPC-157", category: "Recuperação", desc: "Cicatrização acelerada", free: false, gradient: "from-teal-400 to-cyan-600" },
  { name: "Ipamorelin", category: "GH / Secretagogos", desc: "Aumento de GH", free: false, gradient: "from-cyan-400 to-blue-600" },
  { name: "GHK-Cu", category: "Anti-aging", desc: "Rejuvenescimento da pele", free: false, gradient: "from-purple-400 to-pink-600" },
  { name: "CJC-1295 DAC", category: "GH / Secretagogos", desc: "Liberação pulsátil de GH", free: false, gradient: "from-blue-400 to-indigo-600" },
  { name: "PT-141", category: "Sexual", desc: "Função sexual", free: false, gradient: "from-pink-400 to-rose-600" },
];

const testimonials = [
  { text: "Antes do PeptideosHealth, gastava horas pesquisando artigos no PubMed para validar dosagens. A plataforma centralizou tudo com base científica sólida. Reduzi meu tempo de pesquisa em 80%.", name: "Dr. Ricardo Mendes", role: "Médico Endocrinologista", icon: "👨‍⚕️" },
  { text: "Uso diariamente para consultar doses e protocolos dos meus peptídeos. Agora tenho tudo centralizado, confiável e baseado em evidências. Meu desempenho melhorou e durmo tranquila.", name: "Marina Costa", role: "Atleta de CrossFit", icon: "🏋️‍♀️" },
  { text: "Meu médico prescreveu GHK-Cu e CJC-1295, mas eu não entendia nada. O PeptideosHealth me explicou de forma acessível. Agora sou um paciente mais informado e confiante.", name: "Paulo Henrique", role: "Paciente", icon: "🧑" },
];

const faqs = [
  { q: "O que é a PeptideosHealth?", a: "A PeptideosHealth é a plataforma #1 de peptídeos no Brasil, com biblioteca completa, protocolos clínicos baseados em evidências, calculadora de doses e guias práticos." },
  { q: "Como usar a plataforma no dia a dia?", a: "Crie sua conta gratuita, explore a biblioteca de peptídeos, consulte protocolos e use a calculadora de doses." },
  { q: "Quais funcionalidades estão disponíveis?", a: "Biblioteca com 80+ peptídeos, protocolos clínicos, calculadora de reconstituição e dosagem, stacks sinérgicos, guias práticos e mais." },
  { q: "A plataforma serve para médicos e clínicas?", a: "Sim! Projetada para profissionais de saúde que prescrevem peptídeos e para atletas e pacientes." },
  { q: "Posso calcular dosagens diretamente na plataforma?", a: "Sim, a calculadora de dose avançada permite calcular reconstituição e dosagem com precisão em segundos." },
  { q: "As informações são baseadas em ciência?", a: "Todas as informações são baseadas em estudos indexados no PubMed/NIH." },
];

const Index = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => navigate(user ? "/dashboard" : "/auth");

  return (
    <div className="pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <span className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Peptídeos<span className="text-primary">Health</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/dashboard")}>
                Meu Painel <ArrowRight className="h-3 w-3" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/auth")}>Entrar</Button>
                <Button size="sm" className="gap-1.5 text-xs" onClick={() => navigate("/auth")}>
                  Criar Conta <ArrowRight className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pb-12 pt-12 sm:pb-16 sm:pt-16">
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
        </div>
        <motion.div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6" initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp}>
            <Badge className="mb-5 border-primary/20 bg-primary/10 text-primary">
              <Sparkles className="mr-1.5 h-3 w-3" /> Plataforma #1 de Peptídeos
            </Badge>
          </motion.div>
          <motion.p variants={fadeUp} className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            A Wikipedia dos Peptídeos
          </motion.p>
          <motion.h1 variants={fadeUp} className="mb-5 text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <span className="text-primary">Prescreva</span> peptídeos com total <span className="text-primary">segurança e precisão</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mb-7 max-w-xl text-sm text-muted-foreground">
            A plataforma definitiva com <strong className="text-foreground">protocolos baseados em evidências</strong>, calculadoras exatas e guias práticos para profissionais de saúde e atletas de alto rendimento.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleCTA}>Começar Grátis <ArrowRight className="h-4 w-4" /></Button>
            <Button size="lg" variant="outline" className="gap-2 border-border text-foreground hover:border-primary/50">Ver Planos <ArrowRight className="h-4 w-4" /></Button>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div className="relative mx-auto mt-12 max-w-3xl px-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <div className="rounded-2xl border border-border/40 bg-card/80 p-5 backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-xl font-bold text-foreground sm:text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>+3.000</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Profissionais de saúde e atletas</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground sm:text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>80+</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Peptídeos catalogados</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground sm:text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>50+</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">Protocolos clínicos</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <div className="text-left">
                  <p className="text-[10px] font-semibold text-foreground">Baseado em estudos</p>
                  <p className="text-[9px] text-muted-foreground">indexados no <strong>PubMed/NIH</strong></p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Para quem é */}
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Para quem é a plataforma?</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-border/40 bg-card p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Stethoscope className="h-5 w-5 text-primary" /></div>
              <h3 className="mb-3 text-base font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Para Profissionais de Saúde</h3>
              <ul className="space-y-2">
                {["Prescrição segura com protocolos baseados em evidências", "Calculadora de dose precisa em segundos", "Referências científicas atualizadas do PubMed"].map(i => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{i}</li>
                ))}
              </ul>
              <Button className="mt-4 gap-2 bg-primary text-primary-foreground hover:bg-primary/90" size="sm" onClick={handleCTA}>Começar Grátis <ArrowRight className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="rounded-xl border border-border/40 bg-card p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Activity className="h-5 w-5 text-primary" /></div>
              <h3 className="mb-3 text-base font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Para Atletas e Pacientes</h3>
              <ul className="space-y-2">
                {["Entenda o que seu médico prescreve", "Guias práticos de reconstituição e uso", "Informações confiáveis e atualizadas"].map(i => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{i}</li>
                ))}
              </ul>
              <Button className="mt-4 gap-2 bg-primary text-primary-foreground hover:bg-primary/90" size="sm" onClick={handleCTA}>Começar Grátis <ArrowRight className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-border/40 bg-card/30 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Tudo o que você precisa em um só lugar</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: BookOpen, title: "Biblioteca Completa", desc: "80+ peptídeos catalogados com fichas técnicas detalhadas." },
              { icon: Shield, title: "Protocolos Clínicos", desc: "Protocolos de dosagem baseados em evidências." },
              { icon: Calculator, title: "Calculadora de Dose", desc: "Calcule reconstituição e dosagem com precisão." },
              { icon: Beaker, title: "Stacks Sinérgicos", desc: "Combinações otimizadas de peptídeos." },
              { icon: Brain, title: "Guias Educacionais", desc: "Conteúdo acessível e científico." },
              { icon: Zap, title: "Interações", desc: "Verifique interações entre peptídeos." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-xl border border-border/40 bg-card p-5 transition-all hover:border-primary/30">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                <h3 className="mb-1.5 text-sm font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Como funciona</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { step: "1", title: "Crie sua conta grátis", desc: "Cadastre-se em menos de 30 segundos." },
              { step: "2", title: "Explore peptídeos e protocolos", desc: "Navegue pela biblioteca e use a calculadora." },
              { step: "3", title: "Faça upgrade para acesso completo", desc: "Desbloqueie todos os recursos premium." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary">{step}</div>
                <h3 className="mb-1 text-sm font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Peptides */}
      <section className="border-y border-border/40 bg-card/30 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Peptídeos em Destaque</h2>
            <a href="/library" className="flex items-center gap-1 text-xs text-primary hover:underline">Ver todos <ChevronRight className="h-3 w-3" /></a>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {featuredPeptides.map((p) => (
              <div key={p.name} className="group cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-card transition-all hover:border-primary/30">
                <div className={`relative h-24 bg-gradient-to-br ${p.gradient} opacity-80 group-hover:opacity-100`}>
                  {p.free ? (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-primary/90 px-1.5 py-0.5 text-[8px] font-semibold text-primary-foreground">Acesso Gratuito</span>
                  ) : (
                    <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[8px] font-semibold text-primary backdrop-blur-sm"><Lock className="h-2 w-2" /> Premium</span>
                  )}
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-background/70 px-1 py-0.5 text-[8px] text-foreground backdrop-blur-sm">{p.category}</span>
                </div>
                <div className="p-2.5">
                  <h4 className="text-[11px] font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{p.name}</h4>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>O que dizem nossos usuários</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-border/40 bg-card p-5">
                <div className="mb-3 flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-primary text-primary" />)}</div>
                <p className="mb-4 text-xs leading-relaxed text-muted-foreground">"{t.text}"</p>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm">{t.icon}</div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-y border-border/40 bg-card/30 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-2xl font-bold text-foreground sm:text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Escolha seu plano</h2>
          <p className="mb-8 text-center text-xs text-muted-foreground">Desbloqueie acesso completo à plataforma com o plano ideal para você.</p>
          <div className="grid gap-5 lg:grid-cols-3">
            {/* PRO Mensal */}
            <div className="rounded-xl border border-border/40 bg-card p-5">
              <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>PRO Mensal</h3>
              <div className="mb-1"><span className="text-2xl font-bold text-foreground">R$ 147</span><span className="text-xs text-muted-foreground">/mês</span></div>
              <p className="mb-1 text-[10px] text-muted-foreground">Cobrança mensal · Cancele quando quiser</p>
              <p className="mb-4 text-[10px] text-muted-foreground/60">⚠ Equivale a R$ 1.764 por ano</p>
              <ul className="mb-4 space-y-2">{["Acesso a toda a biblioteca de protocolos", "Calculadora de dose avançada", "Stacks sinérgicos exclusivos", "Guias práticos atualizados", "Suporte por e-mail em até 48h"].map(f => (<li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground"><Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />{f}</li>))}</ul>
              <Button variant="outline" className="w-full text-xs">Começar Agora</Button>
            </div>
            {/* PRO Vitalício */}
            <div className="relative rounded-xl border-2 border-primary bg-card p-5">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2"><Badge className="border-0 bg-primary text-primary-foreground text-[10px]">🔥 Mais Escolhido</Badge></div>
              <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>PRO Vitalício</h3>
              <div className="mb-1 flex items-baseline gap-1.5"><span className="text-2xl font-bold text-foreground">R$ 397</span><span className="text-xs text-muted-foreground">único</span></div>
              <p className="text-[10px] text-muted-foreground"><s>R$ 794</s> <span className="font-semibold text-primary">-50% OFF</span></p>
              <p className="text-[10px] text-muted-foreground">ou 12x de R$ 41,06 no cartão</p>
              <p className="mb-4 text-[10px] text-primary/80">Acesso único. Para sempre.</p>
              <ul className="mb-4 space-y-2">{["Tudo do plano Mensal", "Acesso vitalício", "Acesso antecipado a novos protocolos", "Lives exclusivas com especialistas", "Consultoria em grupo quinzenal", "Certificado de conclusão"].map(f => (<li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground"><Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />{f}</li>))}</ul>
              <Button className="w-full bg-primary text-primary-foreground text-xs hover:bg-primary/90">Garantir Acesso Vitalício</Button>
            </div>
            {/* Premium */}
            <div className="rounded-xl border border-border/40 bg-card p-5">
              <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Vitalício Premium</h3>
              <div className="mb-1 flex items-baseline gap-1.5"><span className="text-2xl font-bold text-foreground">R$ 997</span><span className="text-xs text-muted-foreground">único</span></div>
              <p className="text-[10px] text-muted-foreground"><s>R$ 1.997</s> <span className="font-semibold text-primary">-50% OFF</span></p>
              <p className="mb-4 text-[10px] text-primary/80">Acesso vitalício + comunidade + fornecedores</p>
              <ul className="mb-4 space-y-2">{["Tudo do plano Vitalício incluído", "Contato direto com fornecedores verificados", "Comunidade exclusiva com +700 membros", "Suporte prioritário via WhatsApp em até 4h", "Consultoria clínica exclusiva"].map(f => (<li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground"><Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />{f}</li>))}</ul>
              <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                <p className="flex items-center gap-1 text-[10px] font-semibold text-primary"><Gift className="h-3 w-3" /> BRINDE EXCLUSIVO — E-book Completo</p>
                <p className="mt-0.5 text-[9px] text-muted-foreground">Guia clínico "A Era dos Peptídeos" — 81 páginas com protocolos de elite.</p>
              </div>
              <Button variant="outline" className="w-full border-primary text-primary text-xs hover:bg-primary hover:text-primary-foreground">Pagar Uma Única Vez</Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground sm:text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Perguntas Frequentes</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border/40 bg-card">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between p-4 text-left">
                  <span className="text-xs font-medium text-foreground">{faq.q}</span>
                  <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && <div className="border-t border-border/40 px-4 pb-4 pt-2"><p className="text-xs leading-relaxed text-muted-foreground">{faq.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-primary/20 bg-card p-8 text-center">
          <Zap className="mx-auto mb-3 h-8 w-8 text-primary" />
          <h2 className="mb-2 text-xl font-bold text-foreground sm:text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Comece sua jornada agora</h2>
          <p className="mx-auto mb-5 max-w-md text-xs text-muted-foreground">Junte-se a mais de 3.000 profissionais de saúde e atletas que já usam a PeptideosHealth.</p>
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleCTA}><Sparkles className="h-4 w-4" /> Começar Grátis</Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
