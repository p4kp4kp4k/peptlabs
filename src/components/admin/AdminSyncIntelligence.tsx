import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Activity, AlertTriangle, ArrowRightLeft, Bell, BookOpen,
  CheckCircle2, Clock, Database, Eye, Filter, Globe,
  Loader2, Play, RefreshCw, Search, Settings, Shield,
  Sparkles, TrendingUp, XCircle, Zap, FileText, FlaskConical,
  Check, X, RotateCcw, Trash2, Upload, Edit3, History, Wrench
} from "lucide-react";
import CorrectionModal from "./corrections/CorrectionModal";

// ── Types ──

interface IntegrationSource {
  id: string;
  name: string;
  slug: string;
  api_base_url: string | null;
  api_type: string;
  is_active: boolean;
  priority: number;
  last_sync_at: string | null;
  last_sync_status: string | null;
  records_count: number;
}

interface SyncRun {
  id: string;
  source_id: string;
  status: string;
  mode: string;
  started_at: string;
  completed_at: string | null;
  records_processed: number;
  records_added: number;
  records_updated: number;
  conflicts_found: number;
  errors_count: number;
  error_message: string | null;
  integration_sources?: { name: string; slug: string };
}

interface DetectedChange {
  id: string;
  source_id: string;
  peptide_id: string | null;
  change_type: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  severity: string;
  status: string;
  created_at: string;
  integration_sources?: { name: string };
  peptides?: { name: string } | null;
}

interface AuditRun {
  id: string;
  status: string;
  scope: string;
  started_at: string;
  completed_at: string | null;
  total_findings: number;
  critical_count: number;
  medium_count: number;
  low_count: number;
  resolved_count: number;
}

interface AuditFinding {
  id: string;
  audit_run_id: string;
  category: string;
  severity: string;
  title: string;
  description: string | null;
  source_a: string | null;
  source_b: string | null;
  value_a: string | null;
  value_b: string | null;
  recommendation: string | null;
  status: string;
  resolution_note: string | null;
  peptide_id: string | null;
  peptides?: { name: string } | null;
}

interface ImportQueueItem {
  id: string;
  name: string;
  slug: string;
  confidence_score: number;
  is_ready: boolean;
  status: string;
  created_at: string;
  integration_sources?: { name: string };
}

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  severity: string;
  is_read: boolean;
  created_at: string;
}

// ── Helpers ──

const severityColor = (s: string) => {
  switch (s) {
    case "critical": return "text-red-400 bg-red-400/10 border-red-400/30";
    case "high": return "text-orange-400 bg-orange-400/10 border-orange-400/30";
    case "medium": return "text-amber-400 bg-amber-400/10 border-amber-400/30";
    case "low": return "text-blue-400 bg-blue-400/10 border-blue-400/30";
    case "info": return "text-muted-foreground bg-secondary border-border";
    default: return "text-muted-foreground bg-secondary border-border";
  }
};

const statusIcon = (status: string) => {
  switch (status) {
    case "success":
    case "completed": return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    case "error":
    case "failed": return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    case "running": return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
    case "never": return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    default: return <Clock className="h-3.5 w-3.5 text-amber-400" />;
  }
};

const sourceIcon = (slug: string) => {
  switch (slug) {
    case "pubmed": return <BookOpen className="h-4 w-4" />;
    case "uniprot": return <FlaskConical className="h-4 w-4" />;
    case "pdb": return <Database className="h-4 w-4" />;
    case "openfda": return <Shield className="h-4 w-4" />;
    default: return <Globe className="h-4 w-4" />;
  }
};

const sourceColor = (slug: string) => {
  switch (slug) {
    case "pubmed": return "text-blue-400";
    case "uniprot": return "text-emerald-400";
    case "pdb": return "text-purple-400";
    case "openfda": return "text-amber-400";
    case "peptipedia": return "text-pink-400";
    case "dramp": return "text-orange-400";
    case "apd": return "text-cyan-400";
    default: return "text-muted-foreground";
  }
};

const timeAgo = (date: string | null) => {
  if (!date) return "Nunca";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h atrás`;
  const days = Math.floor(hrs / 24);
  return `${days}d atrás`;
};

// ── Main Component ──

export default function AdminSyncIntelligence() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <Zap className="h-5 w-5 text-primary" />
            Central de Integrações
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Monitoramento, auditoria e sincronização de fontes científicas
          </p>
        </div>
        <NotificationBell />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-9 bg-secondary/60 p-0.5 flex-wrap">
          <TabsTrigger value="overview" className="text-[11px] gap-1.5 data-[state=active]:bg-card px-3 h-8">
            <Activity className="h-3.5 w-3.5" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="changes" className="text-[11px] gap-1.5 data-[state=active]:bg-card px-3 h-8">
            <ArrowRightLeft className="h-3.5 w-3.5" /> Atualizações
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-[11px] gap-1.5 data-[state=active]:bg-card px-3 h-8">
            <Eye className="h-3.5 w-3.5" /> Auditoria
          </TabsTrigger>
          <TabsTrigger value="import" className="text-[11px] gap-1.5 data-[state=active]:bg-card px-3 h-8">
            <Sparkles className="h-3.5 w-3.5" /> Publicação
          </TabsTrigger>
          <TabsTrigger value="history" className="text-[11px] gap-1.5 data-[state=active]:bg-card px-3 h-8">
            <FileText className="h-3.5 w-3.5" /> Histórico
          </TabsTrigger>
          <TabsTrigger value="config" className="text-[11px] gap-1.5 data-[state=active]:bg-card px-3 h-8">
            <Settings className="h-3.5 w-3.5" /> Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab /></TabsContent>
        <TabsContent value="changes"><ChangesTab /></TabsContent>
        <TabsContent value="audit"><AuditTab /></TabsContent>
        <TabsContent value="import"><ImportQueueTab /></TabsContent>
        <TabsContent value="history"><HistoryTab /></TabsContent>
        <TabsContent value="config"><ConfigTab /></TabsContent>
      </Tabs>
    </div>
  );
}

// ── Notification Bell ──

function NotificationBell() {
  const { data: notifications = [] } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("*")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as AdminNotification[];
    },
  });

  const unread = notifications.length;

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="h-8 w-8 relative">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
            {unread}
          </span>
        )}
      </Button>
    </div>
  );
}

// ── 1. Overview Tab ──

function OverviewTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["integration-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_sources")
        .select("*")
        .order("priority", { ascending: false });
      if (error) throw error;
      return data as IntegrationSource[];
    },
  });

  const { data: pendingChanges = 0 } = useQuery({
    queryKey: ["pending-changes-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("detected_changes")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: openFindings = 0 } = useQuery({
    queryKey: ["open-findings-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("audit_findings")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: importPending = 0 } = useQuery({
    queryKey: ["import-pending-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("peptide_import_queue")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
  });

  const syncAllMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-orchestrator", {
        body: { source: "all", mode: "manual" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Sync completo", description: `Todas as fontes foram processadas.` });
      queryClient.invalidateQueries({ queryKey: ["integration-sources"] });
      queryClient.invalidateQueries({ queryKey: ["sync-runs"] });
      queryClient.invalidateQueries({ queryKey: ["detected-changes"] });
      queryClient.invalidateQueries({ queryKey: ["pending-changes-count"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro no sync", description: err.message, variant: "destructive" });
    },
  });

  const auditMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("audit-engine", {
        body: { scope: "full" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Auditoria concluída",
        description: `${data.total_findings} findings: ${data.critical_count} críticos, ${data.medium_count} médios, ${data.low_count} baixos`,
      });
      queryClient.invalidateQueries({ queryKey: ["audit-runs"] });
      queryClient.invalidateQueries({ queryKey: ["audit-findings"] });
      queryClient.invalidateQueries({ queryKey: ["open-findings-count"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro na auditoria", description: err.message, variant: "destructive" });
    },
  });
  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[11px] border-primary/30 hover:bg-primary/10"
          disabled={syncAllMutation.isPending}
          onClick={() => syncAllMutation.mutate()}
        >
          {syncAllMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
          Sincronizar Todas as Fontes
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[11px] border-primary/30 hover:bg-primary/10"
          disabled={auditMutation.isPending}
          onClick={() => auditMutation.mutate()}
        >
          {auditMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Eye className="h-3 w-3 mr-1.5" />}
          Executar Auditoria Completa
        </Button>
        <AutoUpdateButton />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Fontes Ativas", value: sources.filter(s => s.is_active).length, icon: Globe, color: "text-primary" },
          { label: "Atualizações Pendentes", value: pendingChanges, icon: ArrowRightLeft, color: "text-amber-400" },
          { label: "Findings Abertos", value: openFindings, icon: AlertTriangle, color: "text-orange-400" },
          { label: "Fila de Publicação", value: importPending, icon: Sparkles, color: "text-emerald-400" },
        ].map((s) => (
          <Card key={s.label} className="border-border/40 bg-card/80">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Source Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sources.map((src) => (
          <SourceCard key={src.id} source={src} />
        ))}
      </div>
    </div>
  );
}

// ── Auto-Update Button ──

function AutoUpdateButton() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastResult, setLastResult] = useState<any>(null);

  const dryRunMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("auto-update", {
        body: { mode: "dry_run" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setLastResult(data);
      toast({
        title: "Preview de auto-update",
        description: `${data.stats.total} mudanças avaliadas. ${data.results.filter((r: any) => r.confidence >= 75).length} elegíveis para aplicação automática.`,
      });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const autoApplyMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("auto-update", {
        body: { mode: "auto", min_confidence: 75 },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setLastResult(data);
      toast({
        title: "Auto-update concluído",
        description: `${data.stats.applied} atualização(ões) aplicada(s), ${data.stats.skipped} ignorada(s).`,
      });
      queryClient.invalidateQueries({ queryKey: ["pending-changes-count"] });
      queryClient.invalidateQueries({ queryKey: ["detected-changes"] });
      queryClient.invalidateQueries({ queryKey: ["open-findings-count"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const isPending = dryRunMutation.isPending || autoApplyMutation.isPending;

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-[11px] border-emerald-400/30 hover:bg-emerald-400/10 text-emerald-400"
        disabled={isPending}
        onClick={() => dryRunMutation.mutate()}
      >
        {dryRunMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <TrendingUp className="h-3 w-3 mr-1.5" />}
        Preview Auto-Update
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-[11px] border-emerald-400/30 hover:bg-emerald-400/10 text-emerald-400"
        disabled={isPending}
        onClick={() => autoApplyMutation.mutate()}
      >
        {autoApplyMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Zap className="h-3 w-3 mr-1.5" />}
        Aplicar Auto-Update
      </Button>
      {lastResult && (
        <Badge variant="outline" className="text-[9px] h-5 border-border/30">
          {lastResult.stats.applied ?? 0} aplicadas / {lastResult.stats.total ?? 0} total
        </Badge>
      )}
    </div>
  );
}

function SourceCard({ source }: { source: IntegrationSource }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-orchestrator", {
        body: { source: source.slug, mode: "manual" },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Sincronização iniciada", description: `${source.name} está sendo processado.` });
      queryClient.invalidateQueries({ queryKey: ["integration-sources"] });
      queryClient.invalidateQueries({ queryKey: ["sync-runs"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Card className="border-border/40 bg-card/80 hover:border-primary/20 transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={sourceColor(source.slug)}>
              {sourceIcon(source.slug)}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{source.name}</p>
              <p className="text-[10px] text-muted-foreground">{source.api_type === "rest" ? "API REST" : "Dataset"}</p>
            </div>
          </div>
          <Badge variant={source.is_active ? "default" : "secondary"} className="text-[9px]">
            {source.is_active ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div>
            <span className="text-muted-foreground">Última sync:</span>
            <p className="text-foreground font-medium">{timeAgo(source.last_sync_at)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Status:</span>
            <div className="flex items-center gap-1 mt-0.5">
              {statusIcon(source.last_sync_status || "never")}
              <span className="text-foreground capitalize">{source.last_sync_status || "Nunca"}</span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Registros:</span>
            <p className="text-foreground font-medium">{source.records_count}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Prioridade:</span>
            <p className="text-foreground font-medium">{source.priority}</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full h-7 text-[10px] border-border/30 hover:border-primary/40"
          disabled={syncMutation.isPending || !source.is_active}
          onClick={() => syncMutation.mutate()}
        >
          {syncMutation.isPending ? (
            <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Sincronizando...</>
          ) : (
            <><Play className="h-3 w-3 mr-1" /> Sincronizar Agora</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── 2. Changes Tab ──

function ChangesTab() {
  const [search, setSearch] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: changes = [], isLoading, refetch } = useQuery({
    queryKey: ["detected-changes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("detected_changes")
        .select("*, integration_sources(name), peptides(name)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as DetectedChange[];
    },
  });

  const filtered = changes.filter((c) => {
    if (filterSeverity !== "all" && c.severity !== filterSeverity) return false;
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.change_type.toLowerCase().includes(q) ||
        (c.peptides?.name || "").toLowerCase().includes(q) ||
        (c.field_name || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, newStatus }: { ids: string[]; newStatus: string }) => {
      const { error } = await supabase
        .from("detected_changes")
        .update({ status: newStatus, reviewed_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      const labels: Record<string, string> = { synced: "sincronizados", ignored: "ignorados", reviewed: "marcados para revisão" };
      toast({ title: "Ação concluída", description: `${vars.ids.length} itens ${labels[vars.newStatus] || "atualizados"}.` });
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["detected-changes"] });
      queryClient.invalidateQueries({ queryKey: ["pending-changes-count"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleBulk = (newStatus: string) => {
    if (selected.size === 0) return;
    bulkMutation.mutate({ ids: Array.from(selected), newStatus });
  };

  const changeTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      new_peptide: "Novo Peptídeo",
      sequence_change: "Alteração de Sequência",
      description_change: "Alteração de Descrição",
      name_change: "Alteração de Nome",
      new_reference: "Nova Referência",
      activity_change: "Alteração de Atividade",
      structure_update: "Estrutura Atualizada",
      regulatory_update: "Atualização Regulatória",
      conflict: "Conflito entre Fontes",
      data_removed: "Informação Removida",
    };
    return map[type] || type;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-border/40 bg-card/80">
        <CardContent className="p-3 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-7 pl-8 text-[10px]" />
          </div>
          <select
            className="h-7 rounded-md border border-border bg-secondary/50 px-2 text-[10px] text-foreground"
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
          >
            <option value="all">Severidade</option>
            <option value="critical">Crítico</option>
            <option value="medium">Médio</option>
            <option value="low">Baixo</option>
          </select>
          <select
            className="h-7 rounded-md border border-border bg-secondary/50 px-2 text-[10px] text-foreground"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Status</option>
            <option value="pending">Pendente</option>
            <option value="reviewed">Revisado</option>
            <option value="synced">Sincronizado</option>
            <option value="ignored">Ignorado</option>
          </select>
          <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => refetch()}>
            <RefreshCw className="h-3 w-3 mr-1" /> Atualizar
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">
              {selected.size} {selected.size === 1 ? "item selecionado" : "itens selecionados"}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10"
                disabled={bulkMutation.isPending}
                onClick={() => handleBulk("synced")}
              >
                <Check className="h-3 w-3 mr-1" /> Sincronizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] border-amber-400/30 text-amber-400 hover:bg-amber-400/10"
                disabled={bulkMutation.isPending}
                onClick={() => handleBulk("reviewed")}
              >
                <Eye className="h-3 w-3 mr-1" /> Revisar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] border-muted-foreground/30 text-muted-foreground hover:bg-secondary"
                disabled={bulkMutation.isPending}
                onClick={() => handleBulk("ignored")}
              >
                <X className="h-3 w-3 mr-1" /> Ignorar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => setSelected(new Set())}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Changes List */}
      <Card className="border-border/40 bg-card/80">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-foreground font-medium">Nenhuma atualização detectada</p>
              <p className="text-[10px] text-muted-foreground">Execute uma sincronização para verificar mudanças</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="text-xs">Sev.</TableHead>
                  <TableHead className="text-xs">Tipo</TableHead>
                  <TableHead className="text-xs">Peptídeo</TableHead>
                  <TableHead className="text-xs">Campo</TableHead>
                  <TableHead className="text-xs">Fonte</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className={selected.has(c.id) ? "bg-primary/5" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(c.id)}
                        onCheckedChange={() => toggleOne(c.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[8px] px-1.5 py-0 ${severityColor(c.severity)}`}>
                        {c.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px]">{changeTypeLabel(c.change_type)}</TableCell>
                    <TableCell className="text-[10px] font-medium">{c.peptides?.name || "—"}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">{c.field_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[8px]">{c.integration_sources?.name || "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === "pending" ? "secondary" : "outline"} className="text-[8px]">
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {c.status === "pending" && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 text-emerald-400 hover:bg-emerald-400/10"
                            onClick={() => bulkMutation.mutate({ ids: [c.id], newStatus: "synced" })}
                            title="Sincronizar"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 text-muted-foreground hover:bg-secondary"
                            onClick={() => bulkMutation.mutate({ ids: [c.id], newStatus: "ignored" })}
                            title="Ignorar"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── 3. Audit Tab ──

function AuditTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selectedFinding, setSelectedFinding] = useState<AuditFinding | null>(null);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const PAGE_SIZE = 15;

  const { data: auditRuns = [], isLoading } = useQuery({
    queryKey: ["audit-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as AuditRun[];
    },
  });

  const latestRun = auditRuns[0];

  const { data: findings = [] } = useQuery({
    queryKey: ["audit-findings", latestRun?.id],
    queryFn: async () => {
      if (!latestRun) return [];
      const { data, error } = await supabase
        .from("audit_findings")
        .select("*, peptides(name)")
        .eq("audit_run_id", latestRun.id)
        .order("severity", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data as AuditFinding[];
    },
    enabled: !!latestRun,
  });

  const auditMutation = useMutation({
    mutationFn: async (scope: string) => {
      const { data, error } = await supabase.functions.invoke("audit-engine", {
        body: { scope },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "Auditoria concluída", description: `${data.total_findings} findings detectados` });
      queryClient.invalidateQueries({ queryKey: ["audit-runs"] });
      queryClient.invalidateQueries({ queryKey: ["audit-findings"] });
      queryClient.invalidateQueries({ queryKey: ["open-findings-count"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const ignoreMutation = useMutation({
    mutationFn: async (findingId: string) => {
      const { error } = await supabase
        .from("audit_findings")
        .update({ status: "ignored", resolved_at: new Date().toISOString(), resolution_note: "Ignorado pelo admin" })
        .eq("id", findingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Finding ignorado" });
      queryClient.invalidateQueries({ queryKey: ["audit-findings"] });
    },
  });

  // Batch check which peptides have suggestion data available
  const openPeptideIds = [...new Set(findings.filter(f => f.status === "open" && f.peptide_id).map(f => f.peptide_id!))];

  // Check source sync status for context
  const { data: sourceSyncMap = {} } = useQuery({
    queryKey: ["source-sync-map"],
    queryFn: async () => {
      const { data } = await supabase
        .from("integration_sources")
        .select("slug, name, last_sync_status, last_sync_at");
      const map: Record<string, { name: string; status: string | null; syncAt: string | null }> = {};
      (data || []).forEach((s: any) => {
        map[s.slug] = { name: s.name, status: s.last_sync_status, syncAt: s.last_sync_at };
        map[s.name.toLowerCase()] = { name: s.name, status: s.last_sync_status, syncAt: s.last_sync_at };
      });
      return map;
    },
  });

  // Check peptide_source_checks for per-item lookup status
  const { data: lookupStatusMap = {} } = useQuery({
    queryKey: ["peptide-lookup-status", openPeptideIds.join(",")],
    queryFn: async () => {
      if (openPeptideIds.length === 0) return {} as Record<string, Record<string, string>>;
      const { data } = await supabase
        .from("peptide_source_checks" as any)
        .select("peptide_id, source_provider, lookup_status")
        .in("peptide_id", openPeptideIds);
      const map: Record<string, Record<string, string>> = {};
      (data || []).forEach((row: any) => {
        if (!map[row.peptide_id]) map[row.peptide_id] = {};
        map[row.peptide_id][row.source_provider] = row.lookup_status;
      });
      return map;
    },
    enabled: openPeptideIds.length > 0,
  });

  const { data: suggestionAvailability = {} } = useQuery({
    queryKey: ["suggestion-availability", openPeptideIds.join(",")],
    queryFn: async () => {
      if (openPeptideIds.length === 0) return {} as Record<string, Set<string>>;
      
      const { data: changes } = await supabase
        .from("detected_changes")
        .select("peptide_id, field_name, change_type")
        .in("peptide_id", openPeptideIds)
        .eq("status", "pending");

      const { data: refs } = await supabase
        .from("peptide_references")
        .select("peptide_id")
        .in("peptide_id", openPeptideIds);

      const availability: Record<string, Set<string>> = {};
      
      (changes || []).forEach((c: any) => {
        if (!availability[c.peptide_id]) availability[c.peptide_id] = new Set();
        if (c.field_name === "sequence") availability[c.peptide_id].add("missing_sequence");
        if (c.change_type === "new_reference") availability[c.peptide_id].add("no_references");
        availability[c.peptide_id].add("no_source");
        availability[c.peptide_id].add("incomplete_data");
      });

      (refs || []).forEach((r: any) => {
        if (!availability[r.peptide_id]) availability[r.peptide_id] = new Set();
        availability[r.peptide_id].add("no_references");
        availability[r.peptide_id].add("no_source");
      });

      openPeptideIds.forEach(id => {
        if (!availability[id]) availability[id] = new Set();
        availability[id].add("data_inconsistency");
        availability[id].add("no_source");
      });

      return availability;
    },
    enabled: openPeptideIds.length > 0,
  });

  const hasSuggestionFor = (finding: AuditFinding): boolean => {
    if (!finding.peptide_id) return false;
    const avail = suggestionAvailability[finding.peptide_id];
    if (!avail) return false;
    return avail.has(finding.category);
  };

  // Get semantic badges for a finding
  const getSourceBadges = (f: AuditFinding) => {
    const badges: { label: string; color: string }[] = [];
    if (!f.peptide_id) return badges;

    const categorySourceMap: Record<string, string[]> = {
      missing_sequence: ["uniprot", "peptipedia", "dramp", "apd"],
      no_references: ["pubmed"],
      no_source: ["uniprot", "pubmed"],
      incomplete_data: ["uniprot"],
    };

    const relevantSources = categorySourceMap[f.category] || [];
    const peptideLookups = lookupStatusMap[f.peptide_id] || {};

    for (const srcSlug of relevantSources) {
      const srcInfo = sourceSyncMap[srcSlug];
      if (!srcInfo) continue;

      const globalOk = srcInfo.status === "success";
      const lookupStatus = peptideLookups[srcInfo.name] || peptideLookups[srcSlug];

      if (globalOk && lookupStatus === "no_match") {
        badges.push({ label: `Sem match no ${srcInfo.name}`, color: "text-amber-400 bg-amber-400/10 border-amber-400/30" });
      } else if (globalOk && lookupStatus === "strong_match") {
        badges.push({ label: `Match no ${srcInfo.name}`, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" });
      } else if (globalOk && !lookupStatus) {
        badges.push({ label: `${srcInfo.name} ativo`, color: "text-blue-400 bg-blue-400/10 border-blue-400/30" });
      } else if (!globalOk && srcInfo.status === "error") {
        badges.push({ label: `${srcInfo.name} com erro`, color: "text-red-400 bg-red-400/10 border-red-400/30" });
      }
    }

    return badges;
  };

  // Get semantic recommendation text
  const getSemanticRecommendation = (f: AuditFinding): string | null => {
    if (!f.recommendation) return null;
    if (!f.peptide_id) return f.recommendation;

    const peptideLookups = lookupStatusMap[f.peptide_id] || {};
    const hasNoMatch = Object.values(peptideLookups).some(s => s === "no_match");
    const hasStrongMatch = Object.values(peptideLookups).some(s => s === "strong_match");

    if (hasStrongMatch && hasSuggestionFor(f)) {
      return "Sugestão automática disponível — clique em Corrigir para revisar";
    }
    if (hasNoMatch) {
      return "Fontes verificadas sem correspondência confiável — revisão manual recomendada";
    }
    return f.recommendation;
  };

  // Counts per severity
  const counts = {
    all: findings.length,
    critical: findings.filter(f => f.severity === "critical").length,
    medium: findings.filter(f => f.severity === "medium").length,
    low: findings.filter(f => f.severity === "low").length,
    resolved: findings.filter(f => f.status === "resolved" || f.status === "ignored").length,
    open: findings.filter(f => f.status === "open").length,
  };

  const filtered = severityFilter === "all"
    ? findings.filter(f => f.status === "open")
    : severityFilter === "resolved"
    ? findings.filter(f => f.status === "resolved" || f.status === "ignored")
    : findings.filter(f => f.severity === severityFilter && f.status === "open");

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset page when filter changes
  const handleFilterChange = (val: string) => {
    setSeverityFilter(val);
    setPage(0);
  };

  const severityTabs = [
    { key: "all", label: "Abertos", count: counts.open, color: "text-foreground" },
    { key: "critical", label: "Críticos", count: counts.critical, color: "text-red-400" },
    { key: "medium", label: "Médios", count: counts.medium, color: "text-amber-400" },
    { key: "low", label: "Baixos", count: counts.low, color: "text-blue-400" },
    { key: "resolved", label: "Resolvidos", count: counts.resolved, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="h-8 text-[11px] border-primary/30 hover:bg-primary/10"
          disabled={auditMutation.isPending} onClick={() => auditMutation.mutate("full")}>
          {auditMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Eye className="h-3 w-3 mr-1.5" />}
          Auditoria Completa
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-[11px]"
          disabled={auditMutation.isPending} onClick={() => auditMutation.mutate("internal")}>
          Apenas Interna
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-[11px]"
          disabled={auditMutation.isPending} onClick={() => auditMutation.mutate("cross_source")}>
          Apenas Cross-Source
        </Button>
      </div>

      {/* Audit Summary */}
      {latestRun && (
        <Card className="border-border/40 bg-card/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Última Auditoria</CardTitle>
              <Badge variant="outline" className="text-[9px]">
                {latestRun.scope} • {new Date(latestRun.started_at).toLocaleDateString("pt-BR")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Total", value: latestRun.total_findings, color: "text-foreground" },
                { label: "Críticos", value: latestRun.critical_count, color: "text-red-400" },
                { label: "Médios", value: latestRun.medium_count, color: "text-amber-400" },
                { label: "Baixos", value: latestRun.low_count, color: "text-blue-400" },
                { label: "Resolvidos", value: latestRun.resolved_count, color: "text-emerald-400" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`text-lg font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Severity Filter Tabs */}
      <Card className="border-border/40 bg-card/80">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Findings</CardTitle>
            <div className="flex gap-1 flex-wrap">
              {severityTabs.map(tab => (
                <Button
                  key={tab.key}
                  variant={severityFilter === tab.key ? "default" : "ghost"}
                  size="sm"
                  className={`h-7 text-[10px] px-2.5 gap-1 ${severityFilter !== tab.key ? tab.color : ""}`}
                  onClick={() => handleFilterChange(tab.key)}
                >
                  {tab.label}
                  <span className={`text-[9px] font-bold ${severityFilter === tab.key ? "" : "opacity-70"}`}>
                    {tab.count}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-foreground font-medium">
                {severityFilter === "all" ? "Nenhum finding aberto" : `Nenhum finding ${severityFilter}`}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {findings.length === 0 ? "Execute uma auditoria para verificar" : "Tudo limpo nesta categoria"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginated.map((f) => (
                <div key={f.id} className={`p-3 rounded-lg border ${severityColor(f.severity)}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={`text-[8px] px-1.5 py-0 ${severityColor(f.severity)}`}>{f.severity}</Badge>
                        <Badge variant="outline" className="text-[8px]">{f.category}</Badge>
                        {f.peptides?.name && (
                          <span className="text-[10px] text-muted-foreground">• {f.peptides.name}</span>
                        )}
                        {/* Correction badges based on real data availability */}
                        {f.status === "open" && f.peptide_id && hasSuggestionFor(f) && (
                          <Badge className="text-[7px] px-1 py-0 text-emerald-400 bg-emerald-400/10 border-emerald-400/30">
                            <Wrench className="h-2 w-2 mr-0.5" /> Sugestão disponível
                          </Badge>
                        )}
                        {f.status === "open" && f.peptide_id && !hasSuggestionFor(f) && (
                          <Badge className="text-[7px] px-1 py-0 text-purple-400 bg-purple-400/10 border-purple-400/30">
                            <Edit3 className="h-2 w-2 mr-0.5" /> Revisão manual
                          </Badge>
                        )}
                        {/* Source-level status badges */}
                        {f.status === "open" && getSourceBadges(f).map((b, i) => (
                          <Badge key={i} className={`text-[7px] px-1 py-0 ${b.color}`}>
                            {b.label}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs font-medium text-foreground">{f.title}</p>
                      {f.description && <p className="text-[10px] text-muted-foreground mt-0.5">{f.description}</p>}

                      {(f.value_a || f.value_b) && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[9px]">
                          {f.value_a && (
                            <div className="p-1.5 rounded bg-destructive/10 border border-destructive/20">
                              <span className="text-destructive font-medium">{f.source_a || "Atual"}:</span>
                              <p className="text-foreground mt-0.5 break-words">{f.value_a}</p>
                            </div>
                          )}
                          {f.value_b && (
                            <div className="p-1.5 rounded bg-emerald-400/10 border border-emerald-400/20">
                              <span className="text-emerald-400 font-medium">{f.source_b || "Novo"}:</span>
                              <p className="text-foreground mt-0.5 break-words">{f.value_b}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {getSemanticRecommendation(f) && (
                        <p className="text-[9px] text-primary mt-1.5 flex items-center gap-1">
                          <Sparkles className="h-2.5 w-2.5" /> {getSemanticRecommendation(f)}
                        </p>
                      )}

                      {f.resolution_note && (
                        <p className="text-[9px] text-emerald-400 mt-1 italic">✓ {f.resolution_note}</p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-1 shrink-0">
                      {f.status === "open" ? (
                        <>
                          {f.peptide_id && hasSuggestionFor(f) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[9px] px-2 border-primary/30 text-primary hover:bg-primary/10"
                              onClick={() => { setSelectedFinding(f); setCorrectionOpen(true); }}
                            >
                              <Wrench className="h-2.5 w-2.5 mr-1" /> Ver sugestão
                            </Button>
                          )}
                          {f.peptide_id && !hasSuggestionFor(f) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 text-[9px] px-2 border-purple-400/30 text-purple-400 hover:bg-purple-400/10"
                              onClick={() => { setSelectedFinding(f); setCorrectionOpen(true); }}
                            >
                              <Edit3 className="h-2.5 w-2.5 mr-1" /> Editar manualmente
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[9px] px-2 text-muted-foreground hover:text-foreground"
                            disabled={ignoreMutation.isPending}
                            onClick={() => ignoreMutation.mutate(f.id)}
                          >
                            <XCircle className="h-2.5 w-2.5 mr-1" /> Ignorar
                          </Button>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-[8px] text-emerald-400 border-emerald-400/30">
                          {f.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
              <p className="text-[10px] text-muted-foreground">
                {filtered.length} findings • Página {page + 1} de {totalPages}
              </p>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2"
                  disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  ← Anterior
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2"
                  disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                  Próxima →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit History */}
      {auditRuns.length > 1 && (
        <Card className="border-border/40 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Histórico de Auditorias</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Escopo</TableHead>
                  <TableHead className="text-xs">Findings</TableHead>
                  <TableHead className="text-xs">Críticos</TableHead>
                  <TableHead className="text-xs">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditRuns.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{statusIcon(r.status)}</TableCell>
                    <TableCell className="text-[10px]">{r.scope}</TableCell>
                    <TableCell className="text-[10px]">{r.total_findings}</TableCell>
                    <TableCell className="text-[10px] text-red-400">{r.critical_count}</TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {new Date(r.started_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Correction Modal */}
      <CorrectionModal
        finding={selectedFinding}
        open={correctionOpen}
        onOpenChange={(open) => {
          setCorrectionOpen(open);
          if (!open) setSelectedFinding(null);
        }}
      />
    </div>
  );
}

// ── 4. Import Queue Tab ──

function ImportQueueTab() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: queue = [], isLoading } = useQuery({
    queryKey: ["import-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("peptide_import_queue")
        .select("*, integration_sources(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as (ImportQueueItem & { collected_data?: any })[];
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const items = queue.filter((q) => ids.includes(q.id));
      for (const item of items) {
        const cd = item.collected_data || {};
        const { error: insertErr } = await supabase.from("peptides").insert({
          name: item.name,
          slug: item.slug,
          category: cd.category || "Pesquisa",
          description: cd.description || null,
          sequence: cd.sequence || null,
          sequence_length: cd.sequence_length || null,
          benefits: cd.benefits || [],
          mechanism: cd.mechanism || null,
          biological_activity: cd.biological_activity || [],
          source_origins: cd.source_origins || [],
          confidence_score: item.confidence_score,
          tier: "essential",
          access_level: "starter",
        });
        if (insertErr) throw insertErr;

        await supabase
          .from("peptide_import_queue")
          .update({ status: "published", published_at: new Date().toISOString() })
          .eq("id", item.id);
      }
    },
    onSuccess: (_, ids) => {
      toast({ title: "Publicação concluída", description: `${ids.length} peptídeo(s) publicados com sucesso.` });
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["import-queue"] });
      queryClient.invalidateQueries({ queryKey: ["import-pending-count"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro na publicação", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("peptide_import_queue")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      toast({ title: "Itens rejeitados", description: `${ids.length} peptídeo(s) rejeitados.` });
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["import-queue"] });
      queryClient.invalidateQueries({ queryKey: ["import-pending-count"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const toggleAll = () => {
    const pending = queue.filter((q) => q.status === "pending");
    if (selected.size === pending.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pending.map((q) => q.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: "Pendente",
      approved: "Aprovado",
      published: "Publicado",
      rejected: "Rejeitado",
    };
    return map[s] || s;
  };

  const pendingItems = queue.filter((q) => q.status === "pending");

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selected.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">
              {selected.size} {selected.size === 1 ? "peptídeo selecionado" : "peptídeos selecionados"}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10"
                disabled={publishMutation.isPending}
                onClick={() => publishMutation.mutate(Array.from(selected))}
              >
                {publishMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
                Publicar Selecionados
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] border-destructive/30 text-destructive hover:bg-destructive/10"
                disabled={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate(Array.from(selected))}
              >
                <X className="h-3 w-3 mr-1" /> Rejeitar Selecionados
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => setSelected(new Set())}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/40 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <Sparkles className="inline h-4 w-4 mr-2 text-primary" />
            Fila de Publicação de Peptídeos
          </CardTitle>
          <p className="text-[10px] text-muted-foreground">Peptídeos novos detectados aguardando revisão e publicação</p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : queue.length === 0 ? (
            <div className="text-center py-12">
              <FlaskConical className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-foreground font-medium">Nenhum peptídeo na fila</p>
              <p className="text-[10px] text-muted-foreground">Novos peptídeos aparecerão aqui após a sincronização</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <Checkbox
                      checked={selected.size === pendingItems.length && pendingItems.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="text-xs">Nome</TableHead>
                  <TableHead className="text-xs">Fonte</TableHead>
                  <TableHead className="text-xs">Confiança</TableHead>
                  <TableHead className="text-xs">Pronto</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs w-28">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((item) => (
                  <TableRow key={item.id} className={selected.has(item.id) ? "bg-primary/5" : ""}>
                    <TableCell>
                      {item.status === "pending" && (
                        <Checkbox
                          checked={selected.has(item.id)}
                          onCheckedChange={() => toggleOne(item.id)}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[8px]">{item.integration_sources?.name || "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full ${item.confidence_score >= 70 ? "bg-emerald-400" : item.confidence_score >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                            style={{ width: `${item.confidence_score}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground">{item.confidence_score}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.is_ready ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.status === "pending" ? "secondary" : item.status === "published" ? "default" : "outline"} className="text-[8px]">
                        {statusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {item.status === "pending" && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 text-emerald-400 hover:bg-emerald-400/10"
                            onClick={() => publishMutation.mutate([item.id])}
                            disabled={publishMutation.isPending}
                            title="Publicar"
                          >
                            <Upload className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                            onClick={() => rejectMutation.mutate([item.id])}
                            disabled={rejectMutation.isPending}
                            title="Rejeitar"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── 5. History Tab ──

function HistoryTab() {
  const { data: runs = [], isLoading } = useQuery({
    queryKey: ["sync-runs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_runs")
        .select("*, integration_sources(name, slug)")
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as SyncRun[];
    },
  });

  return (
    <Card className="border-border/40 bg-card/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <FileText className="inline h-4 w-4 mr-2 text-primary" />
          Histórico de Sincronizações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : runs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Nenhuma sincronização realizada</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Fonte</TableHead>
                <TableHead className="text-xs">Modo</TableHead>
                <TableHead className="text-xs">Processados</TableHead>
                <TableHead className="text-xs">Novos</TableHead>
                <TableHead className="text-xs">Atualizados</TableHead>
                <TableHead className="text-xs">Conflitos</TableHead>
                <TableHead className="text-xs">Erros</TableHead>
                <TableHead className="text-xs">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{statusIcon(r.status)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[8px]">{r.integration_sources?.name || "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-[10px] capitalize">{r.mode}</TableCell>
                  <TableCell className="text-[10px]">{r.records_processed}</TableCell>
                  <TableCell className="text-[10px] text-emerald-400">{r.records_added}</TableCell>
                  <TableCell className="text-[10px] text-blue-400">{r.records_updated}</TableCell>
                  <TableCell className="text-[10px] text-amber-400">{r.conflicts_found}</TableCell>
                  <TableCell className="text-[10px] text-destructive">{r.errors_count}</TableCell>
                  <TableCell className="text-[10px] text-muted-foreground">
                    {new Date(r.started_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ── 6. Config Tab ──

function ConfigTab() {
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["sync-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_settings")
        .select("*")
        .order("key");
      if (error) throw error;
      return data as { id: string; key: string; value: any; description: string | null }[];
    },
  });

  const { data: priorityRules = [] } = useQuery({
    queryKey: ["source-priority-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("source_priority_rules")
        .select("*, integration_sources(name)")
        .order("data_domain");
      if (error) throw error;
      return data as any[];
    },
  });

  const settingLabel = (key: string) => {
    const map: Record<string, string> = {
      sync_mode: "Modo de Sincronização",
      auto_publish: "Auto-publicação",
      min_confidence_score: "Score Mínimo de Confiança",
      sync_interval_hours: "Intervalo de Sync (horas)",
    };
    return map[key] || key;
  };

  const settingValue = (value: any) => {
    if (typeof value === "string") {
      const map: Record<string, string> = {
        manual: "Manual",
        semi_auto: "Semi-automático",
        auto: "Automático",
        true: "Sim",
        false: "Não",
      };
      return map[value] || value;
    }
    return String(value);
  };

  return (
    <div className="space-y-4">
      {/* Sync Settings */}
      <Card className="border-border/40 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <Settings className="inline h-4 w-4 mr-2 text-primary" />
            Configurações de Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-3">
              {settings.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30 bg-secondary/20">
                  <div>
                    <p className="text-xs font-medium text-foreground">{settingLabel(s.key)}</p>
                    {s.description && <p className="text-[9px] text-muted-foreground">{s.description}</p>}
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {settingValue(typeof s.value === "string" ? s.value.replace(/"/g, "") : s.value)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Priority Rules */}
      <Card className="border-border/40 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <TrendingUp className="inline h-4 w-4 mr-2 text-primary" />
            Regras de Prioridade por Fonte
          </CardTitle>
          <p className="text-[10px] text-muted-foreground">Define qual fonte é autoritativa para cada domínio de dados</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Domínio</TableHead>
                <TableHead className="text-xs">Fonte</TableHead>
                <TableHead className="text-xs">Prioridade</TableHead>
                <TableHead className="text-xs">Autoritativa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priorityRules.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-[10px] capitalize font-medium">{r.data_domain}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[8px]">{r.integration_sources?.name || "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-[10px]">{r.priority}</TableCell>
                  <TableCell>
                    {r.is_authoritative ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {priorityRules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">Nenhuma regra configurada</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
