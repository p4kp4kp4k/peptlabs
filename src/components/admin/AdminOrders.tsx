import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Search, Loader2, Package, Clock, CheckCircle2, XCircle, AlertTriangle, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pending: { label: "Pendente", icon: Clock, className: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  approved: { label: "Aprovado", icon: CheckCircle2, className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  rejected: { label: "Rejeitado", icon: XCircle, className: "bg-red-500/15 text-red-400 border-red-500/25" },
  cancelled: { label: "Cancelado", icon: XCircle, className: "bg-muted/30 text-muted-foreground border-border/40" },
  refunded: { label: "Reembolsado", icon: RefreshCw, className: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
};

export default function AdminOrders() {
  const [search, setSearch] = useState("");

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, products(name), product_variants(color_name), profiles!orders_user_id_fkey(display_name)")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) {
        // Fallback without joins if FK names differ
        const { data: fallback, error: err2 } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        if (err2) throw err2;
        return fallback as any[];
      }
      return data as any[];
    },
  });

  const filtered = orders.filter((o: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (o.products?.name || "").toLowerCase().includes(s) ||
      (o.profiles?.display_name || "").toLowerCase().includes(s) ||
      (o.payment_status || "").toLowerCase().includes(s) ||
      (o.payment_method || "").toLowerCase().includes(s) ||
      (o.mp_order_id || "").toLowerCase().includes(s)
    );
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) => o.payment_status === "pending").length,
    approved: orders.filter((o: any) => o.payment_status === "approved").length,
    revenue: orders
      .filter((o: any) => o.payment_status === "approved")
      .reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0),
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Pedidos", value: stats.total, color: "text-blue-400" },
          { label: "Pendentes", value: stats.pending, color: "text-amber-400" },
          { label: "Aprovados", value: stats.approved, color: "text-emerald-400" },
          { label: "Receita", value: `R$ ${stats.revenue.toFixed(2)}`, color: "text-primary" },
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

      {/* Orders table */}
      <Card className="border-border/40 bg-card/80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <Package className="inline h-4 w-4 mr-2 text-primary" />
              Pedidos ({filtered.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar pedido..."
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
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Cliente</TableHead>
                    <TableHead className="text-xs">Produto</TableHead>
                    <TableHead className="text-xs">Qtd</TableHead>
                    <TableHead className="text-xs">Valor</TableHead>
                    <TableHead className="text-xs">Método</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">MP Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o: any) => {
                    const sc = statusConfig[o.payment_status] || statusConfig.pending;
                    const StatusIcon = sc.icon;
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(o.created_at).toLocaleString("pt-BR", {
                            day: "2-digit", month: "2-digit", year: "2-digit",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell className="text-xs">
                          {o.profiles?.display_name || o.user_id?.slice(0, 8) + "..."}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {o.products?.name || "—"}
                          {o.product_variants?.color_name && (
                            <span className="text-muted-foreground ml-1">({o.product_variants.color_name})</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{o.quantity}</TableCell>
                        <TableCell className="text-xs font-medium">
                          R$ {Number(o.total_amount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px]">
                            {o.payment_method === "credit_card" ? "💳 Cartão" :
                             o.payment_method === "pix" ? "🔑 PIX" :
                             o.payment_method === "boleto" ? "🏦 Boleto" : o.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[9px] gap-1 ${sc.className}`}>
                            <StatusIcon className="h-2.5 w-2.5" />
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground font-mono">
                          {o.mp_order_id ? o.mp_order_id.slice(0, 12) + "..." : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                        Nenhum pedido encontrado
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
