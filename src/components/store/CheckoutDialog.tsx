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
  Lock,
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
      className="fixed inset-0 z-[80] overflow-y-auto px-4 py-6"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.72)",
        animation: "checkout-fade-in 0.2s ease-out",
      }}
    >
      <style>{`
        @keyframes checkout-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes checkout-slide-up {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .checkout-modal-inner {
          padding: 28px 28px 24px;
        }
        .checkout-card-container {
          padding: 24px;
          border-radius: 20px;
        }
        @media (max-width: 480px) {
          .checkout-modal-inner {
            padding: 20px 16px 18px;
          }
          .checkout-card-container {
            padding: 14px;
            border-radius: 14px;
          }
        }
      `}</style>

      <div className="flex min-h-full items-start justify-center sm:items-center">
        <div
          className="relative w-full max-w-[420px] box-border"
          style={{
            background: "#0A0E13",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "22px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.02)",
            animation: "checkout-slide-up 0.3s ease-out",
          }}
        >
          {/* Top accent — thin gradient line */}
          <div
            style={{
              height: "1px",
              background: "linear-gradient(90deg, transparent 5%, rgba(99,102,241,0.4) 35%, rgba(6,182,212,0.35) 65%, transparent 95%)",
              borderRadius: "22px 22px 0 0",
            }}
          />

          <div className="checkout-modal-inner">
            {/* Close button */}
            <button
              type="button"
              aria-label="Fechar checkout"
              onClick={() => onOpenChange(false)}
              className="absolute right-5 top-6 rounded-full p-1.5 transition-all duration-200 hover:bg-white/5 focus:outline-none"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2
                className="text-[18px] font-semibold tracking-[-0.02em] text-white"
                style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}
              >
                Finalizar Compra
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.22)" }}>
                Pagamento seguro e criptografado
              </p>
            </div>

            {/* Order summary */}
            <div
              className="rounded-2xl p-4 mb-6"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white/90 truncate leading-tight">
                    {product.name}
                  </p>
                  {variantName && (
                    <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.28)" }}>{variantName}</p>
                  )}
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                    {quantity}× R$ {unitPrice.toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.18)" }}>
                    Total
                  </p>
                  <p
                    className="text-[22px] font-bold leading-none"
                    style={{
                      fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
                      color: "#22D3EE",
                    }}
                  >
                    R$ {totalAmount.toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab switcher */}
            <div
              className="grid grid-cols-2 gap-1.5 rounded-2xl p-1.5 mb-6"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.03)" }}
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
                    className="flex h-10 items-center justify-center gap-2 rounded-xl text-[12px] font-semibold transition-all duration-200"
                    style={
                      isActive
                        ? {
                            background: "rgba(99,102,241,0.12)",
                            border: "1px solid rgba(99,102,241,0.2)",
                            color: "#A5B4FC",
                            boxShadow: "0 0 16px rgba(99,102,241,0.08)",
                          }
                        : {
                            background: "transparent",
                            border: "1px solid transparent",
                            color: "rgba(255,255,255,0.3)",
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
                      <Label className="text-[11px] text-white/40 font-medium">E-mail</Label>
                      <Input
                        value={payerEmail}
                        onChange={(e) => setPayerEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="h-10 text-[13px] bg-white/[0.03] border-white/[0.06] text-white placeholder:text-white/15 rounded-xl focus:border-indigo-500/40 focus:ring-indigo-500/20"
                      />
                    </div>
                    <button
                      onClick={handlePixPayment}
                      disabled={processingPix || !payerEmail}
                      className="w-full h-11 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: "linear-gradient(135deg, #4F46E5, #06B6D4)",
                        boxShadow: processingPix ? "none" : "0 6px 20px rgba(79,70,229,0.3)",
                      }}
                      onMouseEnter={(e) => {
                        if (!processingPix) {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 10px 28px rgba(79,70,229,0.4)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(79,70,229,0.3)";
                      }}
                    >
                      {processingPix ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                      {processingPix ? "Gerando PIX…" : "Gerar QR Code PIX"}
                    </button>
                  </>
                ) : (
                  <div className="space-y-3 text-center">
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
                        <p className="text-[12px] text-white/35">Escaneie o QR Code ou copie o código:</p>
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
                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/25">
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
              {/* Premium payment card container */}
              <div
                className="checkout-card-container"
                style={{
                  background: "linear-gradient(180deg, #0B1220 0%, #0A0F1A 100%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.03)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Top edge glow */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "10%",
                    right: "10%",
                    height: "1px",
                    background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.25), rgba(6,182,212,0.2), transparent)",
                  }}
                />

                {/* Section header */}
                <div className="flex items-center gap-2.5 mb-5">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "rgba(99,102,241,0.08)",
                      border: "1px solid rgba(99,102,241,0.12)",
                    }}
                  >
                    <Lock className="h-3.5 w-3.5" style={{ color: "#818CF8" }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-white/90" style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}>
                      Dados do cartão
                    </p>
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                      Ambiente seguro • Criptografia TLS
                    </p>
                  </div>
                </div>

                {/* Brick wrapper */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.015)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    borderRadius: "16px",
                    padding: "4px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.015)",
                  }}
                >
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

                {/* Bottom trust badges */}
                <div className="flex items-center justify-center gap-4 mt-5">
                  {[
                    { icon: ShieldCheck, text: "SSL 256-bit" },
                    { icon: Lock, text: "PCI DSS" },
                  ].map(({ icon: Ic, text }) => (
                    <div key={text} className="flex items-center gap-1">
                      <Ic className="h-3 w-3" style={{ color: "rgba(255,255,255,0.12)" }} />
                      <span className="text-[9px] font-medium tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.15)" }}>
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="mt-6 pt-4 flex items-center justify-center gap-1.5"
              style={{ borderTop: "1px solid rgba(255,255,255,0.035)" }}
            >
              <ShieldCheck className="h-3 w-3" style={{ color: "rgba(255,255,255,0.1)" }} />
              <p className="text-[10px] tracking-wide" style={{ color: "rgba(255,255,255,0.12)" }}>
                Pagamento processado com segurança pelo Mercado Pago
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
