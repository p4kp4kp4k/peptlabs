import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Users, CreditCard, Settings, Activity, AlertTriangle,
  Crown, Shield, Loader2, CheckCircle2, XCircle, RefreshCw,
  Webhook, BarChart3, Clock, Zap
} from "lucide-react";
import { toast } from "sonner";

/* ─── Types ─── */
interface UserRow {
  user_id: string;
  display_name: string | null;
  created_at: string;
}

interface EntitlementRow {
  user_id: string;
  plan: string;
  billing_type: string;
  is_active: boolean;
}

interface BillingEventRow {
  id: string;
  user_id: string;
  event_type: string;
  provider: string;
  created_at: string;
  payload: Record<string, unknown>;
}

interface WebhookEventRow {
  id: string;
  provider: string;
  event_type: string;
  processed: boolean;
  created_at: string;
  error_message: string | null;
}

interface GatewayRow {
  id: string;
  provider: string;
  is_active: boolean;
  environment: string;
  webhook_url: string | null;
  configured_at: string | null;
}

/* ─── Admin Page ─── */
export default function AdminBilling() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState("overview");
  const queryClient = useQueryClient();

  if (!isAdmin) return <Navigate to="/app/dashboard" replace />;

  /* ── Queries ── */
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("user_id, display_name, created_at").order("created_at", { ascending: false }).limit(100);
      return (data ?? []) as UserRow[];
    },
  });

  const { data: entitlements = [] } = useQuery({
    queryKey: ["admin-entitlements"],
    queryFn: async () => {
      const { data } = await supabase.from("entitlements").select("user_id, plan, billing_type, is_active");
      return (data ?? []) as EntitlementRow[];
    },
  });

  const { data: billingEvents = [] } = useQuery({
    queryKey: ["admin-billing-events"],
    queryFn: async () => {
      const { data } = await supabase.from("billing_events").select("*").order("created_at", { ascending: false }).limit(50);
      return (data ?? []) as BillingEventRow[];
    },
  });

  const { data: webhookEvents = [] } = useQuery({
    queryKey: ["admin-webhook-events"],
    queryFn: async () => {
      const { data } = await supabase.from("webhook_events").select("*").order("created_at", { ascending: false }).limit(50);
      return (data ?? []) as WebhookEventRow[];
    },
  });

  const { data: gateways = [], isLoading: gatewaysLoading } = useQuery({
    queryKey: ["admin-gateways"],
    queryFn: async () => {
      const { data } = await supabase.from("gateway_settings").select("*");
      return (data ?? []) as GatewayRow[];
    },
  });

  /* ── Metrics ── */
  const entMap = new Map(entitlements.map(e => [e.user_id, e]));
  const totalUsers = profiles.length;
  const proUsers = entitlements.filter(e => e.plan === "pro" && e.is_active).length;
  const lifetimeUsers = entitlements.filter(e => e.billing_type === "lifetime" && e.plan === "pro").length;
  const freeUsers = totalUsers - proUsers;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground font-display">Admin — Billing & Gateway</h1>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="overview" className="text-xs gap-1"><BarChart3 className="h-3 w-3" /> Visão Geral</TabsTrigger>
          <TabsTrigger value="users" className="text-xs gap-1"><Users className="h-3 w-3" /> Usuários</TabsTrigger>
          <TabsTrigger value="gateways" className="text-xs gap-1"><CreditCard className="h-3 w-3" /> Gateways</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs gap-1"><Activity className="h-3 w-3" /> Logs</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Usuários", value: totalUsers, icon: Users, color: "text-blue-400" },
              { label: "PRO Ativos", value: proUsers, icon: Crown, color: "text-primary" },
              { label: "Vitalícios", value: lifetimeUsers, icon: Zap, color: "text-amber-400" },
              { label: "Free", value: freeUsers, icon: Shield, color: "text-muted-foreground" },
            ].map(s => (
              <Card key={s.label} className="bg-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent events */}
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Eventos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {billingEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum evento de billing registrado.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {billingEvents.slice(0, 10).map(ev => (
                    <div key={ev.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <div>
                        <span className="text-xs font-medium text-foreground">{ev.event_type}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">{ev.provider}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(ev.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Users ── */}
        <TabsContent value="users" className="mt-4">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Usuários ({totalUsers})</CardTitle>
            </CardHeader>
            <CardContent>
              {profilesLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
              ) : (
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {profiles.map(p => {
                    const ent = entMap.get(p.user_id);
                    return (
                      <div key={p.user_id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/20 border-b border-border/20">
                        <div>
                          <p className="text-xs font-medium text-foreground">{p.display_name || "Sem nome"}</p>
                          <p className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {ent ? (
                            <Badge className={`text-[9px] ${
                              ent.billing_type === "lifetime" ? "bg-amber-500/15 text-amber-400 border-amber-500/25" :
                              ent.plan === "pro" ? "bg-primary/15 text-primary border-primary/25" :
                              "bg-muted/30 text-muted-foreground border-border/40"
                            }`}>
                              {ent.billing_type === "lifetime" ? "VITALÍCIO" : ent.plan === "pro" ? "PRO" : "FREE"}
                            </Badge>
                          ) : (
                            <Badge className="text-[9px] bg-muted/30 text-muted-foreground">FREE</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Gateways ── */}
        <TabsContent value="gateways" className="mt-4 space-y-4">
          {gatewaysLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
          ) : (
            gateways.map(gw => (
              <Card key={gw.id} className="bg-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-bold text-foreground capitalize">{gw.provider}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Ambiente: <span className="font-medium">{gw.environment}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[9px] ${gw.is_active ? "bg-emerald-500/15 text-emerald-400" : "bg-muted/30 text-muted-foreground"}`}>
                        {gw.is_active ? "ATIVO" : "INATIVO"}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-muted-foreground">Webhook URL:</span>
                      <p className="text-foreground font-mono text-[10px] break-all">
                        {gw.webhook_url || "Não configurado"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Configurado em:</span>
                      <p className="text-foreground">
                        {gw.configured_at ? new Date(gw.configured_at).toLocaleDateString("pt-BR") : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <Card className="bg-card border-border/50 border-dashed">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Para ativar um gateway, configure as chaves de API nas variáveis de ambiente do projeto.
              </p>
              <div className="text-[10px] text-muted-foreground space-y-1">
                <p><strong>Stripe:</strong> STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_LIFETIME</p>
                <p><strong>Mercado Pago:</strong> MERCADOPAGO_ACCESS_TOKEN</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Logs ── */}
        <TabsContent value="logs" className="mt-4 space-y-4">
          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Webhook className="h-4 w-4 text-primary" /> Webhook Events ({webhookEvents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {webhookEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum webhook recebido.</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {webhookEvents.map(wh => (
                    <div key={wh.id} className="flex items-center justify-between py-2 border-b border-border/30">
                      <div className="flex items-center gap-2">
                        {wh.processed ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        ) : wh.error_message ? (
                          <XCircle className="h-3 w-3 text-red-400" />
                        ) : (
                          <Clock className="h-3 w-3 text-amber-400" />
                        )}
                        <div>
                          <span className="text-xs font-medium text-foreground">{wh.event_type}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">{wh.provider}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(wh.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Billing Events ({billingEvents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {billingEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum evento de billing.</p>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {billingEvents.map(ev => (
                    <div key={ev.id} className="flex items-center justify-between py-2 border-b border-border/30">
                      <div>
                        <span className="text-xs font-medium text-foreground">{ev.event_type}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">{ev.provider}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(ev.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
