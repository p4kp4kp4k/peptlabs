import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Sparkles, ChevronRight, FlaskConical, BookOpen, Calculator,
  Users, Zap, Shield, Star, Check, Clock, Award, ArrowRight,
  Beaker, Heart, Brain, Dumbbell, Lock, Menu, X, ChevronDown,
  Stethoscope, Activity, MessageCircle, Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const featuredPeptides = [
  { name: "Tirzepatide", category: "Emagrecimento", desc: "Perda de peso significativa", free: true, gradient: "from-orange-400 to-amber-600" },
  { name: "BPC-157", category: "Recuperação", desc: "Cicatrização acelerada", free: false, gradient: "from-teal-400 to-cyan-600" },
  { name: "Ipamorelin", category: "GH / Secretagogos", desc: "Aumento de GH", free: false, gradient: "from-cyan-400 to-blue-600" },
  { name: "GHK-Cu", category: "Anti-aging", desc: "Rejuvenescimento da pele", free: false, gradient: "from-purple-400 to-pink-600" },
  { name: "CJC-1295 DAC", category: "GH / Secretagogos", desc: "Liberação pulsátil de GH", free: false, gradient: "from-blue-400 to-indigo-600" },
  { name: "PT-141", category: "Sexual", desc: "Função sexual", free: false, gradient: "from-pink-400 to-rose-600" },
];

const testimonials = [
  {
    text: "Antes do PeptideosHealth, gastava horas pesquisando artigos no PubMed para validar dosagens. A plataforma centralizou tudo com base científica sólida. A calculadora de reconstituição me deu segurança para prescrever com precisão. Reduzi meu tempo de pesquisa em 80%.",
    name: "Dr. Ricardo Mendes",
    role: "Médico Endocrinologista",
    icon: "👨‍⚕️",
  },
  {
    text: "Uso diariamente para consultar doses e protocolos dos meus peptídeos. Antes, dependia de informações fragmentadas de amigos. Agora tenho tudo centralizado, confiável e baseado em evidências. Meu desempenho melhorou e durmo tranquila.",
    name: "Marina Costa",
    role: "Atleta de CrossFit",
    icon: "🏋️‍♀️",
  },
  {
    text: "Meu médico prescreveu GHK-Cu e CJC-1295, mas eu não entendia nada. O PeptideosHealth me explicou de forma acessível o que cada um faz, como usar e por que funciona. Agora sou um paciente mais informado e confiante.",
    name: "Paulo Henrique",
    role: "Paciente",
    icon: "🧑",
  },
];

const faqs = [
  { q: "O que é a PeptideosHealth?", a: "A PeptideosHealth é a plataforma #1 de peptídeos no Brasil, com biblioteca completa, protocolos clínicos baseados em evidências, calculadora de doses e guias práticos para profissionais de saúde e atletas." },
  { q: "Como usar a plataforma no dia a dia?", a: "Basta criar sua conta gratuita, explorar a biblioteca de peptídeos, consultar protocolos e usar a calculadora de doses. O acesso PRO desbloqueia todos os recursos avançados." },
  { q: "Quais funcionalidades estão disponíveis?", a: "Biblioteca com 80+ peptídeos, protocolos clínicos, calculadora de reconstituição e dosagem, stacks sinérgicos, guias práticos e muito mais." },
  { q: "A plataforma serve para médicos e clínicas?", a: "Sim! A PeptideosHealth foi projetada tanto para profissionais de saúde que prescrevem peptídeos quanto para atletas e pacientes que desejam entender seus tratamentos." },
  { q: "Posso calcular dosagens diretamente na plataforma?", a: "Sim, a calculadora de dose avançada permite calcular reconstituição e dosagem com precisão em segundos." },
  { q: "As informações são baseadas em ciência?", a: "Todas as informações são baseadas em estudos indexados no PubMed/NIH, garantindo confiabilidade e atualização constante." },
];

const Index = () => {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Peptídeos<span className="text-primary">Health</span>
            </span>
          </div>

          <div className="hidden max-w-sm flex-1 px-8 md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar peptídeos, protocolos..."
                className="h-9 border-border/50 bg-secondary pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-primary"
              />
            </div>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {["Painel", "Biblioteca", "Protocolos", "Calculadora"].map((item) => (
              <a key={item} href="#" className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                {item}
              </a>
            ))}
            <Button size="sm" className="ml-2 bg-primary text-primary-foreground hover:bg-primary/90">
              Entrar / Criar Conta
            </Button>
          </nav>

          <button className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenu && (
          <div className="border-t border-border/40 bg-background px-4 py-4 md:hidden">
            {["Painel", "Biblioteca", "Protocolos", "Calculadora"].map((item) => (
              <a key={item} href="#" className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary">
                {item}
              </a>
            ))}
            <Button className="mt-3 w-full bg-primary text-primary-foreground">Entrar / Criar Conta</Button>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pb-16 pt-16 sm:pb-24 sm:pt-24">
          <div className="absolute inset-0">
            <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
          </div>

          <motion.div
            className="relative mx-auto max-w-4xl px-4 text-center sm:px-6"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <Badge className="mb-6 border-primary/20 bg-primary/10 text-primary">
                <Sparkles className="mr-1.5 h-3 w-3" /> Plataforma #1 de Peptídeos
              </Badge>
            </motion.div>

            <motion.p variants={fadeUp} className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              A Wikipedia dos Peptídeos
            </motion.p>

            <motion.h1
              variants={fadeUp}
              className="mb-6 text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <span className="text-primary">Prescreva</span> peptídeos com total{" "}
              <span className="text-primary">segurança e precisão</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground sm:text-lg">
              A plataforma definitiva com <strong className="text-foreground">protocolos baseados em evidências</strong>,
              calculadoras exatas e guias práticos para profissionais de saúde e atletas de alto rendimento.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                Começar Grátis <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 border-border text-foreground hover:border-primary/50">
                Ver Planos <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            className="relative mx-auto mt-16 max-w-4xl px-4 sm:px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="rounded-2xl border border-border/40 bg-card/80 p-6 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground sm:text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>+3.000</p>
                  <p className="mt-1 text-xs text-muted-foreground">Profissionais de saúde e atletas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground sm:text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>80+</p>
                  <p className="mt-1 text-xs text-muted-foreground">Peptídeos catalogados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground sm:text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>50+</p>
                  <p className="mt-1 text-xs text-muted-foreground">Protocolos clínicos</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-center">
                  <Shield className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-foreground">Baseado em estudos</p>
                    <p className="text-[10px] text-muted-foreground">indexados no <strong>PubMed/NIH</strong></p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Para quem é */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.h2
              className="mb-12 text-center text-3xl font-bold text-foreground sm:text-4xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            >
              Para quem é a plataforma?
            </motion.h2>

            <motion.div
              className="grid gap-6 md:grid-cols-2"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            >
              {/* Profissionais */}
              <motion.div variants={fadeUp} className="rounded-2xl border border-border/40 bg-card p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Stethoscope className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Para Profissionais de Saúde
                </h3>
                <ul className="space-y-3">
                  {[
                    "Prescrição segura com protocolos baseados em evidências",
                    "Calculadora de dose precisa em segundos",
                    "Referências científicas atualizadas do PubMed",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  Começar Grátis <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>

              {/* Atletas */}
              <motion.div variants={fadeUp} className="rounded-2xl border border-border/40 bg-card p-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-4 text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Para Atletas e Pacientes
                </h3>
                <ul className="space-y-3">
                  {[
                    "Entenda o que seu médico prescreve",
                    "Guias práticos de reconstituição e uso",
                    "Informações confiáveis e atualizadas",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  Começar Grátis <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-border/40 bg-card/30 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.h2
              className="mb-4 text-center text-3xl font-bold text-foreground sm:text-4xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            >
              Tudo o que você precisa em um só lugar
            </motion.h2>

            <motion.div
              className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            >
              {[
                { icon: BookOpen, title: "Biblioteca Completa", desc: "80+ peptídeos catalogados com fichas técnicas detalhadas e atualizadas." },
                { icon: Shield, title: "Protocolos Clínicos", desc: "Protocolos de dosagem baseados em evidências para cada indicação." },
                { icon: Calculator, title: "Calculadora de Dose", desc: "Calcule reconstituição e dosagem com precisão em segundos." },
                { icon: Beaker, title: "Stacks Sinérgicos", desc: "Combinações otimizadas de peptídeos para resultados potencializados." },
                { icon: Brain, title: "Guias Educacionais", desc: "Aprenda sobre peptídeos com conteúdo acessível e científico." },
                { icon: Zap, title: "Interações", desc: "Verifique interações entre peptídeos para segurança máxima." },
              ].map(({ icon: Icon, title, desc }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  className="group rounded-xl border border-border/40 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Guide */}
            <motion.div
              className="mt-10 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            >
              <p className="text-sm text-muted-foreground">
                📖 <strong className="text-foreground">O que são Peptídeos?</strong>{" "}
                <Badge className="ml-1 border-0 bg-primary/20 text-primary text-[10px]">GRÁTIS</Badge>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Comece por aqui — entenda o que são peptídeos, como funcionam e por que estão revolucionando a saúde.
              </p>
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <motion.h2
              className="mb-12 text-center text-3xl font-bold text-foreground sm:text-4xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            >
              Como funciona
            </motion.h2>

            <motion.div
              className="grid gap-8 sm:grid-cols-3"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            >
              {[
                { step: "1", title: "Crie sua conta grátis", desc: "Cadastre-se em menos de 30 segundos e comece a explorar." },
                { step: "2", title: "Explore peptídeos e protocolos", desc: "Navegue pela biblioteca, leia guias e use a calculadora." },
                { step: "3", title: "Faça upgrade para acesso completo", desc: "Desbloqueie todos os recursos premium quando quiser." },
              ].map(({ step, title, desc }) => (
                <motion.div key={step} variants={fadeUp} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary text-lg font-bold text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {step}
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Featured Peptides */}
        <section className="border-y border-border/40 bg-card/30 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 flex items-center justify-between">
              <motion.h2
                className="text-3xl font-bold text-foreground sm:text-4xl"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
              >
                Peptídeos em Destaque
              </motion.h2>
              <a href="#" className="flex items-center gap-1 text-sm text-primary hover:underline">
                Ver todos <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>

            <motion.div
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            >
              {featuredPeptides.map((p) => (
                <motion.div
                  key={p.name}
                  variants={fadeUp}
                  className="group cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className={`relative h-28 bg-gradient-to-br ${p.gradient} opacity-80 transition-opacity group-hover:opacity-100`}>
                    {p.free ? (
                      <span className="absolute left-2 top-2 rounded-full bg-primary/90 px-2 py-0.5 text-[9px] font-semibold text-primary-foreground">
                        Acesso Gratuito
                      </span>
                    ) : (
                      <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[9px] font-semibold text-primary backdrop-blur-sm">
                        <Lock className="h-2.5 w-2.5" /> Premium
                      </span>
                    )}
                    <span className="absolute bottom-2 left-2 rounded-md bg-background/70 px-1.5 py-0.5 text-[9px] font-medium text-foreground backdrop-blur-sm">
                      {p.category}
                    </span>
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{p.name}</h4>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{p.desc}</p>
                    <p className="mt-2 text-[11px] font-medium text-primary">
                      {p.free ? "Ver ficha →" : "Desbloqueie agora →"}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.h2
              className="mb-12 text-center text-3xl font-bold text-foreground sm:text-4xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            >
              O que dizem nossos usuários
            </motion.h2>

            <motion.div
              className="grid gap-6 md:grid-cols-3"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            >
              {testimonials.map((t) => (
                <motion.div
                  key={t.name}
                  variants={fadeUp}
                  className="rounded-xl border border-border/40 bg-card p-6"
                >
                  <div className="mb-4 flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="mb-5 text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg">
                      {t.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Pricing */}
        <section className="border-y border-border/40 bg-card/30 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div
              className="mb-12 text-center"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            >
              <h2 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Escolha seu plano
              </h2>
              <p className="text-sm text-muted-foreground">
                Desbloqueie acesso completo à plataforma com o plano ideal para você.
              </p>
            </motion.div>

            <motion.div
              className="grid gap-6 lg:grid-cols-3"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            >
              {/* PRO Mensal */}
              <motion.div variants={fadeUp} className="rounded-2xl border border-border/40 bg-card p-6">
                <h3 className="mb-1 text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>PRO Mensal</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>R$ 147</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <p className="mb-1 text-xs text-muted-foreground">Cobrança mensal · Cancele quando quiser</p>
                <p className="mb-5 text-xs text-muted-foreground/60">⚠ Equivale a R$ 1.764 por ano</p>
                <ul className="mb-6 space-y-2.5">
                  {[
                    "Acesso a toda a biblioteca de protocolos",
                    "Calculadora de dose avançada",
                    "Stacks sinérgicos exclusivos",
                    "Guias práticos atualizados",
                    "Suporte por e-mail em até 48h",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full border-border text-foreground hover:border-primary/50">
                  Começar Agora
                </Button>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">Cobrança mensal. Cancele quando quiser.</p>
              </motion.div>

              {/* PRO Vitalício */}
              <motion.div variants={fadeUp} className="relative rounded-2xl border-2 border-primary bg-card p-6">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="border-0 bg-primary text-primary-foreground text-xs">🔥 Mais Escolhido</Badge>
                </div>
                <h3 className="mb-1 text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>PRO Vitalício</h3>
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>R$ 397</span>
                  <span className="text-sm text-muted-foreground">único</span>
                </div>
                <p className="mb-1 text-xs text-muted-foreground"><s>R$ 794</s> <span className="font-semibold text-primary">-50% OFF</span></p>
                <p className="mb-1 text-xs text-muted-foreground">ou 12x de R$ 41,06 no cartão</p>
                <p className="mb-2 text-xs text-primary/80">Acesso único. Para sempre. Sem mensalidade.</p>
                <p className="mb-5 text-[11px] text-muted-foreground">= Você economiza R$ 1.367 comparado ao plano mensal no 1º ano.</p>
                <ul className="mb-6 space-y-2.5">
                  {[
                    "Tudo do plano Mensal",
                    "Acesso vitalício — paga uma vez, usa para sempre",
                    "Acesso antecipado a novos protocolos",
                    "Lives exclusivas com especialistas",
                    "Consultoria em grupo quinzenal",
                    "Certificado de conclusão dos módulos",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Garantir Acesso Vitalício
                </Button>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">Garantia de 30 dias. Sem burocracia.</p>
              </motion.div>

              {/* Vitalício Premium */}
              <motion.div variants={fadeUp} className="rounded-2xl border border-border/40 bg-card p-6">
                <h3 className="mb-1 text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Vitalício Premium</h3>
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>R$ 997</span>
                  <span className="text-sm text-muted-foreground">único</span>
                </div>
                <p className="mb-1 text-xs text-muted-foreground"><s>R$ 1.997</s> <span className="font-semibold text-primary">-50% OFF</span></p>
                <p className="mb-1 text-xs text-muted-foreground">ou 12x de R$ 103,39 no cartão</p>
                <p className="mb-5 text-xs text-primary/80">Acesso vitalício + comunidade + fornecedores</p>
                <ul className="mb-6 space-y-2.5">
                  {[
                    "Tudo do plano Vitalício incluído",
                    "Contato direto com fornecedores confiáveis verificados",
                    "Comunidade exclusiva com +700 membros ativos",
                    "Relatos reais e novidades em primeira mão",
                    "Suporte prioritário via WhatsApp em até 4h",
                    "Consultoria clínica exclusiva para médicos",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <Gift className="h-3.5 w-3.5" /> BRINDE EXCLUSIVO — E-book Completo
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                    Guia clínico "A Era dos Peptídeos" — 81 páginas com a matemática exata da reconstituição, 5 protocolos de elite e mapa completo de 25+ peptídeos com evidências do PubMed.
                  </p>
                </div>
                <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  Pagar Uma Única Vez
                </Button>
                <p className="mt-2 text-center text-[10px] text-muted-foreground">Garantia 30 dias · Pagamento seguro · Cancele quando quiser</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <motion.h2
              className="mb-12 text-center text-3xl font-bold text-foreground sm:text-4xl"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            >
              Perguntas Frequentes
            </motion.h2>

            <motion.div
              className="space-y-3"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            >
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="rounded-xl border border-border/40 bg-card"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between p-5 text-left"
                  >
                    <span className="text-sm font-medium text-foreground">{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                  </button>
                  {openFaq === i && (
                    <div className="border-t border-border/40 px-5 pb-5 pt-3">
                      <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border/40 bg-card/30 py-16 sm:py-24">
          <motion.div
            className="mx-auto max-w-3xl px-4 text-center sm:px-6"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          >
            <Zap className="mx-auto mb-4 h-10 w-10 text-primary" />
            <h2 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Comece sua jornada agora
            </h2>
            <p className="mx-auto mb-6 max-w-lg text-sm text-muted-foreground">
              Junte-se a mais de 3.000 profissionais de saúde e atletas que já usam a PeptideosHealth para prescrever e entender peptídeos com segurança.
            </p>
            <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
              <Sparkles className="h-4 w-4" /> Começar Grátis
            </Button>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Peptídeos<span className="text-primary">Health</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2026 PeptídeosHealth. Todos os direitos reservados. Conteúdo educacional — consulte um profissional de saúde.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
