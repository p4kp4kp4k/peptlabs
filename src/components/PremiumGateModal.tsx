import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  reason?: string;
}

export default function PremiumGateModal({ open, onClose, reason }: Props) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md border-accent/20 bg-card">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <Crown className="h-7 w-7 text-accent" />
          </div>
          <DialogTitle
            className="text-lg font-bold"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Limite do Plano Gratuito
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {reason || "Você atingiu o limite do plano gratuito. Faça upgrade para continuar."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-xl border border-accent/10 bg-accent/5 p-4 space-y-2">
          <p className="text-xs font-semibold text-accent">Premium inclui:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>✓ Protocolos ilimitados</li>
            <li>✓ Stacks ilimitados</li>
            <li>✓ Calculadora sem limites</li>
            <li>✓ Engine IA completa</li>
            <li>✓ Histórico ilimitado</li>
          </ul>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1 gap-2"
            onClick={() => {
              onClose();
              navigate("/app/billing");
            }}
          >
            <Crown className="h-4 w-4" /> Fazer Upgrade
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={onClose}>
            Voltar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
