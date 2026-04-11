
-- Products table
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  base_price numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products viewable by everyone" ON public.products
  FOR SELECT USING (is_active = true OR has_role('admin'::app_role));

CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (has_role('admin'::app_role));

CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE TO authenticated USING (has_role('admin'::app_role));

CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE TO authenticated USING (has_role('admin'::app_role));

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Product variants table
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color_name text NOT NULL,
  color_hex text DEFAULT '#000000',
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text,
  stock integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants viewable by everyone" ON public.product_variants
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert variants" ON public.product_variants
  FOR INSERT TO authenticated WITH CHECK (has_role('admin'::app_role));

CREATE POLICY "Admins can update variants" ON public.product_variants
  FOR UPDATE TO authenticated USING (has_role('admin'::app_role));

CREATE POLICY "Admins can delete variants" ON public.product_variants
  FOR DELETE TO authenticated USING (has_role('admin'::app_role));

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

CREATE POLICY "Product images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND has_role('admin'::app_role));

CREATE POLICY "Admins can update product images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND has_role('admin'::app_role));

CREATE POLICY "Admins can delete product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND has_role('admin'::app_role));
