import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
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
  const [sdkReady, setSdkReady] = useState(
    typeof window !== "undefined" && typeof window.MercadoPago !== "undefined",
  );
  const [brickReady, setBrickReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cardResult, setCardResult] = useState<CheckoutFunctionResponse | null>(null);
  const mpInstanceRef = useRef<any>(null);
  const brickControllerRef = useRef<any>(null);

  const cleanupBrick = async () => {
    setBrickReady(false);
    if (brickControllerRef.current?.unmount) {
      try {
        await brickControllerRef.current.unmount();
      } catch {
      }
    }
    brickControllerRef.current = null;
  };

  const getErrorMessage = (data: CheckoutFunctionResponse | null | undefined, fallback: string) => {
    if (!data) return fallback;
    return data.details || data.error || fallback;
  };

  useEffect(() => {
    if (!open) {
      setCardResult(null);
      setProcessing(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !active || !publicKey) return;

    let cancelled = false;
    const sdkUrl = "https://sdk.mercadopago.com/js/v2";
    const setReady = () => {
      if (!cancelled) setSdkReady(true);
    };
    const handleError = () => {
      if (cancelled) return;
      toast({ title: "Erro no cartão", description: "Não foi possível carregar o checkout seguro do cartão.", variant: "destructive" });
    };

    if (window.MercadoPago) {
      setReady();
      return () => {
        cancelled = true;
      };
    }

    let script = document.querySelector(`script[src="${sdkUrl}"]`) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.src = sdkUrl;
      script.async = true;
      document.body.appendChild(script);
    }

    script.addEventListener("load", setReady);
    script.addEventListener("error", handleError);

    return () => {
      cancelled = true;
      script?.removeEventListener("load", setReady);
      script?.removeEventListener("error", handleError);
    };
  }, [active, open, publicKey, toast]);

  useEffect(() => {
    if (!open || !active || !publicKey || !sdkReady || !window.MercadoPago) return;

    try {
      mpInstanceRef.current = new window.MercadoPago(publicKey, { locale: "pt-BR" });
    } catch (error) {
      console.error("MercadoPago SDK init error:", error);
      toast({ title: "Erro no cartão", description: "Não foi possível inicializar o checkout do cartão.", variant: "destructive" });
    }

    return () => {
      mpInstanceRef.current = null;
    };
  }, [active, open, publicKey, sdkReady, toast]);

  useEffect(() => {
    if (!open || !active || !publicKey || !sdkReady || !mpInstanceRef.current) return;

    let cancelled = false;

    const mountBrick = async () => {
      await cleanupBrick();
      if (cancelled) return;

      try {
        brickControllerRef.current = await mpInstanceRef.current.bricks().create("cardPayment", BRICK_CONTAINER_ID, {
          initialization: {
            amount: totalAmount,
            ...(initialEmail ? { payer: { email: initialEmail } } : {}),
          },
          locale: "pt-BR",
          customization: {
            visual: {
              hideFormTitle: true,
            },
            paymentMethods: {
              maxInstallments: 12,
              minInstallments: 1,
              types: {
                included: ["credit_card"],
              },
            },
          },
          callbacks: {
            onReady: () => {
              if (!cancelled) setBrickReady(true);
            },
            onError: (error: any) => {
              console.error("Card Payment Brick error:", error);
              if (cancelled) return;
              toast({ title: "Erro no cartão", description: error?.message || "Não foi possível carregar o formulário do cartão.", variant: "destructive" });
            },
            onSubmit: async (cardData: any) => {
              setProcessing(true);
              try {
                const res = await supabase.functions.invoke("create-mp-checkout", {
                  body: {
                    productId,
                    variantId,
                    quantity,
                    paymentMethod: "credit_card",
                    cardToken: cardData?.token,
                    installments: Number(cardData?.installments) || 1,
                    paymentMethodId: cardData?.payment_method_id,
                    identificationType: cardData?.payer?.identification?.type,
                    identificationNumber: cardData?.payer?.identification?.number,
                    payerEmail: cardData?.payer?.email || initialEmail || "",
                  },
                });

                if (res.error) throw new Error(res.error.message);
                const data = (res.data ?? null) as CheckoutFunctionResponse | null;
                if (data?.ok === false) {
                  throw new Error(getErrorMessage(data, "Não foi possível processar o cartão."));
                }

                setCardResult(data);

                if (data?.card?.status === "approved") {
                  toast({ title: "Pagamento aprovado!", description: `Pedido #${data.orderId}` });
                } else {
                  toast({
                    title: "Pagamento processado",
                    description: `Status: ${data?.card?.statusDetail || data?.status || "em processamento"}`,
                    variant: data?.card?.status === "rejected" ? "destructive" : "default",
                  });
                }
              } catch (error: any) {
                toast({ title: "Erro no cartão", description: error.message, variant: "destructive" });
                throw error;
              } finally {
                setProcessing(false);
              }
            },
          },
        });
      } catch (error) {
        console.error("Card Payment Brick mount error:", error);
        if (!cancelled) {
          toast({ title: "Erro no cartão", description: "Não foi possível montar o checkout do cartão.", variant: "destructive" });
        }
      }
    };

    void mountBrick();

    return () => {
      cancelled = true;
      void cleanupBrick();
    };
  }, [active, open, publicKey, sdkReady, totalAmount, initialEmail, productId, quantity, variantId, toast]);

  if (!publicKey) {
    return <div className="py-4 text-center text-xs text-muted-foreground">Pagamento por cartão não configurado.</div>;
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
      {!brickReady && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Carregando formulário seguro do cartão...
        </div>
      )}
      <div id={BRICK_CONTAINER_ID} className="min-h-[420px]" />
      {processing && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Processando pagamento...
        </div>
      )}
    </div>
  );
}