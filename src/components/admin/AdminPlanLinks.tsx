import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Link2, Save, Loader2, Plus, Trash2, ExternalLink, Info } from "lucide-react";
import { toast } from "sonner";

interface PlanLink {
  id: string;
  plan_id: string;
  label: string;
  checkout_url: string;
  is_active: boolean;
  kiwify_product_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminPlanLinks() {
  const queryClient = useQueryClient();
  const [newPlanId, setNewPlanId] = useState("");
  const [newLabel, setNewLabel] = useState("");

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["admin-plan-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_links")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as PlanLink[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (link: Partial<PlanLink> & { id: string }) => {
      const { error } = await supabase
        .from("plan_links")
        .update({
          checkout_url: link.checkout_url,
          label: link.label,
          is_active: link.is_active,
          kiwify_product_id: link.kiwify_product_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", link.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Link atualizado");
      queryClient.invalidateQueries({ queryKey: ["admin-plan-links"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("plan_links").insert({
        plan_id: newPlanId || "custom",
        label: newLabel || "Novo Plano",
        checkout_url: "",
        is_active: false,
        kiwify_product_id: null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Link adicionado");
      setNewPlanId("");
      setNewLabel("");
      queryClient.invalidateQueries({ queryKey: ["admin-plan-links"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plan_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Link removido");
      queryClient.invalidateQueries({ queryKey: ["admin-plan-links"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Kiwify info card */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4 flex gap-3">
          <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-blue-300">Integração Kiwify</p>
            <p className="text-[11px] text-muted-foreground">
              Configure o <strong>ID do Produto Kiwify</strong> em cada plano para que o sistema
              identifique automaticamente qual plano liberar ao receber um webhook da Kiwify.
              O ID do produto está disponível no painel da Kiwify em <em>Produtos → [seu produto] → ID</em>.
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              <strong>URL do webhook Kiwify:</strong>{" "}
              <code className="text-[10px] bg-muted/40 px-1 py-0.5 rounded font-mono">
                {`${window.location.origin.replace("3000", "54321")}/functions/v1/kiwify-webhook`}
              </code>
              {" "}— configure em <em>Kiwify → Webhooks</em>.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <Link2 className="h-4 w-4 text-primary" />
            Links de Checkout dos Planos
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            Configure os links de pagamento para cada plano. Quando um link estiver ativo, o botão de checkout
            redirecionará diretamente para a URL configurada.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {links.map((link) => (
            <PlanLinkRow
              key={link.id}
              link={link}
              onSave={(updated) => updateMutation.mutate({ id: link.id, ...updated })}
              onDelete={() => {
                if (confirm(`Remover link "${link.label}"?`)) {
                  deleteMutation.mutate(link.id);
                }
              }}
              isSaving={updateMutation.isPending}
            />
          ))}

          {links.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum link configurado.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add new */}
      <Card className="border-border/40 bg-card/80 border-dashed">
        <CardContent className="p-4">
          <p className="text-xs font-medium text-foreground mb-3">Adicionar novo link</p>
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-[10px]">ID do Plano</Label>
              <Input
                placeholder="ex: pro_monthly"
                value={newPlanId}
                onChange={(e) => setNewPlanId(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-[10px]">Nome</Label>
              <Input
                placeholder="ex: PRO Mensal"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <Button
              size="sm"
              className="h-8 gap-1 text-xs"
              onClick={() => addMutation.mutate()}
              disabled={addMutation.isPending}
            >
              {addMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlanLinkRow({
  link,
  onSave,
  onDelete,
  isSaving,
}: {
  link: PlanLink;
  onSave: (updated: Partial<PlanLink>) => void;
  onDelete: () => void;
  isSaving: boolean;
}) {
  const [url, setUrl] = useState(link.checkout_url);
  const [label, setLabel] = useState(link.label);
  const [active, setActive] = useState(link.is_active);
  const [kiwifyId, setKiwifyId] = useState(link.kiwify_product_id ?? "");

  const hasChanges =
    url !== link.checkout_url ||
    label !== link.label ||
    active !== link.is_active ||
    kiwifyId !== (link.kiwify_product_id ?? "");

  return (
    <div className="rounded-lg border border-border/40 bg-secondary/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px] font-mono">
            {link.plan_id}
          </Badge>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="h-7 text-xs font-medium w-40 bg-transparent border-none px-1 focus-visible:ring-1"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">Ativo</span>
            <Switch
              checked={active}
              onCheckedChange={setActive}
              className="scale-75"
            />
          </div>
          <Badge className={`text-[9px] ${active ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" : "bg-muted/30 text-muted-foreground"}`}>
            {active ? "ON" : "OFF"}
          </Badge>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">URL de Checkout (Kiwify)</Label>
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://pay.kiwify.com.br/..."
            className="h-8 text-xs font-mono flex-1"
          />
          {url && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => window.open(url, "_blank")}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-[10px] text-muted-foreground">
          ID do Produto Kiwify
          <span className="ml-1 text-muted-foreground/60">(para mapeamento automático do webhook)</span>
        </Label>
        <Input
          value={kiwifyId}
          onChange={(e) => setKiwifyId(e.target.value)}
          placeholder="ex: prod_AbCdEfGhIj"
          className="h-8 text-xs font-mono"
        />
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] text-destructive hover:text-destructive gap-1"
          onClick={onDelete}
        >
          <Trash2 className="h-3 w-3" /> Remover
        </Button>

        <Button
          size="sm"
          className="h-7 text-[10px] gap-1"
          disabled={!hasChanges || isSaving}
          onClick={() =>
            onSave({ checkout_url: url, label, is_active: active, kiwify_product_id: kiwifyId || null })
          }
        >
          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}
