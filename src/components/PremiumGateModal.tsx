import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  reason?: string;
  upgradeTo?: "starter" | "pro";
}

export default function PremiumGateModal({ open, onClose, reason, upgradeTo = "pro" }: Props) {
  const navigate = useNavigate();
  const isPro = upgradeTo === "pro";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md border-accent/20 bg-card">
        <DialogHeader className="items-center text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            {isPro ? <Crown className="h-7 w-7 text-accent" /> : <Zap className="h-7 w-7 text-accent" />}
          </div>
          <DialogTitle className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {isPro ? "Funcionalidade PRO" : "Limite do Plano Atingido"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {reason || (isPro
              ? "Esta funcionalidade está disponível apenas no plano PRO."
              : "Você atingiu o limite do seu plano. Faça upgrade para continuar.")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-xl border border-accent/10 bg-accent/5 p-4 space-y-2">
          <p className="text-xs font-semibold text-accent">
            {isPro ? "PRO inclui:" : "Starter inclui:"}
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {isPro ? (
              <>
                <li>✓ Biblioteca completa (peptídeos avançados)</li>
                <li>✓ Protocolos ilimitados</li>
                <li>✓ Comparador ilimitado</li>
                <li>✓ Stack Builder PRO completo</li>
                <li>✓ Calculadora avançada + presets</li>
                <li>✓ Histórico ilimitado</li>
                <li>✓ Export PRO (PDF premium)</li>
                <li>✓ Contato direto com fornecedores</li>
              </>
            ) : (
              <>
                <li>✓ Biblioteca essencial de peptídeos</li>
                <li>✓ Até 3 protocolos/mês</li>
                <li>✓ Comparador (até 5 peptídeos)</li>
                <li>✓ Calculadora ilimitada</li>
                <li>✓ Stacks ilimitados</li>
                <li>✓ Histórico de 7 dias</li>
                <li>✓ Verificação de interações ilimitada</li>
              </>
            )}
          </ul>
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
