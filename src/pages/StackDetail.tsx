import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Clock, Syringe, AlertTriangle,
  CheckCircle2, Timer, Lock, GitMerge, ChevronRight, Crown, Sparkles, Shield
} from "lucide-react";
import { getCatConfig, getCatIcon } from "@/components/stacks/stackUtils";
import { stackImages } from "@/assets/stacks";
import { useEntitlements } from "@/hooks/useEntitlements";
import { ScrollReveal } from "@/components/ScrollReveal";
import type { Stack } from "@/types";

function StatusBadge({ status }: { status: string }) {
  const u = status.toUpperCase();
  if (u.includes("SINÉR") || u.includes("SINERG")) return <Badge className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold px-1.5">SINÉRGICO</Badge>;
  if (u.includes("COMPATÍV") || u.includes("COMPAT")) return <Badge className="text-[9px] bg-orange-500/15 text-orange-400 border border-orange-500/25 font-bold px-1.5">COMPATÍVEL</Badge>;
  if (u.includes("MONITOR") || u.includes("CAUTELA")) return <Badge className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/25 font-bold px-1.5">MONITORAR</Badge>;
  if (u.includes("EVITAR")) return <Badge className="text-[9px] bg-red-500/15 text-red-400 border border-red-500/25 font-bold px-1.5">EVITAR</Badge>;
  return <Badge variant="outline" className="text-[9px] font-bold px-1.5">{status}</Badge>;
}

export default function StackDetail() {
  const { stackId } = useParams<{ stackId: string }>();
  const navigate = useNavigate();
  const { isAdmin, isPro } = useEntitlements();
  const hasFullAccess = isAdmin || isPro;

  const { data: stack, isLoading } = useQuery({
    queryKey: ["stack-detail", stackId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stacks")
        .select("*")
        .eq("id", stackId!)
        .single();
      if (error) throw error;
      return data as unknown as Stack;
    },
    enabled: !!stackId,
  });

  const peptideNames = useMemo(() => stack?.peptides?.map(p => p.name) ?? [], [stack]);

  const { data: peptideRows } = useQuery({
    queryKey: ["stack-peptides", peptideNames],
    queryFn: async () => {
      if (!peptideNames.length) return [];
      const { data, error } = await supabase
        .from("peptides")
        .select("name, slug, interactions, category, half_life, benefits")
        .in("name", peptideNames);
      if (error) throw error;
      return data ?? [];
    },
    enabled: peptideNames.length > 0,
  });

  const crossInteractions = useMemo(() => {
    if (!peptideRows || peptideRows.length < 2) return [];
    const namesSet = new Set(peptideNames.map(n => n.toLowerCase()));
    const results: Array<{ from: string; to: string; status: string; descricao: string }> = [];
    const seen = new Set<string>();
    for (const pep of peptideRows) {
      if (!pep.interactions) continue;
      const items: Array<{ nome: string; status: string; descricao: string }> = [];
      if (Array.isArray(pep.interactions)) {
        for (const item of pep.interactions as any[]) items.push({ nome: item.peptideo || "", status: item.tipo || "", descricao: item.descricao || "" });
      } else {
        const old = pep.interactions as any;
        if (old.peptideos) items.push(...old.peptideos);
      }
      for (const item of items) {
        if (namesSet.has(item.nome.toLowerCase()) && item.nome.toLowerCase() !== pep.name.toLowerCase()) {
          const key = [pep.name, item.nome].sort().join("|");
          if (!seen.has(key)) { seen.add(key); results.push({ from: pep.name, to: item.nome, status: item.status, descricao: item.descricao }); }
        }
      }
    }
    return results;
  }, [peptideRows, peptideNames]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!stack) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Stack não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/app/stacks")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar para Stacks
        </Button>
      </div>
    );
  }

  const config = getCatConfig(stack.category);
  const IconComp = getCatIcon(stack.category);
  const heroImg = stackImages[stack.category];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ── Hero Banner ── */}
      <div className="relative h-56 sm:h-64 overflow-hidden rounded-b-3xl sm:rounded-3xl sm:mx-4 sm:mt-4">
        {heroImg ? (
          <img src={heroImg} alt={stack.category} className="absolute inset-0 h-full w-full object-cover scale-105" />
        ) : (
          <div className={`absolute inset-0 ${config.bgColor}`} />
        )}
        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate("/app/stacks")}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 text-xs text-foreground/70 hover:text-foreground backdrop-blur-sm bg-background/30 rounded-full px-3 py-1.5 border border-border/20 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </button>

        {/* Category badge */}
        <Badge className={`absolute top-4 right-4 z-10 text-[10px] ${config.bgColor} ${config.color} ${config.borderColor} font-bold px-2.5 py-1 backdrop-blur-sm`}>
          {stack.category}
        </Badge>

        {/* Title block */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          <div className="flex items-end gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${config.bgColor} border ${config.borderColor} backdrop-blur-sm shrink-0`}>
              <IconComp className={`h-5.5 w-5.5 ${config.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {stack.name}
              </h1>
              {stack.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{stack.subtitle}</p>}
            </div>
            {stack.duration && (
              <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground gap-1 shrink-0 backdrop-blur-sm">
                <Clock className="h-3 w-3" /> {stack.duration}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 space-y-5">
        {/* Description */}
        {stack.description && (
          <ScrollReveal>
            <p className="text-sm text-muted-foreground leading-relaxed">{stack.description}</p>
          </ScrollReveal>
        )}

        {/* ── Protocol Card ── */}
        <ScrollReveal delay={100}>
          <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-card/80 backdrop-blur-sm">
            {/* Top accent line */}
            <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

            <div className={`p-5 space-y-3 ${!hasFullAccess ? "blur-[4px] select-none pointer-events-none" : ""}`}>
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                <Syringe className="h-3.5 w-3.5" /> Protocolo
              </p>

              <div className="space-y-0">
                {stack.peptides.map((pep, i) => {
                  const pepData = peptideRows?.find(r => r.name === pep.name);
                  return (
                    <div key={i} className="flex items-center gap-3 py-3 border-b border-border/10 last:border-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary text-[11px] font-bold border border-primary/20">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{pep.name}</span>
                          {pepData && hasFullAccess && (
                            <Link to={`/peptide/${pepData.slug}`} className="text-[10px] text-primary hover:underline flex items-center gap-0.5 opacity-70 hover:opacity-100 transition-opacity">
                              ver detalhes <ChevronRight className="h-2.5 w-2.5" />
                            </Link>
                          )}
                        </div>
                        <span className="text-xs text-primary/70 font-medium">{pep.dose}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {(stack.duration || stack.timing) && (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-border/10">
                  {stack.duration && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-primary/60" /> Duração: {stack.duration}
                    </div>
                  )}
                  {stack.timing && (
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Timer className="h-3.5 w-3.5 text-primary/60 mt-0.5 shrink-0" /> {stack.timing}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Interactions inside protocol card - also blurred */}
            {crossInteractions.length > 0 && (
              <div className={`px-5 pb-5 space-y-2.5 ${!hasFullAccess ? "blur-[4px] select-none pointer-events-none" : ""}`}>
                <div className="h-px bg-border/10" />
                <p className="text-[11px] font-bold text-foreground uppercase tracking-widest flex items-center gap-2 pt-1">
                  <GitMerge className="h-3.5 w-3.5 text-primary" /> Interações
                </p>
                {crossInteractions.map((inter, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs rounded-lg bg-secondary/30 p-3">
                    <GitMerge className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <span className="font-semibold text-foreground">{inter.from}</span>
                        <span className="text-muted-foreground">↔</span>
                        <span className="font-semibold text-foreground">{inter.to}</span>
                        <StatusBadge status={inter.status} />
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{inter.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* ── Premium Gate CTA ── */}
        {!hasFullAccess && (
          <ScrollReveal delay={200}>
            <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 via-card to-primary/5">
              {/* Glow effect */}
              <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative p-8 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    Protocolo completo exclusivo Premium
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Acesse dosagens detalhadas, cronograma otimizado, interações verificadas e orientações de monitoramento.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    onClick={() => navigate("/app/billing")}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl px-8 font-bold shadow-lg shadow-primary/20"
                  >
                    <Crown className="h-4 w-4" />
                    Desbloquear com Premium
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-4 pt-1">
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Shield className="h-3 w-3 text-emerald-400" /> Acesso imediato
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Cancele quando quiser
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* ── Benefits & Warnings Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stack.benefits && stack.benefits.length > 0 && (
            <ScrollReveal delay={300}>
              <div className="rounded-2xl border border-emerald-500/15 bg-card/80 backdrop-blur-sm p-5 space-y-3 h-full">
                <div className="h-[2px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent -mt-5 -mx-5 mb-4 rounded-t-2xl" />
                <p className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-widest">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Benefícios
                </p>
                <div className="space-y-2">
                  {stack.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 mt-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                      </span>
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}

          {stack.warnings && stack.warnings.length > 0 && (
            <ScrollReveal delay={400}>
              <div className="rounded-2xl border border-destructive/15 bg-card/80 backdrop-blur-sm p-5 space-y-3 h-full">
                <div className="h-[2px] bg-gradient-to-r from-transparent via-destructive/50 to-transparent -mt-5 -mx-5 mb-4 rounded-t-2xl" />
                <p className="text-xs font-bold text-foreground flex items-center gap-2 uppercase tracking-widest">
                  <AlertTriangle className="h-4 w-4 text-destructive" /> Avisos
                </p>
                <div className="space-y-2">
                  {stack.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive/10 mt-0.5">
                        <AlertTriangle className="h-2.5 w-2.5 text-destructive" />
                      </span>
                      {w}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}
        </div>

        {/* No adverse interactions badge */}
        {crossInteractions.length === 0 && peptideRows && peptideRows.length >= 2 && (
          <ScrollReveal delay={500}>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Sinergia Verificada</p>
                <p className="text-[11px] text-muted-foreground">Sem interações adversas conhecidas entre os peptídeos deste stack.</p>
              </div>
            </div>
          </ScrollReveal>
        )}
      </div>
    </div>
  );
}
