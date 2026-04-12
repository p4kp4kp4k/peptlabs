import { useEffect, useRef, useState, useCallback } from "react";
import { CheckCircle2, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

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
const BRICK_READY_TIMEOUT = 20_000; // 20 seconds

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

  /* Stable refs for values used inside Brick callbacks */
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

  /* Reset everything when the dialog closes */
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

  /* Main mount effect */
  useEffect(() => {
    if (!open || !active || !publicKey) {
      log("effect-guard", { open, active, hasPublicKey: !!publicKey });
      return;
    }

    let cancelled = false;
    const mountId = ++mountIdRef.current;

    log("effect-start", { mountId, publicKey: publicKey.substring(0, 20) + "...", totalAmount });

    const run = async () => {
      /* ── 1. SDK availability ─────────────────────────── */
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
      if (cancelled || mountId !== mountIdRef.current) {
        log("step-1", "cancelled after SDK wait");
        return;
      }

      /* ── 2. Create MP instance ───────────────────────── */
      log("step-2", "creating MP instance");
      try {
        mpInstanceRef.current = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        log("step-2", "MP instance created ✓");
      } catch (err) {
        log("step-2", "MP init FAILED", err);
        if (!cancelled) setMountError("Falha ao inicializar o Mercado Pago.");
        return;
      }
      if (cancelled || mountId !== mountIdRef.current) {
        log("step-2", "cancelled after MP init");
        return;
      }

      /* ── 3. Prepare container ────────────────────────── */
      log("step-3", "preparing container");
      await destroyBrick();
      if (cancelled || mountId !== mountIdRef.current) {
        log("step-3", "cancelled after destroyBrick");
        return;
      }

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

      /* Wait for paint */
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      );
      if (cancelled || mountId !== mountIdRef.current) {
        log("step-3", "cancelled after rAF");
        return;
      }

      /* ── 4. Mount Brick ──────────────────────────────── */
      log("step-4", "creating cardPayment Brick", { amount: totalAmount });

      /* Set a timeout: if onReady doesn't fire within BRICK_READY_TIMEOUT, show error */
      clearReadyTimeout();
      readyTimeoutRef.current = setTimeout(() => {
        if (!cancelled && mountId === mountIdRef.current) {
          log("timeout", "Brick did NOT become ready within timeout");
          setMountError(
            "O formulário do cartão não carregou a tempo. Verifique sua conexão e tente novamente."
          );
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
              visual: { hideFormTitle: true },
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

  /* ── Retry handler ── */
  const handleRetry = () => {
    log("retry", "user triggered retry");
    setMountError(null);
    setBrickReady(false);
    setRetryCount((c) => c + 1);
  };

  /* ── Render ────────────────────────────────────────── */

  if (!publicKey) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground">
        Pagamento por cartão não configurado.
      </div>
    );
  }

  if (cardResult?.card?.status === "approved") {
    return (
      <div className="space-y-2 py-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <p className="text-sm font-semibold text-foreground">Pagamento aprovado!</p>
        <p className="text-[10px] text-muted-foreground">Pedido #{cardResult.orderId}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mountError && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {mountError}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-1.5 text-xs"
            onClick={handleRetry}
          >
            <RefreshCw className="h-3 w-3" />
            Tentar novamente
          </Button>
        </div>
      )}

      {!brickReady && !mountError && active && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Carregando formulário seguro do cartão…
        </div>
      )}

      <div
        id={BRICK_CONTAINER_ID}
        style={{ minHeight: brickReady ? "auto" : 420, width: "100%" }}
      />

      {processing && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Processando pagamento…
        </div>
      )}
    </div>
  );
}
