import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  QrCode,
  X,
  XCircle,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MercadoPagoCardSection from "@/components/store/MercadoPagoCardSection";

/* ─── Types ─── */

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: { id: string; name: string };
  variantId: string | null;
  variantName: string | null;
  unitPrice: number;
  quantity: number;
  publicKey: string | null;
}

interface CheckoutFunctionResponse {
  ok?: boolean;
  error?: string;
  details?: string;
  orderId?: string;
  localOrderId?: string;
  status?: string;
  pix?: { qrCode?: string; qrCodeBase64?: string };
}

/* ─── Constants ─── */

const PIX_POLL_INTERVAL = 5_000; // 5 s
const PIX_POLL_TIMEOUT = 30 * 60_000; // 30 min

/* ─── Component ─── */

export default function CheckoutDialog({
  open,
  onOpenChange,
  product,
  variantId,
  variantName,
  unitPrice,
  quantity,
  publicKey,
}: CheckoutDialogProps) {
  const { toast } = useToast();
  const totalAmount = unitPrice * quantity;

  const [tab, setTab] = useState<"pix" | "card">("pix");
  const [processingPix, setProcessingPix] = useState(false);
  const [payerEmail, setPayerEmail] = useState("");

  /* PIX result */
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixQrBase64, setPixQrBase64] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState(false);

  /* PIX polling */
  const [localOrderId, setLocalOrderId] = useState<string | null>(null);
  const [pixStatus, setPixStatus] = useState<"pending" | "approved" | "cancelled" | "rejected" | "expired">("pending");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Pre-fill email */
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setPayerEmail(data.user.email);
    });
  }, []);

  /* Reset when dialog closes */
  useEffect(() => {
    if (!open) {
      setTab("pix");
      setProcessingPix(false);
      setPixQrCode(null);
      setPixQrBase64(null);
      setPixCopied(false);
      setLocalOrderId(null);
      setPixStatus("pending");
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [open]);

  /* ── PIX polling ── */
  useEffect(() => {
    if (!localOrderId || pixStatus !== "pending") return;

    const poll = async () => {
      try {
        const { data } = await supabase
          .from("orders")
          .select("payment_status")
          .eq("id", localOrderId)
          .single();

        if (data && data.payment_status !== "pending") {
          const s = data.payment_status;
          if (s === "approved") setPixStatus("approved");
          else if (s === "cancelled") setPixStatus("cancelled");
          else if (s === "rejected") setPixStatus("rejected");
          else setPixStatus("expired");
        }
      } catch {
        /* ignore transient errors */
      }
    };

    pollRef.current = setInterval(poll, PIX_POLL_INTERVAL);
    timeoutRef.current = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current);
      setPixStatus((prev) => (prev === "pending" ? "expired" : prev));
    }, PIX_POLL_TIMEOUT);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [localOrderId, pixStatus]);

  /* ── Handlers ── */

  const getErrorMessage = (data: CheckoutFunctionResponse | null | undefined, fallback: string) => {
    if (!data) return fallback;
    return data.details || data.error || fallback;
  };

  const handlePixPayment = async () => {
    setProcessingPix(true);
    setPixQrCode(null);
    setPixQrBase64(null);
    setLocalOrderId(null);
    setPixStatus("pending");

    try {
      const res = await supabase.functions.invoke("create-mp-checkout", {
        body: {
          productId: product.id,
          variantId,
          quantity,
          paymentMethod: "pix",
          payerEmail,
        },
      });

      if (res.error) throw new Error(res.error.message);
      const data = (res.data ?? null) as CheckoutFunctionResponse | null;

      if (data?.ok === false) {
        throw new Error(getErrorMessage(data, "Não foi possível gerar o PIX."));
      }

      if (data?.pix?.qrCode) {
        setPixQrCode(data.pix.qrCode);
        setPixQrBase64(data.pix.qrCodeBase64 || null);
        setLocalOrderId(data.localOrderId || null);
      } else {
        toast({ title: "PIX gerado", description: `Pedido: ${data?.orderId} — Status: ${data?.status}` });
      }
    } catch (error: any) {
      toast({ title: "Erro no PIX", description: error.message, variant: "destructive" });
    } finally {
      setProcessingPix(false);
    }
  };

  const copyPixCode = () => {
    if (!pixQrCode) return;
    navigator.clipboard.writeText(pixQrCode);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
  };

  /* ── Render ── */

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-background/60 px-4 py-6">
      <div className="flex min-h-full items-start justify-center sm:items-center">
        <div className="relative w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
          {/* Close */}
          <button
            type="button"
            aria-label="Fechar checkout"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="mb-4">
            <h2 className="text-base font-semibold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Finalizar Compra
            </h2>
          </div>

          {/* Summary */}
          <div className="rounded-md border border-border/40 bg-secondary/20 p-3 space-y-1">
            <p className="text-xs font-medium text-foreground">
              {product.name}
              {variantName ? ` — ${variantName}` : ""}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {quantity}x R$ {unitPrice.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-sm font-bold text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Total: R$ {totalAmount.toFixed(2).replace(".", ",")}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="mt-4 grid grid-cols-2 rounded-md bg-secondary/60 p-0.5">
            <button
              type="button"
              onClick={() => setTab("pix")}
              className={`flex h-8 items-center justify-center gap-1.5 rounded-sm text-[11px] font-medium transition-all ${
                tab === "pix" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <QrCode className="h-3.5 w-3.5" /> PIX
            </button>
            <button
              type="button"
              onClick={() => setTab("card")}
              className={`flex h-8 items-center justify-center gap-1.5 rounded-sm text-[11px] font-medium transition-all ${
                tab === "card" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" /> Cartão
            </button>
          </div>

          {/* ── PIX tab ── */}
          <div className="mt-3" style={{ display: tab === "pix" ? "block" : "none" }}>
            <div className="space-y-3">
              {!pixQrCode ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs">E-mail</Label>
                    <Input
                      value={payerEmail}
                      onChange={(e) => setPayerEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="h-8 text-xs"
                    />
                  </div>
                  <Button onClick={handlePixPayment} disabled={processingPix || !payerEmail} className="w-full gap-2 text-xs">
                    {processingPix ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <QrCode className="h-3.5 w-3.5" />}
                    {processingPix ? "Gerando PIX…" : "Gerar QR Code PIX"}
                  </Button>
                </>
              ) : (
                <div className="space-y-3 text-center">
                  {/* Status badges */}
                  {pixStatus === "approved" && (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Pagamento aprovado!
                    </div>
                  )}
                  {pixStatus === "rejected" && (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                      <XCircle className="h-4 w-4" /> Pagamento recusado
                    </div>
                  )}
                  {pixStatus === "cancelled" && (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
                      <XCircle className="h-4 w-4" /> Pagamento cancelado
                    </div>
                  )}
                  {pixStatus === "expired" && (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-semibold text-amber-400">
                      <Clock className="h-4 w-4" /> Código PIX expirado
                    </div>
                  )}

                  {pixStatus === "pending" && (
                    <>
                      <p className="text-xs text-muted-foreground">Escaneie o QR Code ou copie o código:</p>
                      {pixQrBase64 && (
                        <div className="flex justify-center">
                          <img
                            src={`data:image/png;base64,${pixQrBase64}`}
                            alt="QR Code PIX"
                            className="h-48 w-48 rounded-md border border-border"
                          />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input value={pixQrCode || ""} readOnly className="h-8 flex-1 font-mono text-[9px]" />
                        <Button size="sm" variant="outline" onClick={copyPixCode} className="h-8 gap-1 text-[10px]">
                          {pixCopied ? <CheckCircle2 className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                          {pixCopied ? "Copiado" : "Copiar"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Aguardando confirmação do pagamento…
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Card tab ── */}
          <div className="mt-3" style={{ display: tab === "card" ? "block" : "none" }}>
            <MercadoPagoCardSection
              active={tab === "card"}
              open={open}
              publicKey={publicKey}
              productId={product.id}
              variantId={variantId}
              quantity={quantity}
              totalAmount={totalAmount}
              initialEmail={payerEmail}
            />
          </div>

          <p className="mt-4 text-center text-[9px] text-muted-foreground/50">
            Pagamento processado com segurança pelo Mercado Pago
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
