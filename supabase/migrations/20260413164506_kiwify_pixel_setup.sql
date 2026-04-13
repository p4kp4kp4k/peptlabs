-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Kiwify integration + app_settings (Facebook Pixel)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add kiwify_product_id to plan_links
--    This allows mapping a Kiwify product to a plan automatically on webhook.
ALTER TABLE public.plan_links
  ADD COLUMN IF NOT EXISTS kiwify_product_id text;

-- 2. Create app_settings table (key-value store for admin configuration)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key   text NOT NULL PRIMARY KEY,
  value text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can write; authenticated users can read (needed to load pixel)
CREATE POLICY "Admins can manage app_settings"
  ON public.app_settings FOR ALL TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

CREATE POLICY "Authenticated can read app_settings"
  ON public.app_settings FOR SELECT TO authenticated
  USING (true);

-- 3. Seed default settings
INSERT INTO public.app_settings (key, value) VALUES
  ('facebook_pixel_id', NULL)
ON CONFLICT (key) DO NOTHING;
