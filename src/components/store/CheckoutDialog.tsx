import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Copy, CreditCard, Loader2, QrCode, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
  };
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
  statusDetail?: string;
  paymentStatus?: string;
  diagnostics?: Record<string, unknown>;
  pix?: {
    qrCode?: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
  };
  card?: {
    status?: string;
    statusDetail?: string;
    authorizationCode?: string;
  };
}

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
  const [tab, setTab] = useState("pix");
  const [processing, setProcessing] = useState(false);
  const [payerEmail, setPayerEmail] = useState("");
  const [sdkReady, setSdkReady] = useState(
    typeof window !== "undefined" && typeof window.MercadoPago !== "undefined",
  );

  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixQrBase64, setPixQrBase64] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [mpInstanceVersion, setMpInstanceVersion] = useState(0);

  const [cardResult, setCardResult] = useState<CheckoutFunctionResponse | null>(null);
  const [cardErrors, setCardErrors] = useState<{ name?: string; cpf?: string }>({});
  const cardFormRef = useRef<HTMLDivElement>(null);
  const mpInstanceRef = useRef<any>(null);
  const cardFormInstanceRef = useRef<any>(null);

  const cleanupCardForm = () => {
    if (cardFormInstanceRef.current) {
      try {
        cardFormInstanceRef.current.unmount();
      } catch {
        // ignore SDK unmount errors
      }
      cardFormInstanceRef.current = null;
    }
  };

  const getErrorMessage = (data: CheckoutFunctionResponse | null | undefined, fallback: string) => {
    if (!data) return fallback;
    return data.details || data.error || fallback;
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const isValidCPF = (cpf: string) => {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

    let sum = 0;
    for (let index = 0; index < 9; index += 1) sum += parseInt(digits[index]) * (10 - index);

    let rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    if (rest !== parseInt(digits[9])) return false;

    sum = 0;
    for (let index = 0; index < 10; index += 1) sum += parseInt(digits[index]) * (11 - index);

    rest = (sum * 10) % 11;
    if (rest === 10) rest = 0;
    return rest === parseInt(digits[10]);
  };

  const handleCPFInput = (event: React.FormEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    input.value = formatCPF(input.value);
    setCardErrors((prev) => ({ ...prev, cpf: undefined }));
  };

  const validateCardFields = () => {
    const errors: { name?: string; cpf?: string } = {};
    const nameEl = document.getElementById("mp-cardholder-name") as HTMLInputElement | null;
    const cpfEl = document.getElementById("mp-doc-number") as HTMLInputElement | null;

    const name = nameEl?.value?.trim() || "";
    const cpf = cpfEl?.value || "";

    if (name.length < 3 || !/\s/.test(name)) {
      errors.name = "Informe o nome completo (nome e sobrenome)";
    }

    if (!isValidCPF(cpf)) {
      errors.cpf = "CPF inválido";
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setPayerEmail(data.user.email);
    });
  }, []);

  useEffect(() => {
    if (!open || tab !== "card" || !publicKey) return;

    let cancelled = false;
    const sdkUrl = "https://sdk.mercadopago.com/js/v2";
    const setReady = () => {
      if (!cancelled) setSdkReady(true);
    };
    const handleError = () => {
      if (!cancelled) {
        toast({
          title: "Erro no cartão",
          description: "Não foi possível carregar o formulário seguro do cartão.",
          variant: "destructive",
        });
      }
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
  }, [open, publicKey, tab, toast]);

  useEffect(() => {
    if (!open || !publicKey || tab !== "card" || !sdkReady || !window.MercadoPago) return;

    try {
      mpInstanceRef.current = new window.MercadoPago(publicKey, { locale: "pt-BR" });
      setMpInstanceVersion((current) => current + 1);
    } catch (error) {
      console.error("MercadoPago SDK init error:", error);
    }

    return () => {
      cleanupCardForm();
      mpInstanceRef.current = null;
      setMpInstanceVersion(0);
    };
  }, [open, publicKey, sdkReady, tab]);

  useEffect(() => {
    if (!open || tab !== "card" || !sdkReady || !mpInstanceVersion || !mpInstanceRef.current || !cardFormRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      cleanupCardForm();

      try {
        cardFormInstanceRef.current = mpInstanceRef.current.cardForm({
          amount: totalAmount.toFixed(2),
          iframe: true,
          form: {
            id: "mp-card-form",
            cardNumber: { id: "mp-card-number", placeholder: "Número do cartão" },
            expirationDate: { id: "mp-expiration-date", placeholder: "MM/AA" },
            securityCode: { id: "mp-security-code", placeholder: "CVV" },
            cardholderName: { id: "mp-cardholder-name", placeholder: "Nome no cartão" },
            identificationType: { id: "mp-doc-type" },
            identificationNumber: { id: "mp-doc-number", placeholder: "CPF" },
            issuer: { id: "mp-issuer" },
            installments: { id: "mp-installments" },
          },
          callbacks: {
            onFormMounted: (error: any) => {
              if (error) console.warn("CardForm mount error:", error);
            },
            onSubmit: async (event: any) => {
              event.preventDefault();
              handleCardPayment();
            },
          },
        });
      } catch (error) {
        console.error("CardForm init error:", error);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, sdkReady, tab, totalAmount, mpInstanceVersion, publicKey]);

  const handlePixPayment = async () => {
    setProcessing(true);
    setPixQrCode(null);
    setPixQrBase64(null);

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
      } else {
        toast({ title: "PIX gerado", description: `Pedido: ${data?.orderId} — Status: ${data?.status}` });
      }
    } catch (error: any) {
      toast({ title: "Erro no PIX", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    if (!cardFormInstanceRef.current) {
      toast({ title: "Erro", description: "Formulário de cartão não carregado", variant: "destructive" });
      return;
    }

    if (!validateCardFields()) return;

    setProcessing(true);
    setCardResult(null);

    try {
      const cardFormData = cardFormInstanceRef.current.getCardFormData();
      const token = cardFormData.token;
      const paymentMethodId = cardFormData.paymentMethodId;
      const identificationType = cardFormData.identificationType;
      const identificationNumber = cardFormData.identificationNumber;

      if (!token || !paymentMethodId || !identificationType || !identificationNumber) {
        throw new Error("Não foi possível tokenizar o cartão. Verifique os dados e tente novamente.");
      }

      const res = await supabase.functions.invoke("create-mp-checkout", {
        body: {
          productId: product.id,
          variantId,
          quantity,
          paymentMethod: "credit_card",
          cardToken: token,
          installments: parseInt(cardFormData.installments, 10) || 1,
          paymentMethodId,
          identificationType,
          identificationNumber,
          payerEmail,
        },
      });

      if (res.error) throw new Error(res.error.message);
      const data = (res.data ?? null) as CheckoutFunctionResponse | null;

      if (data?.ok === false) {
        throw new Error(getErrorMessage(data, "Não foi possível processar o cartão."));
      }

      setCardResult(data);

      if (data?.card?.status === "approved") {
        toast({ title: "Pagamento aprovado! ✅", description: `Pedido #${data.orderId}` });
      } else {
        toast({
          title: "Pagamento processado",
          description: `Status: ${data?.card?.statusDetail || data?.status || "em processamento"}`,
          variant: data?.card?.status === "rejected" ? "destructive" : "default",
        });
      }
    } catch (error: any) {
      toast({ title: "Erro no cartão", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const copyPixCode = () => {
    if (pixQrCode) {
      navigator.clipboard.writeText(pixQrCode);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2000);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-background/60 px-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="relative w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
        <button
          type="button"
          aria-label="Fechar checkout"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4">
          <h2 className="text-base font-semibold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Finalizar Compra
          </h2>
        </div>

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

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full h-9 bg-secondary/60 p-0.5">
            <TabsTrigger value="pix" className="flex-1 text-[11px] gap-1.5 h-8 data-[state=active]:bg-card">
              <QrCode className="h-3.5 w-3.5" /> PIX
            </TabsTrigger>
            <TabsTrigger value="card" className="flex-1 text-[11px] gap-1.5 h-8 data-[state=active]:bg-card">
              <CreditCard className="h-3.5 w-3.5" /> Cartão
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pix" className="space-y-3 mt-3">
            {!pixQrCode ? (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">E-mail</Label>
                  <Input
                    value={payerEmail}
                    onChange={(event) => setPayerEmail(event.target.value)}
                    placeholder="seu@email.com"
                    className="h-8 text-xs"
                  />
                </div>
                <Button onClick={handlePixPayment} disabled={processing || !payerEmail} className="w-full gap-2 text-xs">
                  {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <QrCode className="h-3.5 w-3.5" />}
                  {processing ? "Gerando PIX..." : "Gerar QR Code PIX"}
                </Button>
              </>
            ) : (
              <div className="space-y-3 text-center">
                <p className="text-xs text-muted-foreground">Escaneie o QR Code ou copie o código:</p>
                {pixQrBase64 && (
                  <div className="flex justify-center">
                    <img
                      src={`data:image/png;base64,${pixQrBase64}`}
                      alt="QR Code PIX"
                      className="w-48 h-48 rounded-md border border-border"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Input value={pixQrCode || ""} readOnly className="h-8 text-[9px] font-mono flex-1" />
                  <Button size="sm" variant="outline" onClick={copyPixCode} className="h-8 gap-1 text-[10px]">
                    {pixCopied ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {pixCopied ? "Copiado" : "Copiar"}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">O pagamento será confirmado automaticamente.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="card" className="space-y-3 mt-3">
            {!publicKey ? (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">
                  Pagamento por cartão não configurado. Configure a Public Key do MercadoPago no painel admin.
                </p>
              </div>
            ) : cardResult?.card?.status === "approved" ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
                <p className="text-sm font-semibold text-foreground">Pagamento Aprovado!</p>
                <p className="text-[10px] text-muted-foreground">Pedido #{cardResult.orderId}</p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">E-mail</Label>
                  <Input
                    value={payerEmail}
                    onChange={(event) => setPayerEmail(event.target.value)}
                    placeholder="seu@email.com"
                    className="h-8 text-xs"
                  />
                </div>

                <div ref={cardFormRef}>
                  <form id="mp-card-form" onSubmit={(event) => event.preventDefault()}>
                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <Label className="text-[10px]">Número do Cartão</Label>
                        <div id="mp-card-number" className="h-9 rounded-md border border-border bg-secondary/50" style={{ position: "relative", zIndex: 10 }} />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Validade</Label>
                          <div id="mp-expiration-date" className="h-9 rounded-md border border-border bg-secondary/50" style={{ position: "relative", zIndex: 10 }} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">CVV</Label>
                          <div id="mp-security-code" className="h-9 rounded-md border border-border bg-secondary/50" style={{ position: "relative", zIndex: 10 }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px]">Nome no Cartão</Label>
                        <input
                          id="mp-cardholder-name"
                          className={`flex h-9 w-full rounded-md border px-3 py-2 text-xs bg-secondary/50 ${cardErrors.name ? "border-destructive" : "border-border"}`}
                          style={{ position: "relative", zIndex: 10 }}
                          onChange={() => setCardErrors((prev) => ({ ...prev, name: undefined }))}
                        />
                        {cardErrors.name && <p className="text-[9px] text-destructive">{cardErrors.name}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Tipo Doc.</Label>
                          <select id="mp-doc-type" className="flex h-9 w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs" style={{ position: "relative", zIndex: 10 }} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">CPF</Label>
                          <input
                            id="mp-doc-number"
                            className={`flex h-9 w-full rounded-md border px-3 py-2 text-xs bg-secondary/50 ${cardErrors.cpf ? "border-destructive" : "border-border"}`}
                            style={{ position: "relative", zIndex: 10 }}
                            onInput={handleCPFInput}
                            placeholder="000.000.000-00"
                            inputMode="numeric"
                          />
                          {cardErrors.cpf && <p className="text-[9px] text-destructive">{cardErrors.cpf}</p>}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Banco / Emissor</Label>
                          <select id="mp-issuer" className="flex h-9 w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs" style={{ position: "relative", zIndex: 10 }} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Parcelas</Label>
                          <select id="mp-installments" className="flex h-9 w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs" style={{ position: "relative", zIndex: 10 }} />
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                <Button onClick={handleCardPayment} disabled={processing || !payerEmail} className="w-full gap-2 text-xs">
                  {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                  {processing ? "Processando..." : `Pagar R$ ${totalAmount.toFixed(2).replace(".", ",")}`}
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>

        <p className="mt-4 text-[9px] text-center text-muted-foreground/50">
          Pagamento processado com segurança pelo Mercado Pago
        </p>
      </div>
    </div>
  );
}
