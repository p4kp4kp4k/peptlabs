import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, Info, CheckCircle2, XCircle, Facebook } from "lucide-react";
import { toast } from "sonner";

export default function AdminPixel() {
  const queryClient = useQueryClient();

  /* ── Load current pixel setting ── */
  const { data: pixelId, isLoading } = useQuery({
    queryKey: ["app-setting-facebook-pixel"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "facebook_pixel_id")
        .maybeSingle();
      return (data?.value as string | null) ?? "";
    },
  });

  const [inputValue, setInputValue] = useState<string | undefined>(undefined);
  const displayValue = inputValue !== undefined ? inputValue : (pixelId ?? "");

  /* ── Save mutation ── */
  const saveMutation = useMutation({
    mutationFn: async (value: string) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert(
          { key: "facebook_pixel_id", value: value.trim() || null, updated_at: new Date().toISOString() },
          { onConflict: "key" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pixel salvo! Recarregue a página para ativar.");
      setInputValue(undefined);
      queryClient.invalidateQueries({ queryKey: ["app-setting-facebook-pixel"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isActive = Boolean(pixelId && pixelId.trim().length > 0);
  const hasChanges = inputValue !== undefined && inputValue !== (pixelId ?? "");

  return (
    <div className="space-y-4">
      {/* Status card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-border/50 bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            {isActive ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <div>
              <p className="text-xs font-semibold text-foreground">
                Status do Pixel
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isActive ? (
                  <span className="text-emerald-400 font-medium">Ativo — ID: {pixelId}</span>
                ) : (
                  "Nenhum pixel configurado"
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <Facebook className="h-5 w-5 text-[#1877F2] shrink-0" />
            <div>
              <p className="text-xs font-semibold text-foreground">Meta Pixel (Facebook)</p>
              <p className="text-[11px] text-muted-foreground">
                Rastreia PageView, eventos e conversões automaticamente.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      <Card className="border-border/40 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <Facebook className="h-4 w-4 text-[#1877F2]" />
            Configuração do Facebook Pixel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">ID do Pixel</Label>
            <div className="flex gap-2">
              {isLoading ? (
                <div className="flex-1 h-9 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Input
                  placeholder="ex: 1234567890123456"
                  value={displayValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 font-mono text-sm"
                  maxLength={20}
                />
              )}
              <Button
                size="sm"
                className="gap-1.5"
                disabled={!hasChanges || saveMutation.isPending}
                onClick={() => saveMutation.mutate(displayValue)}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Salvar
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Encontre o ID do Pixel em{" "}
              <a
                href="https://business.facebook.com/events_manager"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                Meta Events Manager
              </a>{" "}
              → Fontes de Dados → seu Pixel → Configurações.
            </p>
          </div>

          {isActive && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <p className="text-[11px] text-emerald-400 font-medium mb-1">✓ Pixel ativo</p>
              <p className="text-[11px] text-muted-foreground">
                O Pixel está injetado em todas as páginas. Eventos rastreados automaticamente:
                <strong> PageView</strong> (toda navegação).
                Você pode adicionar eventos customizados (Purchase, Lead, etc.) no código do checkout.
              </p>
            </div>
          )}

          {/* Info */}
          <div className="rounded-lg border border-border/40 bg-secondary/10 p-3 flex gap-2">
            <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground">
                Deixe o campo vazio e salve para <strong>remover</strong> o pixel do site.
              </p>
              <p className="text-[11px] text-muted-foreground">
                Após salvar, o pixel é carregado automaticamente em todas as páginas — nenhuma
                alteração de código é necessária.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview of the code injected */}
      {isActive && (
        <Card className="border-border/40 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Código injetado automaticamente</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-[10px] font-mono text-muted-foreground bg-secondary/20 rounded p-3 overflow-x-auto whitespace-pre-wrap">
{`<!-- Meta Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s){...}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${pixelId}');
  fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>
</noscript>
<!-- End Meta Pixel Code -->`}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
