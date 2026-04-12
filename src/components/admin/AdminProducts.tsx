import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Search, Plus, Trash2, Edit, Loader2, Package, ImagePlus, X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductVariant {
  id: string;
  product_id: string;
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
  created_at: string;
  product_variants: ProductVariant[];
}

interface NewVariant {
  color_name: string;
  color_hex: string;
  price: string;
  stock: string;
  imageFile: File | null;
  imagePreview: string | null;
  existingImageUrl: string | null; // track the persisted URL separately
}

const emptyVariant = (): NewVariant => ({
  color_name: "",
  color_hex: "#000000",
  price: "",
  stock: "0",
  imageFile: null,
  imagePreview: null,
  existingImageUrl: null,
});

export default function AdminProducts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState<NewVariant[]>([emptyVariant()]);
  const [saving, setSaving] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_variants(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

  const filtered = products.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setBasePrice("");
    setIsActive(true);
    setVariants([emptyVariant()]);
    setEditingProduct(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || "");
    setBasePrice(String(product.base_price));
    setIsActive(product.is_active);
    setVariants(
      product.product_variants.length > 0
        ? product.product_variants.map((v) => ({
            color_name: v.color_name,
            color_hex: v.color_hex || "#000000",
            price: String(v.price),
            stock: String(v.stock),
            imageFile: null,
            imagePreview: v.image_url,
            existingImageUrl: v.image_url,
          }))
        : [emptyVariant()]
    );
    setDialogOpen(true);
  };

  const addVariant = () => setVariants([...variants, emptyVariant()]);

  const removeVariant = (idx: number) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const updateVariant = (idx: number, field: keyof NewVariant, value: any) => {
    setVariants(variants.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
  };

  const handleImageChange = (idx: number, file: File | null) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setVariants(
      variants.map((v, i) =>
        i === idx ? { ...v, imageFile: file, imagePreview: preview } : v
      )
    );
  };

  const clearImage = (idx: number) => {
    setVariants(
      variants.map((v, i) =>
        i === idx ? { ...v, imageFile: null, imagePreview: null, existingImageUrl: null } : v
      )
    );
  };

  const generateSlug = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const uploadImage = async (file: File, productSlug: string, colorName: string): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${productSlug}/${colorName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Nome obrigatório", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const slug = generateSlug(name);
      let productId: string;

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update({
            name: name.trim(),
            slug,
            description: description.trim() || null,
            base_price: parseFloat(basePrice) || 0,
            is_active: isActive,
          })
          .eq("id", editingProduct.id);
        if (error) throw error;
        productId = editingProduct.id;

        // Delete old variants
        await supabase.from("product_variants").delete().eq("product_id", productId);
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert({
            name: name.trim(),
            slug,
            description: description.trim() || null,
            base_price: parseFloat(basePrice) || 0,
            is_active: isActive,
          })
          .select("id")
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // Insert variants
      for (const v of variants) {
        if (!v.color_name.trim()) continue;

        let imageUrl: string | null = v.existingImageUrl;
        if (v.imageFile) {
          imageUrl = await uploadImage(v.imageFile, slug, v.color_name);
        }

        const { error } = await supabase.from("product_variants").insert({
          product_id: productId,
          color_name: v.color_name.trim(),
          color_hex: v.color_hex || "#000000",
          price: parseFloat(v.price) || 0,
          image_url: imageUrl,
          stock: parseInt(v.stock) || 0,
          is_active: true,
        });
        if (error) throw error;
      }

      toast({ title: editingProduct ? "Produto atualizado" : "Produto criado" });
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, productName: string) => {
    if (!confirm(`Excluir produto "${productName}"?`)) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Excluído", description: `${productName} removido.` });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  // Get first variant image for table thumbnail
  const getProductThumb = (p: Product) => {
    const v = p.product_variants.find((v) => v.image_url);
    return v?.image_url || null;
  };

  return (
    <>
      <Card className="border-border/40 bg-card/80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Produtos ({filtered.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-7 pl-8 text-[10px]"
                />
              </div>
              <Button size="sm" className="h-7 text-[11px] gap-1" onClick={openCreate}>
                <Plus className="h-3 w-3" /> Novo Produto
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-12">Foto</TableHead>
                  <TableHead className="text-xs">Produto</TableHead>
                  <TableHead className="text-xs">Preço Base</TableHead>
                  <TableHead className="text-xs">Variantes</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const thumb = getProductThumb(p);
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        {thumb ? (
                          <img src={thumb} alt={p.name} className="h-8 w-8 rounded object-cover border border-border/40" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-secondary/40 flex items-center justify-center">
                            <Package className="h-3.5 w-3.5 text-muted-foreground/40" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-medium">{p.name}</TableCell>
                      <TableCell className="text-xs">
                        R$ {Number(p.base_price).toFixed(2).replace(".", ",")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {p.product_variants.slice(0, 4).map((v) => (
                            v.image_url ? (
                              <img key={v.id} src={v.image_url} alt={v.color_name} className="h-6 w-6 rounded object-cover border border-border/40" title={v.color_name} />
                            ) : (
                              <div key={v.id} className="h-6 w-6 rounded bg-secondary/40 border border-border/40 flex items-center justify-center" title={v.color_name}>
                                <Package className="h-2.5 w-2.5 text-muted-foreground/40" />
                              </div>
                            )
                          ))}
                          <span className="text-[10px] text-muted-foreground ml-1">
                            {p.product_variants.length}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[9px] ${p.is_active ? "text-emerald-400 border-emerald-400/30" : "text-muted-foreground"}`}
                        >
                          {p.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(p)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(p.id, p.name)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      Nenhum produto cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome do Produto</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Box V50" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Preço Base (R$)</Label>
                <Input type="number" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="0.00" className="h-8 text-xs" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição do produto..." className="text-xs min-h-[60px]" />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label className="text-xs">Produto ativo</Label>
            </div>

            {/* Variants */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Variantes</Label>
                <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" onClick={addVariant}>
                  <Plus className="h-2.5 w-2.5" /> Adicionar Variante
                </Button>
              </div>

              {variants.map((v, idx) => (
                <Card key={idx} className="border-border/30 bg-secondary/20">
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground">Variante {idx + 1}</span>
                      {variants.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeVariant(idx)}>
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-3 items-start">
                      {/* Photo */}
                      <div className="space-y-1 shrink-0">
                        <Label className="text-[10px]">Foto</Label>
                        {v.imagePreview ? (
                          <div className="relative h-20 w-20 rounded-md border border-border overflow-hidden">
                            <img src={v.imagePreview} className="h-full w-full object-cover" alt={v.color_name || "Variante"} />
                            <button
                              className="absolute top-0.5 right-0.5 bg-destructive/80 rounded-full p-0.5"
                              onClick={() => clearImage(idx)}
                            >
                              <X className="h-2.5 w-2.5 text-white" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-md border border-dashed border-border hover:border-primary/40 transition-colors bg-secondary/30">
                            <ImagePlus className="h-5 w-5 text-muted-foreground" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageChange(idx, e.target.files?.[0] || null)}
                            />
                          </label>
                        )}
                      </div>

                      {/* Info fields */}
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Descrição (ex: Azul)</Label>
                          <Input
                            value={v.color_name}
                            onChange={(e) => updateVariant(idx, "color_name", e.target.value)}
                            placeholder="Azul"
                            className="h-7 text-[10px]"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Preço (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={v.price}
                            onChange={(e) => updateVariant(idx, "price", e.target.value)}
                            placeholder="0.00"
                            className="h-7 text-[10px]"
                          />
                        </div>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }} className="text-xs">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving} className="text-xs gap-1.5">
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
              {editingProduct ? "Salvar" : "Criar Produto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
