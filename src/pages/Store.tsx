import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingBag, Package } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

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

export default function Store() {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["store-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_variants(*)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          <ShoppingBag className="inline h-5 w-5 mr-2 text-primary" />
          Loja
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Produtos disponíveis</p>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Package className="h-12 w-12 mb-3 opacity-40" />
          <p className="text-sm">Nenhum produto disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Link to={`/app/store/${product.id}`} key={product.id} className="block">
              <ProductCard product={product} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const activeVariants = product.product_variants.filter((v) => v.is_active);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    activeVariants[0] || null
  );

  const displayPrice = selectedVariant ? selectedVariant.price : product.base_price;
  const imageUrl = selectedVariant?.image_url;

  return (
    <Card className="border-border/40 bg-card/80 overflow-hidden group hover:border-primary/30 transition-colors">
      {/* Image */}
      <div className="aspect-square bg-secondary/30 relative overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${product.name} - ${selectedVariant?.color_name}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground/20" />
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {product.name}
          </h3>
          {product.description && (
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
          )}
        </div>

        {/* Color variants */}
        {activeVariants.length > 0 && (
          <div className="flex items-center gap-1.5">
            {activeVariants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v)}
                className={`h-5 w-5 rounded-full border-2 transition-all ${
                  selectedVariant?.id === v.id
                    ? "border-primary scale-110 ring-2 ring-primary/20"
                    : "border-border hover:border-foreground/40"
                }`}
                style={{ backgroundColor: v.color_hex }}
                title={v.color_name}
              />
            ))}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-primary" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            R$ {Number(displayPrice).toFixed(2).replace(".", ",")}
          </span>
          {selectedVariant && selectedVariant.stock <= 0 && (
            <Badge variant="outline" className="text-[9px] text-destructive border-destructive/30">Esgotado</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
