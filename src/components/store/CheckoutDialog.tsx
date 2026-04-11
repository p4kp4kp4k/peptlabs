import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Copy, CreditCard, Loader2, QrCode, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MercadoPagoCardSection from "@/components/store/MercadoPagoCardSection";

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
  status?: string;
  pix?: {
    qrCode?: string;
    qrCodeBase64?: string;
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
  const [processingPix, setProcessingPix] = useState(false);
  const [payerEmail, setPayerEmail] = useState("");
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixQrBase64, setPixQrBase64] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setPayerEmail(data.user.email);
    });
  }, []);

  useEffect(() => {
    if (!open) {
      setTab("pix");
      setProcessingPix(false);
      setPixQrCode(null);
      setPixQrBase64(null);
      setPixCopied(false);
    }
  }, [open]);

  const getErrorMessage = (data: CheckoutFunctionResponse | null | undefined, fallback: string) => {
    if (!data) return fallback;
    return data.details || data.error || fallback;
  };

  const handlePixPayment = async () => {
    setProcessingPix(true);
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
      setProcessingPix(false);
    }
  };

  const copyPixCode = () => {
    if (!pixQrCode) return;
    navigator.clipboard.writeText(pixQrCode);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 2000);
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
          <TabsList className="mt-4 h-9 w-full bg-secondary/60 p-0.5">
            <TabsTrigger value="pix" className="h-8 flex-1 gap-1.5 text-[11px] data-[state=active]:bg-card">
              <QrCode className="h-3.5 w-3.5" /> PIX
            </TabsTrigger>
            <TabsTrigger value="card" className="h-8 flex-1 gap-1.5 text-[11px] data-[state=active]:bg-card">
              <CreditCard className="h-3.5 w-3.5" /> Cartão
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pix" className="mt-3 space-y-3">
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

                <Button onClick={handlePixPayment} disabled={processingPix || !payerEmail} className="w-full gap-2 text-xs">
                  {processingPix ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <QrCode className="h-3.5 w-3.5" />}
                  {processingPix ? "Gerando PIX..." : "Gerar QR Code PIX"}
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

                <p className="text-[10px] text-muted-foreground">O pagamento será confirmado automaticamente.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="card" className="mt-3">
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
          </TabsContent>
        </Tabs>

        <p className="mt-4 text-center text-[9px] text-muted-foreground/50">
          Pagamento processado com segurança pelo Mercado Pago
        </p>
      </div>
    </div>
  );
}
