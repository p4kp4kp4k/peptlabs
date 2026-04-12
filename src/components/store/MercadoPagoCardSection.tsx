import { useEffect, useRef, useState, useCallback } from "react";
import { CheckCircle2, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface MercadoPagoCardSectionProps {
  active: boolean;
  open: boolean;
  publicKey: string | null;
  productId: string;
  variantId: string | null;
  quantity: number;
  totalAmount: number;
  initialEmail?: string;
}

interface CheckoutFunctionResponse {
  ok?: boolean;
  error?: string;
  details?: string;
  orderId?: string;
  status?: string;
  card?: {
    status?: string;
    statusDetail?: string;
  };
}

const BRICK_CONTAINER_ID = "mp-card-payment-brick-container";
const BRICK_READY_TIMEOUT = 20_000;

const log = (step: string, ...args: any[]) =>
  console.log(`[MP-Brick] ${step}`, ...args);

export default function MercadoPagoCardSection({
  active,
  open,
  publicKey,
  productId,
  variantId,
  quantity,
  totalAmount,
  initialEmail,
}: MercadoPagoCardSectionProps) {
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [brickReady, setBrickReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cardResult, setCardResult] = useState<CheckoutFunctionResponse | null>(null);
  const [mountError, setMountError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const mpInstanceRef = useRef<any>(null);
  const brickControllerRef = useRef<any>(null);
  const mountIdRef = useRef(0);
  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const productIdRef = useRef(productId);
  productIdRef.current = productId;
  const variantIdRef = useRef(variantId);
  variantIdRef.current = variantId;
  const quantityRef = useRef(quantity);
  quantityRef.current = quantity;
  const emailRef = useRef(initialEmail);
  emailRef.current = initialEmail;

  const clearReadyTimeout = useCallback(() => {
    if (readyTimeoutRef.current) {
      clearTimeout(readyTimeoutRef.current);
      readyTimeoutRef.current = null;
    }
  }, []);

  const destroyBrick = useCallback(async () => {
    log("destroyBrick", "starting cleanup");
    clearReadyTimeout();
    setBrickReady(false);
    if (brickControllerRef.current?.unmount) {
      try {
        await brickControllerRef.current.unmount();
        log("destroyBrick", "unmount OK");
      } catch (e) {
        log("destroyBrick", "unmount error (ignored)", e);
      }
    }
    brickControllerRef.current = null;
    const el = document.getElementById(BRICK_CONTAINER_ID);
    if (el) el.innerHTML = "";
  }, [clearReadyTimeout]);

  useEffect(() => {
    if (!open) {
      log("dialog-closed", "resetting state");
      setCardResult(null);
      setProcessing(false);
      setMountError(null);
      setRetryCount(0);
      void destroyBrick();
      mpInstanceRef.current = null;
    }
  }, [open, destroyBrick]);

  useEffect(() => {
    if (!open || !active || !publicKey) {
      log("effect-guard", { open, active, hasPublicKey: !!publicKey });
      return;
    }

    let cancelled = false;
    const mountId = ++mountIdRef.current;

    log("effect-start", { mountId, publicKey: publicKey.substring(0, 20) + "...", totalAmount });

    const run = async () => {
      log("step-1", "checking SDK availability");
      if (typeof window.MercadoPago === "undefined") {
        let waited = 0;
        while (typeof window.MercadoPago === "undefined" && waited < 8000) {
          await new Promise((r) => setTimeout(r, 300));
          waited += 300;
        }
        if (typeof window.MercadoPago === "undefined") {
          log("step-1", "SDK NOT found after 8s");
          if (!cancelled) setMountError("SDK do Mercado Pago não carregou. Recarregue a página.");
          return;
        }
      }
      log("step-1", "SDK found ✓", typeof window.MercadoPago);
      if (cancelled || mountId !== mountIdRef.current) return;

      log("step-2", "creating MP instance");
      try {
        mpInstanceRef.current = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        log("step-2", "MP instance created ✓");
      } catch (err) {
        log("step-2", "MP init FAILED", err);
        if (!cancelled) setMountError("Falha ao inicializar o Mercado Pago.");
        return;
      }
      if (cancelled || mountId !== mountIdRef.current) return;

      log("step-3", "preparing container");
      await destroyBrick();
      if (cancelled || mountId !== mountIdRef.current) return;

      const container = document.getElementById(BRICK_CONTAINER_ID);
      if (!container) {
        log("step-3", "container NOT found in DOM");
        if (!cancelled) setMountError("Container do formulário de cartão não encontrado.");
        return;
      }

      const rect = container.getBoundingClientRect();
      log("step-3", "container found ✓", {
        width: rect.width,
        height: rect.height,
        visible: rect.width > 0,
        display: getComputedStyle(container).display,
        parentDisplay: container.parentElement ? getComputedStyle(container.parentElement).display : "n/a",
      });

      container.innerHTML = "";

      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      );
      if (cancelled || mountId !== mountIdRef.current) return;

      log("step-4", "creating cardPayment Brick", { amount: totalAmount });

      clearReadyTimeout();
      readyTimeoutRef.current = setTimeout(() => {
        if (!cancelled && mountId === mountIdRef.current) {
          log("timeout", "Brick did NOT become ready within timeout");
          setMountError("O formulário do cartão não carregou a tempo. Verifique sua conexão e tente novamente.");
        }
      }, BRICK_READY_TIMEOUT);

      try {
        const bricksBuilder = mpInstanceRef.current.bricks();
        log("step-4", "bricksBuilder obtained ✓");

        brickControllerRef.current = await bricksBuilder.create(
          "cardPayment",
          BRICK_CONTAINER_ID,
          {
            initialization: {
              amount: Number(totalAmount),
              ...(emailRef.current ? { payer: { email: emailRef.current } } : {}),
            },
            locale: "pt-BR",
            customization: {
              visual: {
                hideFormTitle: true,
                style: {
                  theme: "dark" as any,
                  customVariables: {
                    formBackgroundColor: "#0F1720",
                    baseColor: "#A5B4FC",
                    baseColorFirstVariant: "#818CF8",
                    baseColorSecondVariant: "#6366F1",
                    textPrimaryColor: "#E2E8F0",
                    textSecondaryColor: "#94A3B8",
                    inputBackgroundColor: "#1A2332",
                    outlinePrimaryColor: "#6366F1",
                    outlineSecondaryColor: "#334155",
                    errorColor: "#F87171",
                    successColor: "#34D399",
                    borderRadiusMedium: "12px",
                    borderRadiusLarge: "14px",
                    borderRadiusFull: "9999px",
                    inputVerticalPadding: "12px",
                    inputHorizontalPadding: "14px",
                    inputFocusedBoxShadow: "0 0 0 2px rgba(99,102,241,0.3)",
                    buttonTextColor: "#FFFFFF",
                  },
                },
                texts: {
                  formSubmit: "Pagar com Cartão",
                  cardNumber: { label: "Número do cartão" },
                  expirationDate: { label: "Validade" },
                  securityCode: { label: "CVV" },
                  cardholderName: { label: "Nome no cartão", placeholder: "Como aparece no cartão" },
                  email: { label: "E-mail", placeholder: "seu@email.com" },
                },
              },
              paymentMethods: {
                maxInstallments: 12,
                minInstallments: 1,
              },
            },
            callbacks: {
              onReady: () => {
                log("onReady", "Brick is READY ✓", { mountId, currentMountId: mountIdRef.current });
                clearReadyTimeout();
                if (!cancelled && mountId === mountIdRef.current) {
                  setBrickReady(true);
                  setMountError(null);
                }
              },
              onError: (error: any) => {
                log("onError", "Brick error:", error);
                clearReadyTimeout();
                if (!cancelled && mountId === mountIdRef.current) {
                  setMountError(error?.message || "Erro no formulário do cartão.");
                }
              },
              onSubmit: async (cardData: any) => {
                log("onSubmit", "card data received, processing payment");
                setProcessing(true);
                try {
                  const res = await supabase.functions.invoke("create-mp-checkout", {
                    body: {
                      productId: productIdRef.current,
                      variantId: variantIdRef.current,
                      quantity: quantityRef.current,
                      paymentMethod: "credit_card",
                      cardToken: cardData?.token,
                      installments: Number(cardData?.installments) || 1,
                      paymentMethodId: cardData?.payment_method_id,
                      identificationType: cardData?.payer?.identification?.type,
                      identificationNumber: cardData?.payer?.identification?.number,
                      payerEmail: cardData?.payer?.email || emailRef.current || "",
                    },
                  });

                  if (res.error) throw new Error(res.error.message);
                  const data = (res.data ?? null) as CheckoutFunctionResponse | null;
                  if (data?.ok === false) {
                    throw new Error(data.details || data.error || "Não foi possível processar o cartão.");
                  }

                  setCardResult(data);

                  if (data?.card?.status === "approved") {
                    toastRef.current({ title: "Pagamento aprovado!", description: `Pedido #${data.orderId}` });
                  } else {
                    toastRef.current({
                      title: "Pagamento processado",
                      description: `Status: ${data?.card?.statusDetail || data?.status || "em processamento"}`,
                      variant: data?.card?.status === "rejected" ? "destructive" : "default",
                    });
                  }
                } catch (error: any) {
                  toastRef.current({ title: "Erro no cartão", description: error.message, variant: "destructive" });
                  throw error;
                } finally {
                  setProcessing(false);
                }
              },
            },
          },
        );
        log("step-4", "bricks.create() resolved ✓", { controller: !!brickControllerRef.current });
      } catch (error: any) {
        log("step-4", "bricks.create() FAILED", error);
        clearReadyTimeout();
        if (!cancelled && mountId === mountIdRef.current) {
          setMountError(error?.message || "Não foi possível montar o formulário do cartão.");
        }
      }
    };

    void run();

    return () => {
      log("cleanup", "cancelling mountId", mountId);
      cancelled = true;
      clearReadyTimeout();
      void destroyBrick();
      mpInstanceRef.current = null;
    };
  }, [active, open, publicKey, totalAmount, destroyBrick, clearReadyTimeout, retryCount]);

  const handleRetry = () => {
    log("retry", "user triggered retry");
    setMountError(null);
    setBrickReady(false);
    setRetryCount((c) => c + 1);
  };

  /* ── Render ── */

  if (!publicKey) {
    return (
      <div className="py-6 text-center text-[12px]" style={{ color: "rgba(255,255,255,0.2)" }}>
        Pagamento por cartão não configurado.
      </div>
    );
  }

  const isValidKey = publicKey.startsWith("APP_USR-") || publicKey.startsWith("TEST-");
  if (!isValidKey) {
    return (
      <div className="space-y-2 py-6 text-center">
        <AlertCircle className="mx-auto h-7 w-7" style={{ color: "rgba(248,113,113,0.6)" }} />
        <p className="text-[12px] font-medium" style={{ color: "rgba(248,113,113,0.7)" }}>
          Configuração do Mercado Pago inválida
        </p>
        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>
          Public key incompatível (prefixo: {publicKey.substring(0, 8)}…). Verifique as credenciais.
        </p>
      </div>
    );
  }

  if (cardResult?.card?.status === "approved") {
    return (
      <div className="space-y-3 py-8 text-center">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}
        >
          <CheckCircle2 className="h-7 w-7" style={{ color: "#34D399" }} />
        </div>
        <p
          className="text-[16px] font-semibold text-white"
          style={{ fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif" }}
        >
          Pagamento aprovado!
        </p>
        <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.22)" }}>
          Pedido #{cardResult.orderId}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Error state */}
      {mountError && (
        <div className="space-y-2">
          <div
            className="flex items-center gap-2 rounded-xl p-3 text-[12px]"
            style={{
              background: "rgba(239,68,68,0.05)",
              border: "1px solid rgba(239,68,68,0.12)",
              color: "#F87171",
            }}
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {mountError}
          </div>
          <button
            onClick={handleRetry}
            className="w-full h-9 rounded-xl text-[12px] font-medium flex items-center justify-center gap-1.5 transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            <RefreshCw className="h-3 w-3" />
            Tentar novamente
          </button>
        </div>
      )}

      {/* Loading state */}
      {!brickReady && !mountError && active && (
        <div className="flex items-center justify-center gap-2 py-5 text-[12px]" style={{ color: "rgba(255,255,255,0.22)" }}>
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: "rgba(165,180,252,0.5)" }} />
          Carregando formulário seguro…
        </div>
      )}

      {/* Brick container */}
      <div
        className="overflow-hidden transition-all duration-500"
        style={{
          borderRadius: "12px",
          opacity: brickReady ? 1 : 0.4,
          maxWidth: "100%",
        }}
      >
        <div
          id={BRICK_CONTAINER_ID}
          style={{
            minHeight: brickReady ? "auto" : 360,
            width: "100%",
            maxWidth: "100%",
            borderRadius: "12px",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Processing overlay */}
      {processing && (
        <div className="flex items-center justify-center gap-2 py-2 text-[12px]" style={{ color: "rgba(255,255,255,0.22)" }}>
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: "rgba(165,180,252,0.5)" }} />
          Processando pagamento…
        </div>
      )}
    </div>
  );
}
