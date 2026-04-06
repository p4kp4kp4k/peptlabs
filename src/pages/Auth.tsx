import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

type Mode = "login" | "register" | "forgot";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate("/");
      } else if (mode === "register") {
        const { error } = await signUp(email, password, displayName);
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar o cadastro." });
        setMode("login");
      } else {
        const { error } = await resetPassword(email);
        if (error) throw error;
        toast({ title: "E-mail enviado", description: "Verifique sua caixa de entrada para redefinir a senha." });
        setMode("login");
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Algo deu errado.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <FlaskConical className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Peptídeos<span className="text-primary">Health</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {mode === "login" && "Entre na sua conta"}
            {mode === "register" && "Crie sua conta gratuita"}
            {mode === "forgot" && "Recupere sua senha"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Nome" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-10 bg-card border-border/50" />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="email" placeholder="E-mail" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-card border-border/50" />
          </div>
          {mode !== "forgot" && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-card border-border/50"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? "Carregando..." : (
              <>
                {mode === "login" && "Entrar"}
                {mode === "register" && "Criar Conta"}
                {mode === "forgot" && "Enviar Link"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 space-y-2 text-center text-xs text-muted-foreground">
          {mode === "login" && (
            <>
              <button onClick={() => setMode("forgot")} className="hover:text-primary">Esqueceu a senha?</button>
              <p>Não tem conta? <button onClick={() => setMode("register")} className="font-medium text-primary hover:underline">Criar conta</button></p>
            </>
          )}
          {mode === "register" && (
            <p>Já tem conta? <button onClick={() => setMode("login")} className="font-medium text-primary hover:underline">Entrar</button></p>
          )}
          {mode === "forgot" && (
            <p><button onClick={() => setMode("login")} className="font-medium text-primary hover:underline">Voltar ao login</button></p>
          )}
        </div>
      </div>
    </div>
  );
}
