import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, ArrowLeft, ShoppingBag, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import CheckoutDialog from "@/components/store/CheckoutDialog";

interface ProductVariant {
  id: string;
  color_name: string;
  color_hex: string;
  price: number;
  image_url: string | null;
  stock: number;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  base_price: number;
  is_active: boolean;
  product_variants: ProductVariant[];
}

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();

  const { data: product, isLoading } = useQuery({
    queryKey: ["store-product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_variants(*)")
        .eq("id", productId!)
        .single();
      if (error) throw error;
      return data as unknown as Product;
    },
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-muted-foreground">
        <Package className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm">Produto não encontrado.</p>
        <Link to="/app/store">
          <Button variant="outline" size="sm" className="mt-4 text-xs gap-1.5">
            <ArrowLeft className="h-3 w-3" /> Voltar à Loja
          </Button>
        </Link>
      </div>
    );
  }

  return <ProductView product={product} />;
}

function ProductView({ product }: { product: Product }) {
  const activeVariants = product.product_variants.filter((v) => v.is_active);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    activeVariants[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { toast } = useToast();

  // Load MercadoPago public config via backend-safe endpoint
  const { data: mpConfig } = useQuery({
    queryKey: ["mp-public-config"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-mp-public-config");
      if (error) throw error;
      return (data ?? null) as {
        publicKey: string | null;
        cardEnabled: boolean;
        environment: string | null;
      } | null;
    },
  });

  const displayPrice = selectedVariant ? selectedVariant.price : product.base_price;
  const imageUrl = selectedVariant?.image_url;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <Link to="/app/store" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-3 w-3" /> Voltar à Loja
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image */}
        <div className="aspect-square rounded-lg bg-secondary/30 overflow-hidden border border-border/40">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${product.name} - ${selectedVariant?.color_name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-20 w-20 text-muted-foreground/20" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {product.name}
            </h1>
            {product.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-line">{product.description}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <span className="text-3xl font-bold text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              R$ {Number(displayPrice).toFixed(2).replace(".", ",")}
            </span>
          </div>

          {/* Variants */}
          {activeVariants.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Opções disponíveis</p>
              <div className="flex flex-wrap gap-2">
                {activeVariants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`flex items-center gap-2 rounded-lg border p-1.5 pr-3 text-xs transition-all ${
                      selectedVariant?.id === v.id
                        ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                        : "border-border hover:border-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {v.image_url ? (
                      <img
                        src={v.image_url}
                        alt={v.color_name}
                        className="h-8 w-8 rounded object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-secondary/50 flex items-center justify-center">
                        <Package className="h-3.5 w-3.5 text-muted-foreground/40" />
                      </div>
                    )}
                    {v.color_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock info completely hidden per admin request */}

          {/* Quantity selector */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Quantidade</p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-10 text-center text-sm font-semibold text-foreground">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(Math.min(selectedVariant?.stock || 99, quantity + 1))}
                disabled={selectedVariant ? quantity >= selectedVariant.stock : false}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Total */}
          {quantity > 1 && (
            <p className="text-xs text-muted-foreground">
              Total: <span className="font-semibold text-foreground">R$ {(Number(displayPrice) * quantity).toFixed(2).replace(".", ",")}</span>
            </p>
          )}

          {/* Buy button */}
          <Button
            size="lg"
            className="w-full gap-2 text-sm font-semibold"
            disabled={selectedVariant ? selectedVariant.stock <= 0 : false}
            onClick={() => setCheckoutOpen(true)}
          >
            <ShoppingBag className="h-4 w-4" />
            Comprar Agora
          </Button>
        </div>
      </div>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        product={{ id: product.id, name: product.name }}
        variantId={selectedVariant?.id || null}
        variantName={selectedVariant?.color_name || null}
        unitPrice={Number(displayPrice)}
        quantity={quantity}
        publicKey={mpConfig?.cardEnabled ? mpConfig.publicKey : null}
      />
    </div>
  );
}
