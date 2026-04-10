import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, Clock, Syringe, AlertTriangle,
  CheckCircle2, Timer, Lock, GitMerge, ChevronRight, Crown
} from "lucide-react";
import { getCatConfig, getCatIcon } from "@/components/stacks/stackUtils";
import { stackImages } from "@/assets/stacks";
import { useEntitlements, checkFeature, incrementUsage } from "@/hooks/useEntitlements";
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
  const { isAdmin, isPro, isStarter } = useEntitlements();
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

  // Cross-interactions
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
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
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

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => navigate("/app/stacks")}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Stacks
      </button>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bgColor} shrink-0`}>
          <IconComp className={`h-6 w-6 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {stack.name}
            </h1>
            <Badge className={`text-[10px] ${config.bgColor} ${config.color} ${config.borderColor} font-bold px-2`}>
              {stack.category}
            </Badge>
          </div>
          {stack.subtitle && <p className="text-xs text-muted-foreground">{stack.subtitle}</p>}
        </div>
      </div>

      {/* Description */}
      {stack.description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{stack.description}</p>
      )}

      {/* Protocol - blurred for free users */}
      <div className="relative">
        <div className={`rounded-xl bg-primary/5 border border-primary/15 p-5 space-y-3 ${!hasFullAccess ? "blur-[3px] select-none pointer-events-none" : ""}`}>
          <p className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Syringe className="h-3.5 w-3.5" /> Protocolo
          </p>
          {stack.peptides.map((pep, i) => {
            const pepData = peptideRows?.find(r => r.name === pep.name);
            return (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-primary/10 last:border-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-[10px] font-bold">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{pep.name}</span>
                    {pepData && hasFullAccess && (
                      <Link to={`/peptide/${pepData.slug}`} className="text-[10px] text-primary hover:underline flex items-center">
                        ver <ChevronRight className="h-2.5 w-2.5" />
                      </Link>
                    )}
                  </div>
                  <span className="text-xs text-primary/80 font-medium">{pep.dose}</span>
                </div>
              </div>
            );
          })}
          {stack.duration && (
            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Duração: {stack.duration}
            </div>
          )}
          {stack.timing && (
            <div className="flex items-start gap-2 pt-1">
              <Timer className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{stack.timing}</p>
            </div>
          )}
        </div>

        {/* Interactions - also blurred for free */}
        {crossInteractions.length > 0 && (
          <div className={`mt-4 rounded-xl border border-border/30 p-5 space-y-3 ${!hasFullAccess ? "blur-[3px] select-none pointer-events-none" : ""}`}>
            <p className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <GitMerge className="h-3.5 w-3.5 text-primary" /> Interações
            </p>
            {crossInteractions.map((inter, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <GitMerge className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-1 mb-0.5">
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

      {/* Premium Gate CTA */}
      {!hasFullAccess && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center space-y-3">
          <Lock className="h-8 w-8 text-primary mx-auto" />
          <p className="text-sm font-bold text-foreground">Protocolo completo exclusivo Premium</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Desbloqueie acesso ao protocolo detalhado com dosagens, frequências, timing e interações completas.
          </p>
          <Button
            onClick={() => navigate("/app/billing")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Crown className="h-4 w-4" />
            Desbloquear com Premium
          </Button>
        </div>
      )}

      {/* Benefits - always visible */}
      {stack.benefits && stack.benefits.length > 0 && (
        <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-5 space-y-2.5">
          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Benefícios Esperados
          </p>
          <div className="space-y-1.5">
            {stack.benefits.map((b, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-emerald-400 mt-0.5">•</span> {b}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings - always visible */}
      {stack.warnings && stack.warnings.length > 0 && (
        <div className="rounded-xl border border-destructive/15 bg-destructive/5 p-5 space-y-2.5">
          <p className="text-xs font-bold text-destructive flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Avisos e Monitoramento
          </p>
          <div className="space-y-1.5">
            {stack.warnings.map((w, i) => (
              <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" /> {w}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
