import { useState } from "react";
import PremiumGateModal from "@/components/PremiumGateModal";
import { History as HistoryIcon, Loader2, Trash2, FlaskConical, Layers, Calculator, ArrowLeftRight, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEntitlements } from "@/hooks/useEntitlements";

const kindIcons: Record<string, any> = {
  protocol: FlaskConical,
  stack: Layers,
  calculation: Calculator,
  compare: ArrowLeftRight,
  ai: Sparkles,
};

const kindLabels: Record<string, string> = {
  protocol: "Protocolo",
  stack: "Stack",
  calculation: "Cálculo",
  compare: "Comparação",
  ai: "IA",
};

export default function HistoryPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [gateOpen, setGateOpen] = useState(false);
  const { isAdmin, isPro } = useEntitlements();
  const hasAccess = isAdmin || isPro;

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("history").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["history"] }),
  });

  const filtered = filter === "all" ? items : items.filter((i) => i.kind === filter);

  return (
    <>
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <HistoryIcon className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Histórico</h1>
        </div>
        <p className="text-sm text-muted-foreground">Todas as suas atividades na plataforma.</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {["all", "protocol", "stack", "calculation", "compare", "ai"].map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
              filter === k ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {k === "all" ? "Todos" : kindLabels[k]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <HistoryIcon className="h-10 w-10 text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const Icon = kindIcons[item.kind] || HistoryIcon;
            const meta = item.metadata as any;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/60 p-3 transition-colors hover:bg-card/80"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {meta?.title || meta?.name || kindLabels[item.kind]}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <Badge variant="outline" className="text-[9px] shrink-0">{kindLabels[item.kind]}</Badge>
                <button
                  onClick={() => deleteMutation.mutate(item.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <PremiumGateModal open={gateOpen} onClose={() => setGateOpen(false)} reason="O histórico completo é exclusivo para assinantes." />
    </div>
    </>
  );
}
