import { useState } from "react";
import { Settings as SettingsIcon, User, Bell, Shield, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Perfil atualizado!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Configurações</h1>
        </div>
        <p className="text-sm text-muted-foreground">Gerencie seu perfil e preferências.</p>
      </div>

      {/* Profile */}
      <Card className="mb-4 border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-primary" /> Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">E-mail</Label>
            <Input value={user?.email || ""} disabled className="mt-1 bg-secondary/30 text-xs" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Nome de exibição</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-1 text-xs"
              placeholder="Seu nome"
            />
          </div>
          <Button size="sm" className="gap-1.5 text-xs" onClick={handleSaveProfile} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Salvar
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="mb-4 border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bell className="h-4 w-4 text-primary" /> Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground">E-mails de atualizações</p>
              <p className="text-[10px] text-muted-foreground">Novos peptídeos e protocolos</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground">Dicas semanais</p>
              <p className="text-[10px] text-muted-foreground">Resumo semanal de conteúdo</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-primary" /> Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => {
            supabase.auth.resetPasswordForEmail(user?.email || "", {
              redirectTo: `${window.location.origin}/reset-password`,
            });
            toast({ title: "E-mail enviado", description: "Verifique sua caixa de entrada." });
          }}>
            Alterar Senha
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
