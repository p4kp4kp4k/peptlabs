import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  reason?: string;
  upgradeTo?: "pro";
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
          <DialogTitle className="text-lg font-bold font-display">
            Funcionalidade PRO
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {reason || "Esta funcionalidade está disponível apenas para membros PRO."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-xl border border-accent/10 bg-accent/5 p-4 space-y-2">
          <p className="text-xs font-semibold text-accent">
            PRO inclui:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>✓ Biblioteca completa (78+ peptídeos)</li>
            <li>✓ Protocolos e comparações ilimitados</li>
            <li>✓ Calculadora avançada + presets</li>
            <li>✓ Stack Builder PRO</li>
            <li>✓ Histórico e export ilimitados</li>
            <li>✓ Body Map interativo</li>
            <li>✓ Suporte prioritário</li>
          </ul>
        </div>

        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
          <p className="text-[11px] text-emerald-400 font-medium">
            💡 PRO Vitalício: R$ 397 único — pague uma vez, use para sempre + contato com fornecedores
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1 gap-2"
            onClick={() => { onClose(); navigate("/app/billing"); }}
          >
            <Crown className="h-4 w-4" /> Ver Planos
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={onClose}>Voltar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
