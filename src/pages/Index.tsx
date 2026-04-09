import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, ChevronRight, BookOpen, Calculator, Users, Zap, Shield,
  Star, Check, ArrowRight, Beaker, Brain, Dumbbell, Lock,
  ChevronDown, Stethoscope, Activity, Gift, FlaskConical, LogIn,
  TrendingUp, Award, Clock, Target, Layers, Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

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

  const handleCTA = () => navigate(user ? "/app/dashboard" : "/auth");

  return (
    <div className="pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4.5 w-4.5 text-primary" />
            <span className="text-sm font-semibold tracking-tight">
              Pepti<span className="text-primary">Lab</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => navigate("/app/dashboard")}>
                Meu Painel <ArrowRight className="h-3 w-3" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => navigate("/auth")}>Entrar</Button>
                <Button size="sm" className="gap-1.5 text-xs h-8" onClick={() => navigate("/auth")}>
                  Criar Conta <ArrowRight className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pb-10 pt-14 sm:pb-14 sm:pt-20">
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/6 blur-[140px]" />
          <div className="absolute right-0 top-1/3 h-[300px] w-[300px] rounded-full bg-primary/3 blur-[100px]" />
        </div>
        <motion.div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6" initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp}>
             <Badge className="mb-4 border-primary/20 bg-primary/10 text-primary text-[10px]">
              <Sparkles className="mr-1 h-3 w-3" /> PeptiLab — Plataforma de Peptídeos
            </Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} className="mb-4 text-3xl font-bold leading-[1.15] text-foreground sm:text-4xl lg:text-5xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Domine peptídeos com{" "}
            <span className="text-primary">precisão científica</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mb-6 max-w-xl text-sm text-muted-foreground leading-relaxed">
            Protocolos baseados em evidências, calculadora de doses profissional e guias práticos para{" "}
            <strong className="text-foreground">profissionais de saúde</strong> e <strong className="text-foreground">atletas de alto rendimento</strong>.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col items-center justify-center gap-2.5 sm:flex-row">
            <Button size="lg" className="gap-2 text-sm h-11" onClick={handleCTA}>
              Começar Grátis <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2 text-sm h-11 border-border hover:border-primary/50">
              Ver Planos
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats row */}
        <motion.div className="relative mx-auto mt-10 max-w-4xl px-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { value: "+3.000", label: "Profissionais ativos", icon: Users },
              { value: "80+", label: "Peptídeos catalogados", icon: FlaskConical },
              { value: "50+", label: "Protocolos clínicos", icon: BookOpen },
              { value: "100%", label: "Baseado em PubMed", icon: Shield },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border/30 bg-card/60 p-3.5 text-center backdrop-blur-sm">
                <stat.icon className="h-4 w-4 text-primary mx-auto mb-1.5" />
                <p className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value}</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Para quem é */}
      <section className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-center text-xl font-bold text-foreground sm:text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Para quem é a plataforma?</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                icon: Stethoscope,
                title: "Para Profissionais de Saúde",
                items: ["Prescrição segura com protocolos baseados em evidências", "Calculadora de dose precisa em segundos", "Referências científicas atualizadas do PubMed", "Stacks sinérgicos validados"],
                cta: "Acesse como Profissional"
              },
              {
                icon: Activity,
                title: "Para Atletas e Pacientes",
                items: ["Entenda o que seu médico prescreve", "Guias práticos de reconstituição e uso", "Informações confiáveis e atualizadas", "Calculadora de dose simplificada"],
                cta: "Acesse como Atleta"
              },
            ].map((card) => (
              <div key={card.title} className="rounded-xl border border-border/40 bg-card/80 p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <card.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <h3 className="mb-3 text-sm font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{card.title}</h3>
                <ul className="space-y-1.5 mb-4">
                  {card.items.map(i => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />{i}
                    </li>
                  ))}
                </ul>
                <Button size="sm" className="gap-1.5 text-[11px] h-8" onClick={handleCTA}>
                  {card.cta} <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="border-y border-border/40 bg-card/20 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-center text-xl font-bold text-foreground sm:text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Tudo o que você precisa em um só lugar
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: BookOpen, title: "Biblioteca Completa", desc: "80+ peptídeos catalogados com fichas técnicas detalhadas e referências científicas." },
              { icon: Shield, title: "Protocolos Clínicos", desc: "Protocolos de dosagem baseados em evidências com fases e ciclos detalhados." },
              { icon: Calculator, title: "Calculadora de Dose", desc: "Calcule reconstituição e dosagem com precisão. Tabelas de conversão e guia de diluentes." },
              { icon: Layers, title: "Stacks Sinérgicos", desc: "Combinações otimizadas de peptídeos com objetivos e dosagens pré-definidas." },
              { icon: Brain, title: "Guias Educacionais", desc: "Conteúdo acessível com base científica para profissionais e pacientes." },
              { icon: Zap, title: "Interações", desc: "Verifique interações e sinergias entre peptídeos antes de combinar." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-xl border border-border/30 bg-card/60 p-4 transition-all hover:border-primary/30 hover:bg-card/80">
                <div className="mb-2.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="mb-1 text-[12px] font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-center text-xl font-bold text-foreground sm:text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Como funciona</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { step: "1", icon: LogIn, title: "Crie sua conta grátis", desc: "Cadastre-se em menos de 30 segundos." },
              { step: "2", icon: Target, title: "Explore e pesquise", desc: "Navegue pela biblioteca, protocolos e calculadora." },
              { step: "3", icon: Award, title: "Faça upgrade PRO", desc: "Desbloqueie acesso completo a todos os recursos." },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center rounded-xl border border-border/20 bg-card/40 p-5">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="text-[10px] font-bold text-primary mb-1">PASSO {step}</div>
                <h3 className="mb-1 text-[12px] font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
                <p className="text-[11px] text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Peptides */}
      <section className="border-y border-border/40 bg-card/20 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Peptídeos em Destaque</h2>
            <a href="/app/peptides" className="flex items-center gap-1 text-[11px] text-primary hover:underline">Ver todos <ChevronRight className="h-3 w-3" /></a>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {featuredPeptides.map((p) => (
              <div key={p.name} className="group cursor-pointer overflow-hidden rounded-xl border border-border/30 bg-card/60 transition-all hover:border-primary/30">
                <div className={`relative h-20 bg-gradient-to-br ${p.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}>
                  {p.free ? (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-primary/90 px-1.5 py-0.5 text-[7px] font-semibold text-primary-foreground">Grátis</span>
                  ) : (
                    <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-background/80 px-1.5 py-0.5 text-[7px] font-semibold text-primary backdrop-blur-sm">
                      <Lock className="h-2 w-2" /> PRO
                    </span>
                  )}
                  <span className="absolute bottom-1 left-1.5 rounded bg-background/70 px-1 py-0.5 text-[7px] text-foreground backdrop-blur-sm">{p.category}</span>
                </div>
                <div className="p-2">
                  <h4 className="text-[10px] font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{p.name}</h4>
                  <p className="mt-0.5 text-[8px] text-muted-foreground">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 text-center text-xl font-bold text-foreground sm:text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>O que dizem nossos usuários</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-border/30 bg-card/60 p-4">
                <div className="mb-2 flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 fill-primary text-primary" />)}</div>
                <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">"{t.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs">{t.icon}</div>
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">{t.name}</p>
                    <p className="text-[9px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
       <section className="border-y border-border/40 bg-card/20 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-1.5 text-center text-xl font-bold text-foreground sm:text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Escolha seu plano</h2>
          <p className="mb-6 text-center text-[11px] text-muted-foreground">Desbloqueie acesso completo à plataforma com o plano ideal para você.</p>
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Free */}
            <div className="rounded-xl border border-border/30 bg-card/60 p-5">
              <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Gratuito</h3>
              <div className="mb-1"><span className="text-2xl font-bold text-foreground">R$ 0</span><span className="text-xs text-muted-foreground">/sempre</span></div>
              <p className="mb-3 text-[10px] text-muted-foreground">Para explorar a plataforma</p>
              <ul className="mb-4 space-y-1.5">
                {["Visualizar biblioteca (essenciais)", "Consultar informações básicas", "Acesso limitado ao app"].map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-[11px] text-muted-foreground"><Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />{f}</li>
                ))}
              </ul>
              <Button variant="outline" className="w-full text-[11px] h-9" onClick={() => navigate("/auth")}>Começar Grátis</Button>
            </div>
            {/* Starter */}
            <div className="rounded-xl border border-border/30 bg-card/60 p-5">
              <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Starter</h3>
              <div className="mb-1"><span className="text-2xl font-bold text-foreground">R$ 39,90</span><span className="text-xs text-muted-foreground">/mês</span></div>
              <p className="mb-3 text-[10px] text-muted-foreground">Para quem está começando</p>
              <ul className="mb-4 space-y-1.5">
                {["Biblioteca essencial de peptídeos", "Até 3 protocolos por mês", "Comparador (até 5 por comparação)", "Calculadora básica + salvar cálculo", "Histórico de 7 dias", "Templates essenciais", "Export básico (PDF simples)"].map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-[11px] text-muted-foreground"><Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />{f}</li>
                ))}
              </ul>
              <Button variant="outline" className="w-full text-[11px] h-9" onClick={() => navigate("/auth")}>Começar Agora</Button>
            </div>
            {/* PRO */}
            <div className="relative rounded-xl border-2 border-primary bg-card/80 p-5">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <Badge className="border-0 bg-primary text-primary-foreground text-[9px]">🔥 Mais Escolhido</Badge>
              </div>
              <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>PRO</h3>
              <div className="mb-1"><span className="text-2xl font-bold text-foreground">R$ 59,90</span><span className="text-xs text-muted-foreground">/mês</span></div>
              <p className="mb-3 text-[9px] text-primary/80">Acesso completo à plataforma</p>
              <ul className="mb-4 space-y-1.5">
                {["Tudo do Starter", "Biblioteca completa (avançados inclusos)", "Protocolos ilimitados", "Comparador ilimitado", "Stack Builder PRO completo", "Calculadora avançada + presets", "Histórico ilimitado", "Templates premium + recomendações IA", "Export PRO (PDF premium c/ timeline)", "Suporte prioritário"].map(f => (
                  <li key={f} className="flex items-start gap-1.5 text-[11px] text-muted-foreground"><Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />{f}</li>
                ))}
              </ul>
              <Button className="w-full text-[11px] h-9" onClick={() => navigate("/auth")}>Fazer Upgrade</Button>
            </div>
          </div>
        </div>
       </section>

      {/* FAQ */}
      <section className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-center text-xl font-bold text-foreground sm:text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Perguntas Frequentes</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border/30 bg-card/60">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between p-3.5 text-left">
                  <span className="text-[11px] font-medium text-foreground">{faq.q}</span>
                  <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="border-t border-border/30 px-3.5 pb-3.5 pt-2">
                    <p className="text-[11px] leading-relaxed text-muted-foreground">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-2xl rounded-xl border border-primary/20 bg-card/60 p-6 text-center">
          <Zap className="mx-auto mb-2 h-7 w-7 text-primary" />
          <h2 className="mb-2 text-lg font-bold text-foreground sm:text-xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Comece sua jornada agora</h2>
          <p className="mx-auto mb-4 max-w-md text-[11px] text-muted-foreground">Junte-se a mais de 3.000 profissionais de saúde e atletas que já usam a PeptideosHealth.</p>
          <Button className="gap-2 h-10" onClick={handleCTA}><Sparkles className="h-4 w-4" /> Começar Grátis</Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
