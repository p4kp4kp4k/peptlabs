import { useEffect, useRef, useState, useCallback } from "react";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
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

  const mpInstanceRef = useRef<any>(null);
  const brickControllerRef = useRef<any>(null);
  const mountIdRef = useRef(0);

  /* Stable refs for values used inside Brick callbacks */
  const productIdRef = useRef(productId);
  productIdRef.current = productId;
  const variantIdRef = useRef(variantId);
  variantIdRef.current = variantId;
  const quantityRef = useRef(quantity);
  quantityRef.current = quantity;
  const emailRef = useRef(initialEmail);
  emailRef.current = initialEmail;

  const destroyBrick = useCallback(async () => {
    setBrickReady(false);
    if (brickControllerRef.current?.unmount) {
      try {
        await brickControllerRef.current.unmount();
      } catch {
        /* SDK may throw if already unmounted */
      }
    }
    brickControllerRef.current = null;

    /* Clear stale iframe/content the SDK may have left behind */
    const el = document.getElementById(BRICK_CONTAINER_ID);
    if (el) el.innerHTML = "";
  }, []);

  /* Reset everything when the dialog closes */
  useEffect(() => {
    if (!open) {
      setCardResult(null);
      setProcessing(false);
      setMountError(null);
      void destroyBrick();
      mpInstanceRef.current = null;
    }
  }, [open, destroyBrick]);

  /*
   * Single combined effect: SDK check → MP init → Brick mount.
   * The SDK script is already in index.html so window.MercadoPago
   * should exist.  If not we bail with an error message.
   */
  useEffect(() => {
    if (!open || !active || !publicKey) return;

    let cancelled = false;
    const mountId = ++mountIdRef.current;

    const run = async () => {
      /* ── 1. SDK availability ─────────────────────────── */
      if (typeof window.MercadoPago === "undefined") {
        /* SDK not loaded yet – wait up to 5 s */
        let waited = 0;
        while (typeof window.MercadoPago === "undefined" && waited < 5000) {
          await new Promise((r) => setTimeout(r, 250));
          waited += 250;
        }
        if (typeof window.MercadoPago === "undefined") {
          if (!cancelled) setMountError("SDK do Mercado Pago não carregou. Recarregue a página.");
          return;
        }
      }
      if (cancelled || mountId !== mountIdRef.current) return;

      /* ── 2. Create MP instance ───────────────────────── */
      try {
        mpInstanceRef.current = new window.MercadoPago(publicKey, { locale: "pt-BR" });
      } catch (err) {
        console.error("[MP] SDK init error:", err);
        if (!cancelled) setMountError("Falha ao inicializar o Mercado Pago.");
        return;
      }
      if (cancelled || mountId !== mountIdRef.current) return;

      /* ── 3. Prepare container ────────────────────────── */
      await destroyBrick();
      if (cancelled || mountId !== mountIdRef.current) return;

      const container = document.getElementById(BRICK_CONTAINER_ID);
      if (!container) {
        if (!cancelled) setMountError("Container do formulário de cartão não encontrado.");
        return;
      }
      container.innerHTML = "";

      /* Two animation frames ensure the empty container has been painted */
      await new Promise<void>((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => r())),
      );
      if (cancelled || mountId !== mountIdRef.current) return;

      /* ── 4. Mount Brick ──────────────────────────────── */
      try {
        brickControllerRef.current = await mpInstanceRef.current
          .bricks()
          .create("cardPayment", BRICK_CONTAINER_ID, {
            initialization: {
              amount: totalAmount,
              ...(emailRef.current ? { payer: { email: emailRef.current } } : {}),
            },
            locale: "pt-BR",
            customization: {
              visual: { hideFormTitle: true },
              paymentMethods: {
                maxInstallments: 12,
                minInstallments: 1,
                types: { included: ["credit_card"] },
              },
            },
            callbacks: {
              onReady: () => {
                if (!cancelled && mountId === mountIdRef.current) {
                  setBrickReady(true);
                  setMountError(null);
                }
              },
              onError: (error: any) => {
                console.error("[MP] Brick error:", error);
                if (!cancelled && mountId === mountIdRef.current) {
                  setMountError(error?.message || "Erro no formulário do cartão.");
                }
              },
              onSubmit: async (cardData: any) => {
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
          });
      } catch (error: any) {
        console.error("[MP] Brick create error:", error);
        if (!cancelled && mountId === mountIdRef.current) {
          setMountError(error?.message || "Não foi possível montar o formulário do cartão.");
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
      void destroyBrick();
      mpInstanceRef.current = null;
    };
  }, [active, open, publicKey, totalAmount, destroyBrick]);

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
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {mountError}
        </div>
      )}

      {!brickReady && !mountError && active && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Carregando formulário seguro do cartão…
        </div>
      )}

      <div id={BRICK_CONTAINER_ID} style={{ minHeight: 420, width: "100%" }} />

      {processing && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Processando pagamento…
        </div>
      )}
    </div>
  );
}
