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
  ShieldCheck,
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

const PIX_POLL_INTERVAL = 5_000;
const PIX_POLL_TIMEOUT = 30 * 60_000;

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
    <div
      className="fixed inset-0 z-[80] overflow-y-auto px-4 py-6 animate-fade-in"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.65)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
    >
      <div className="flex min-h-full items-start justify-center sm:items-center">
        <div
          className="relative w-full max-w-md animate-scale-in"
          style={{
            background: "linear-gradient(180deg, #111827 0%, #0B0F14 100%)",
            border: "1px solid rgba(99,102,241,0.1)",
            borderRadius: "20px",
            padding: "0",
            boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03), 0 0 80px rgba(99,102,241,0.06)",
          }}
        >
          {/* Top accent line */}
          <div
            style={{
              height: "2px",
              background: "linear-gradient(90deg, transparent 0%, #6366F1 30%, #06B6D4 70%, transparent 100%)",
              borderRadius: "20px 20px 0 0",
              opacity: 0.6,
            }}
          />

          <div style={{ padding: "24px 24px 20px" }}>
          {/* Close */}
          <button
            type="button"
            aria-label="Fechar checkout"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-5 rounded-full p-1.5 opacity-40 transition-all duration-200 hover:opacity-90 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          >
            <X className="h-4 w-4 text-white" />
          </button>

          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(99,102,241,0.12)" }}>
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
              </div>
              <h2
                className="text-[17px] font-semibold tracking-tight text-white"
                style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}
              >
                Finalizar Compra
              </h2>
            </div>
            <p className="text-[11px] text-white/25 ml-8">Pagamento seguro e criptografado</p>
          </div>

          {/* Summary */}
          <div
            className="rounded-xl p-3.5 mb-5"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-0.5 flex-1 min-w-0">
                <p className="text-[13px] font-medium text-white/90 truncate">
                  {product.name}
                </p>
                {variantName && (
                  <p className="text-[11px] text-white/30">{variantName}</p>
                )}
                <p className="text-[11px] text-white/25">
                  {quantity}× R$ {unitPrice.toFixed(2).replace(".", ",")}
                </p>
              </div>
              <p
                className="text-xl font-bold shrink-0 ml-3"
                style={{
                  fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                  background: "linear-gradient(135deg, #A5B4FC, #22D3EE)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                R$ {totalAmount.toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>

          {/* Tab switcher */}
          <div
            className="grid grid-cols-2 gap-1 rounded-xl p-1 mb-5"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            {(["pix", "card"] as const).map((t) => {
              const isActive = tab === t;
              const Icon = t === "pix" ? QrCode : CreditCard;
              const label = t === "pix" ? "PIX" : "Cartão";
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-lg text-[12px] font-medium transition-all duration-200"
                  style={
                    isActive
                      ? {
                          background: "rgba(79,70,229,0.15)",
                          border: "1px solid rgba(79,70,229,0.25)",
                          color: "#A5B4FC",
                          boxShadow: "0 0 12px rgba(79,70,229,0.1)",
                        }
                      : {
                          background: "transparent",
                          border: "1px solid transparent",
                          color: "rgba(255,255,255,0.35)",
                        }
                  }
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              );
            })}
          </div>

          {/* ── PIX tab ── */}
          <div style={{ display: tab === "pix" ? "block" : "none" }}>
            <div className="space-y-3">
              {!pixQrCode ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-white/50">E-mail</Label>
                    <Input
                      value={payerEmail}
                      onChange={(e) => setPayerEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="h-9 text-[13px] bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/20 rounded-lg focus:border-indigo-500/40 focus:ring-indigo-500/20"
                    />
                  </div>
                  <button
                    onClick={handlePixPayment}
                    disabled={processingPix || !payerEmail}
                    className="w-full h-11 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-all duration-250 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(135deg, #4F46E5, #06B6D4)",
                      boxShadow: processingPix ? "none" : "0 8px 24px rgba(79,70,229,0.35)",
                    }}
                    onMouseEnter={(e) => {
                      if (!processingPix) {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 12px 32px rgba(79,70,229,0.45)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(79,70,229,0.35)";
                    }}
                  >
                    {processingPix ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                    {processingPix ? "Gerando PIX…" : "Gerar QR Code PIX"}
                  </button>
                </>
              ) : (
                <div className="space-y-3 text-center">
                  {/* Status badges */}
                  {pixStatus === "approved" && (
                    <div className="flex items-center justify-center gap-2 rounded-xl p-3 text-[12px] font-semibold" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34D399" }}>
                      <CheckCircle2 className="h-4 w-4" /> Pagamento aprovado!
                    </div>
                  )}
                  {pixStatus === "rejected" && (
                    <div className="flex items-center justify-center gap-2 rounded-xl p-3 text-[12px] font-semibold" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}>
                      <XCircle className="h-4 w-4" /> Pagamento recusado
                    </div>
                  )}
                  {pixStatus === "cancelled" && (
                    <div className="flex items-center justify-center gap-2 rounded-xl p-3 text-[12px] font-semibold" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#F87171" }}>
                      <XCircle className="h-4 w-4" /> Pagamento cancelado
                    </div>
                  )}
                  {pixStatus === "expired" && (
                    <div className="flex items-center justify-center gap-2 rounded-xl p-3 text-[12px] font-semibold" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#FBBF24" }}>
                      <Clock className="h-4 w-4" /> Código PIX expirado
                    </div>
                  )}

                  {pixStatus === "pending" && (
                    <>
                      <p className="text-[12px] text-white/40">Escaneie o QR Code ou copie o código:</p>
                      {pixQrBase64 && (
                        <div className="flex justify-center">
                          <div className="rounded-xl p-3" style={{ background: "white" }}>
                            <img
                              src={`data:image/png;base64,${pixQrBase64}`}
                              alt="QR Code PIX"
                              className="h-44 w-44"
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input value={pixQrCode || ""} readOnly className="h-8 flex-1 font-mono text-[9px] bg-white/[0.03] border-white/[0.06] text-white/60" />
                        <Button size="sm" variant="outline" onClick={copyPixCode} className="h-8 gap-1 text-[10px] border-white/[0.08] hover:bg-white/[0.05]">
                          {pixCopied ? <CheckCircle2 className="h-3 w-3 text-cyan-400" /> : <Copy className="h-3 w-3" />}
                          {pixCopied ? "Copiado" : "Copiar"}
                        </Button>
                      </div>
                      <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/30">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Aguardando confirmação…
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Card tab ── */}
          <div style={{ display: tab === "card" ? "block" : "none" }}>
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

          {/* Footer */}
          <div className="mt-5 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-white/15" />
            <p className="text-[10px] text-white/15 tracking-wide">
              Pagamento processado com segurança pelo Mercado Pago
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
