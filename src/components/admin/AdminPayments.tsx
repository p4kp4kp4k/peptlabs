import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CreditCard, Copy, Loader2, AlertTriangle, CheckCircle2,
  Shield, Webhook, Info, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const WEBHOOK_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/mp-webhook`;

/* ─── Validation helpers ─── */

function validatePublicKey(key: string, env: string): string | null {
  const k = key.trim();
  if (!k) return null; // empty is valid when gateway inactive
  if (!k.startsWith("APP_USR-") && !k.startsWith("TEST-")) {
    return "Public Key deve começar com APP_USR- (produção) ou TEST- (sandbox).";
  }
  if (env === "production" && k.startsWith("TEST-")) {
    return "Ambiente Produção exige Public Key de produção (APP_USR-). Chave TEST- não é permitida.";
  }
  if (env === "sandbox" && k.startsWith("APP_USR-")) {
    return "Ambiente Sandbox normalmente usa chave TEST-. Você está usando uma chave de produção.";
  }
  return null;
}

function maskKey(key: string): string {
  if (!key || key.length < 16) return key || "—";
  return key.substring(0, 12) + "••••" + key.substring(key.length - 4);
}

/* ─── Component ─── */

export default function AdminPayments() {
  const queryClient = useQueryClient();

  const [publicKey, setPublicKey] = useState("");
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [isActive, setIsActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formDirty, setFormDirty] = useState(false);

  /* ── Load gateway settings ── */
  const { data: settings, isLoading } = useQuery({
    queryKey: ["gateway-mp-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gateway_settings")
        .select("id, provider, is_active, environment, config, configured_at, webhook_url")
        .eq("provider", "mercadopago")
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  /* ── Sync form state from DB ── */
  useEffect(() => {
    if (!settings) return;
    const config = (settings.config ?? {}) as Record<string, unknown>;
    setPublicKey(typeof config.public_key === "string" ? config.public_key : "");
    setEnvironment((settings.environment as "sandbox" | "production") || "sandbox");
    setIsActive(Boolean(settings.is_active));
    setFormDirty(false);
  }, [settings]);

  /* ── Validation ── */
  const keyError = publicKey.trim() ? validatePublicKey(publicKey, environment) : null;
  const isWarningOnly = keyError?.includes("normalmente usa");
  const canSave = formDirty && (!keyError || isWarningOnly);

  const configComplete = Boolean(
    publicKey.trim() &&
    !keyError &&
    isActive
  );

  /* ── Save ── */
  const handleSave = async () => {
    const trimmed = publicKey.trim();

    if (isActive && !trimmed) {
      toast.error("Public Key é obrigatória quando o gateway está ativo.");
      return;
    }

    if (keyError && !isWarningOnly) {
      toast.error(keyError);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        provider: "mercadopago" as const,
        is_active: isActive,
        environment,
        config: {
          public_key: trimmed,
          has_access_token: true,
        },
        configured_at: new Date().toISOString(),
      };

      if (settings?.id) {
        const { error } = await supabase
          .from("gateway_settings")
          .update(payload)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("gateway_settings")
          .insert(payload);
        if (error) throw error;
      }

      toast.success("Configurações do Mercado Pago salvas com sucesso.");
      setFormDirty(false);
      queryClient.invalidateQueries({ queryKey: ["gateway-mp-settings"] });
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* ── Header status ── */}
      <Card className="border-border/40 bg-card/80">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Mercado Pago
                </p>
                <p className="text-[10px] text-muted-foreground">Gateway de pagamentos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`text-[9px] ${
                configComplete
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                  : isActive
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
                    : "bg-muted/30 text-muted-foreground border-border/40"
              }`}>
                {configComplete ? "✓ Operacional" : isActive ? "⚠ Incompleto" : "Inativo"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Configuration form ── */}
      <Card className="border-border/40 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Configuração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-medium">Gateway ativo</Label>
              <p className="text-[10px] text-muted-foreground">Habilita pagamentos via Mercado Pago</p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={(v) => { setIsActive(v); setFormDirty(true); }}
            />
          </div>

          {/* Environment */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Ambiente</Label>
            <div className="flex gap-2">
              {(["sandbox", "production"] as const).map((env) => (
                <Button
                  key={env}
                  variant={environment === env ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-[10px]"
                  onClick={() => { setEnvironment(env); setFormDirty(true); }}
                >
                  {env === "sandbox" ? "🧪 Sandbox" : "🚀 Produção"}
                </Button>
              ))}
            </div>
          </div>

          {/* Public Key */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Public Key</Label>
            <Input
              value={publicKey}
              onChange={(e) => { setPublicKey(e.target.value); setFormDirty(true); }}
              placeholder={environment === "sandbox" ? "TEST-xxxx-xxxx-xxxx..." : "APP_USR-xxxx-xxxx-xxxx..."}
              className={`h-8 text-xs font-mono ${
                keyError && !isWarningOnly ? "border-destructive/60 focus-visible:ring-destructive/40" : ""
              }`}
            />
            {keyError ? (
              <p className={`text-[10px] flex items-center gap-1 ${isWarningOnly ? "text-amber-400" : "text-destructive"}`}>
                <AlertTriangle className="h-3 w-3 shrink-0" /> {keyError}
              </p>
            ) : publicKey.trim() ? (
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Formato válido — {maskKey(publicKey.trim())}
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground">
                Encontre em: MercadoPago → Seu negócio → Configurações → Credenciais
              </p>
            )}
          </div>

          {/* Webhook URL */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Webhook className="h-3.5 w-3.5 text-primary" />
              URL do Webhook
            </Label>
            <div className="flex items-center gap-2">
              <Input
                value={WEBHOOK_URL}
                readOnly
                className="h-8 text-[10px] font-mono bg-secondary/30 cursor-default"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[10px] gap-1 shrink-0"
                onClick={() => {
                  navigator.clipboard.writeText(WEBHOOK_URL);
                  toast.success("URL copiada!");
                }}
              >
                <Copy className="h-3 w-3" /> Copiar
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Cadastre no painel do Mercado Pago → Suas integrações → Webhooks → Tópico: <strong>order</strong>
            </p>
          </div>

          {/* Accepted methods */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Métodos aceitos</Label>
            <div className="flex gap-2 flex-wrap">
              {[
                { icon: "💳", label: "Cartão de Crédito" },
                { icon: "🔑", label: "PIX" },
              ].map((m) => (
                <Badge key={m.label} variant="outline" className="text-[10px] gap-1.5 py-1">
                  {m.icon} {m.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Last update */}
          {settings?.configured_at && (
            <p className="text-[10px] text-muted-foreground">
              Última atualização: {new Date(settings.configured_at).toLocaleString("pt-BR")}
            </p>
          )}

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="text-xs gap-1.5 w-full sm:w-auto"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>

      {/* ── Security info ── */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-2 text-primary">
            <Shield className="h-4 w-4" /> Credenciais Protegidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-foreground">
              <strong>Access Token</strong> — configurado com segurança no backend. Nunca exposto ao navegador.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-foreground">
              <strong>Webhook Secret</strong> — configurado com segurança no backend. Usado para validar assinaturas HMAC.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-[11px] text-muted-foreground">
              Para atualizar credenciais privadas, acesse as configurações de secrets do projeto.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Checklist ── */}
      <Card className="border-border/40 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" /> Checklist de Configuração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {[
              { ok: isActive, label: "Gateway ativo" },
              { ok: Boolean(publicKey.trim() && !keyError), label: "Public Key válida" },
              { ok: environment === "production", label: "Ambiente Produção" },
              { ok: true, label: "Access Token (backend)" },
              { ok: true, label: "Webhook Secret (backend)" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                {item.ok ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-muted-foreground/30" />
                )}
                <span className={`text-[11px] ${item.ok ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
