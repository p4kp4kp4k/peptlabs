import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      navigate("/auth");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha atualizada!", description: "Você será redirecionado." });
      setTimeout(() => navigate("/"), 1500);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <FlaskConical className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Nova Senha</h1>
          <p className="mt-1 text-xs text-muted-foreground">Digite sua nova senha abaixo</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="password" placeholder="Nova senha (mín. 6 caracteres)" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-card border-border/50" />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? "Salvando..." : <>Salvar Nova Senha <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>
      </div>
    </div>
  );
}
