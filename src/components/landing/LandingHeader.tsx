import { useNavigate } from "react-router-dom";
import { FlaskConical, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const LandingHeader = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-2xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <FlaskConical className="h-4 w-4 text-primary" />
          </div>
          <span className="text-base font-bold tracking-tight font-display">
            Pepti<span className="text-gradient-primary">Lab</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Button size="sm" className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90" onClick={() => navigate("/app/dashboard")}>
              Meu Painel <ArrowRight className="h-3 w-3" />
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="text-xs h-9 text-muted-foreground hover:text-foreground" onClick={() => navigate("/auth")}>
                Entrar
              </Button>
              <Button size="sm" className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" onClick={() => navigate("/auth")}>
                Criar Conta <ArrowRight className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
