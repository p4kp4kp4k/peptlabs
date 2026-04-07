import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Users, Layers, BookOpen, Shield, TrendingUp, Search, Trash2, Edit,
  FlaskConical, Plus, Loader2, RefreshCw, Database, CheckCircle2, AlertTriangle, Clock
} from "lucide-react";
import { fetchAllProfiles, fetchProfileCount } from "@/services/userService";
import { fetchPeptides, fetchPeptideCount, deletePeptide } from "@/services/peptideService";
import { fetchStacks, fetchStackCount, deleteStack } from "@/services/stackService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchUsers, setSearchUsers] = useState("");
  const [searchPeptides, setSearchPeptides] = useState("");
  const [searchStacks, setSearchStacks] = useState("");

  const { data: profiles = [], isLoading: loadingProfiles, refetch: refetchProfiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: () => fetchAllProfiles(100),
    enabled: isAdmin,
  });

  const { data: peptides = [], isLoading: loadingPeptides, refetch: refetchPeptides } = useQuery({
    queryKey: ["admin-peptides"],
    queryFn: fetchPeptides,
    enabled: isAdmin,
  });

  const { data: stacks = [], isLoading: loadingStacks, refetch: refetchStacks } = useQuery({
    queryKey: ["admin-stacks"],
    queryFn: fetchStacks,
    enabled: isAdmin,
  });

  const stats = {
    users: profiles.length,
    peptides: peptides.length,
    stacks: stacks.length,
  };

  const handleDeletePeptide = async (id: string, name: string) => {
    if (!confirm(`Excluir peptídeo "${name}"?`)) return;
    try {
      await deletePeptide(id);
      toast({ title: "Excluído", description: `${name} removido.` });
      refetchPeptides();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteStack = async (id: string, name: string) => {
    if (!confirm(`Excluir stack "${name}"?`)) return;
    try {
      await deleteStack(id);
      toast({ title: "Excluído", description: `${name} removido.` });
      refetchStacks();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    );
  }

  const filteredProfiles = profiles.filter((u) =>
    !searchUsers || (u.display_name || "").toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredPeptides = peptides.filter((p) =>
    !searchPeptides || p.name.toLowerCase().includes(searchPeptides.toLowerCase()) || p.category.toLowerCase().includes(searchPeptides.toLowerCase())
  );

  const filteredStacks = stacks.filter((s) =>
    !searchStacks || s.name.toLowerCase().includes(searchStacks.toLowerCase()) || s.category.toLowerCase().includes(searchStacks.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <Shield className="inline h-5 w-5 mr-2 text-primary" />
          Painel Administrativo
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Gerencie usuários, peptídeos e stacks da plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Users, label: "Usuários", value: stats.users },
          { icon: FlaskConical, label: "Peptídeos", value: stats.peptides },
          { icon: Layers, label: "Stacks", value: stats.stacks },
        ].map((s) => (
          <Card key={s.label} className="border-border/40 bg-card/80">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="h-9 bg-secondary/60 p-0.5">
          <TabsTrigger value="users" className="text-[11px] gap-1.5 data-[state=active]:bg-card px-3 h-8">
            <Users className="h-3.5 w-3.5" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="peptides" className="text-[11px] gap-1.5 data-[state=active]:bg-card px-3 h-8">
            <FlaskConical className="h-3.5 w-3.5" /> Peptídeos
          </TabsTrigger>
          <TabsTrigger value="stacks" className="text-[11px] gap-1.5 data-[state=active]:bg-card px-3 h-8">
            <Layers className="h-3.5 w-3.5" /> Stacks
          </TabsTrigger>
          <TabsTrigger value="sync" className="text-[11px] gap-1.5 data-[state=active]:bg-card px-3 h-8">
            <Database className="h-3.5 w-3.5" /> Sincronização
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="border-border/40 bg-card/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Usuários ({filteredProfiles.length})</CardTitle>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar..." value={searchUsers} onChange={(e) => setSearchUsers(e.target.value)} className="h-7 pl-8 text-[10px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingProfiles ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="text-xs">{u.display_name || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(u.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredProfiles.length === 0 && (
                      <TableRow><TableCell colSpan={2} className="text-center text-xs text-muted-foreground py-4">Nenhum usuário</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Peptides Tab */}
        <TabsContent value="peptides">
          <Card className="border-border/40 bg-card/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Peptídeos ({filteredPeptides.length})</CardTitle>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar..." value={searchPeptides} onChange={(e) => setSearchPeptides(e.target.value)} className="h-7 pl-8 text-[10px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingPeptides ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Categoria</TableHead>
                      <TableHead className="text-xs w-20">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPeptides.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-medium">{p.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px]">{p.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeletePeptide(p.id, p.name)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredPeptides.length === 0 && (
                      <TableRow><TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-4">Nenhum peptídeo</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stacks Tab */}
        <TabsContent value="stacks">
          <Card className="border-border/40 bg-card/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Stacks ({filteredStacks.length})</CardTitle>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Buscar..." value={searchStacks} onChange={(e) => setSearchStacks(e.target.value)} className="h-7 pl-8 text-[10px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStacks ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Categoria</TableHead>
                      <TableHead className="text-xs">Peptídeos</TableHead>
                      <TableHead className="text-xs w-20">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStacks.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-xs font-medium">{s.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px]">{s.category}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{s.peptides.length}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteStack(s.id, s.name)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredStacks.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">Nenhum stack</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Tab */}
        <TabsContent value="sync">
          <SyncPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Sync Panel Component ──

function SyncPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading: loadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ["sync-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_log")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as any[];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (params: { fn: string; body: any }) => {
      const { data, error } = await supabase.functions.invoke(params.fn, {
        body: params.body,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data, vars) => {
      toast({
        title: "Sincronização concluída",
        description: `${vars.body.source || "all"}: ${data.processed || 0} processados, ${data.added || 0} adicionados, ${data.updated || 0} atualizados`,
      });
      refetchLogs();
      queryClient.invalidateQueries({ queryKey: ["admin-peptides"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro na sincronização", description: err.message, variant: "destructive" });
      refetchLogs();
    },
  });

  const sources = [
    { label: "PubMed + NCBI Protein", fn: "sync-peptides", body: { source: "all" }, icon: BookOpen, color: "text-blue-400" },
    { label: "Apenas PubMed", fn: "sync-peptides", body: { source: "pubmed" }, icon: BookOpen, color: "text-emerald-400" },
    { label: "DRAMP", fn: "ingest-datasets", body: { source: "dramp" }, icon: Database, color: "text-amber-400" },
    { label: "APD", fn: "ingest-datasets", body: { source: "apd" }, icon: Database, color: "text-purple-400" },
    { label: "Peptipedia", fn: "ingest-datasets", body: { source: "peptipedia" }, icon: Database, color: "text-pink-400" },
    { label: "Todos os Datasets", fn: "ingest-datasets", body: { source: "all" }, icon: RefreshCw, color: "text-primary" },
  ];

  const statusIcon = (status: string) => {
    if (status === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    if (status === "error") return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
    if (status === "running") return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
    return <Clock className="h-3.5 w-3.5 text-amber-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Sync Actions */}
      <Card className="border-border/40 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <Database className="inline h-4 w-4 mr-2 text-primary" />
            Sincronização de Fontes Científicas
          </CardTitle>
          <p className="text-[11px] text-muted-foreground mt-1">
            Atualize a biblioteca com dados do PubMed, NCBI Protein, DRAMP, APD e Peptipedia
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {sources.map((src) => (
              <Button
                key={src.label}
                variant="outline"
                size="sm"
                className="h-auto py-3 px-3 flex flex-col items-start gap-1.5 text-left border-border/30 hover:border-primary/40 hover:bg-primary/5"
                disabled={syncMutation.isPending}
                onClick={() => syncMutation.mutate({ fn: src.fn, body: src.body })}
              >
                <div className="flex items-center gap-2">
                  <src.icon className={`h-3.5 w-3.5 ${src.color}`} />
                  <span className="text-[11px] font-semibold">{src.label}</span>
                </div>
                {syncMutation.isPending && syncMutation.variables?.body.source === src.body.source && (
                  <span className="text-[9px] text-primary flex items-center gap-1">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> Sincronizando...
                  </span>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sync Logs */}
      <Card className="border-border/40 bg-card/80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Histórico de Sincronizações
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => refetchLogs()}>
              <RefreshCw className="h-3 w-3 mr-1" /> Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : logs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Nenhuma sincronização realizada ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Fonte</TableHead>
                  <TableHead className="text-xs">Processados</TableHead>
                  <TableHead className="text-xs">Adicionados</TableHead>
                  <TableHead className="text-xs">Atualizados</TableHead>
                  <TableHead className="text-xs">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>{statusIcon(log.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px]">{log.source}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{log.records_processed || 0}</TableCell>
                    <TableCell className="text-xs text-emerald-400">{log.records_added || 0}</TableCell>
                    <TableCell className="text-xs text-blue-400">{log.records_updated || 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.started_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
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
