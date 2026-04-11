import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Search, Loader2, Webhook, RefreshCw, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp
} from "lucide-react";

export default function AdminWebhooks() {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-webhook-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 15000, // Auto-refresh every 15s for near real-time
  });

  const filtered = events.filter((e: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (e.event_type || "").toLowerCase().includes(s) ||
      (e.provider || "").toLowerCase().includes(s) ||
      (e.provider_event_id || "").toLowerCase().includes(s)
    );
  });

  const stats = {
    total: events.length,
    processed: events.filter((e: any) => e.processed).length,
    failed: events.filter((e: any) => e.error_message).length,
    recent24h: events.filter((e: any) => {
      const d = new Date(e.created_at);
      return Date.now() - d.getTime() < 86400000;
    }).length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Eventos", value: stats.total, color: "text-blue-400" },
          { label: "Processados", value: stats.processed, color: "text-emerald-400" },
          { label: "Com Erro", value: stats.failed, color: "text-red-400" },
          { label: "Últimas 24h", value: stats.recent24h, color: "text-primary" },
        ].map((s) => (
          <Card key={s.label} className="border-border/40 bg-card/80">
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`} style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {s.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Events table */}
      <Card className="border-border/40 bg-card/80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Webhook className="inline h-4 w-4 mr-2 text-primary" />
              Eventos de Webhook ({filtered.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar evento..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-7 pl-8 text-[10px]"
                />
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => refetch()}>
                <RefreshCw className="h-3 w-3" /> Atualizar
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Atualização automática a cada 15 segundos
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-8"></TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Provedor</TableHead>
                    <TableHead className="text-xs">Evento</TableHead>
                    <TableHead className="text-xs">ID Provedor</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e: any) => {
                    const isExpanded = expandedId === e.id;
                    return (
                      <>
                        <TableRow
                          key={e.id}
                          className="cursor-pointer hover:bg-secondary/40"
                          onClick={() => setExpandedId(isExpanded ? null : e.id)}
                        >
                          <TableCell className="p-1">
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(e.created_at).toLocaleString("pt-BR", {
                              day: "2-digit", month: "2-digit", year: "2-digit",
                              hour: "2-digit", minute: "2-digit", second: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[9px]">
                              {e.provider}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-medium font-mono">
                            {e.event_type}
                          </TableCell>
                          <TableCell className="text-[10px] text-muted-foreground font-mono">
                            {e.provider_event_id
                              ? e.provider_event_id.length > 16
                                ? e.provider_event_id.slice(0, 16) + "…"
                                : e.provider_event_id
                              : "—"}
                          </TableCell>
                          <TableCell>
                            {e.error_message ? (
                              <Badge className="text-[9px] gap-1 bg-red-500/15 text-red-400 border-red-500/25">
                                <XCircle className="h-2.5 w-2.5" /> Erro
                              </Badge>
                            ) : e.processed ? (
                              <Badge className="text-[9px] gap-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/25">
                                <CheckCircle2 className="h-2.5 w-2.5" /> OK
                              </Badge>
                            ) : (
                              <Badge className="text-[9px] gap-1 bg-amber-500/15 text-amber-400 border-amber-500/25">
                                <Clock className="h-2.5 w-2.5" /> Pendente
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${e.id}-detail`}>
                            <TableCell colSpan={6} className="p-0">
                              <div className="bg-secondary/20 border-t border-border/30 p-4 space-y-2">
                                {e.error_message && (
                                  <div className="text-xs text-red-400">
                                    <span className="font-semibold">Erro:</span> {e.error_message}
                                  </div>
                                )}
                                {e.processed_at && (
                                  <div className="text-[10px] text-muted-foreground">
                                    <span className="font-semibold">Processado em:</span>{" "}
                                    {new Date(e.processed_at).toLocaleString("pt-BR")}
                                  </div>
                                )}
                                <div className="text-[10px] text-muted-foreground">
                                  <span className="font-semibold">Payload:</span>
                                </div>
                                <pre className="text-[10px] bg-background/80 rounded-md p-3 overflow-x-auto max-h-64 border border-border/30 font-mono text-muted-foreground">
                                  {JSON.stringify(e.payload, null, 2)}
                                </pre>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                        Nenhum evento de webhook encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
