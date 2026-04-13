
CREATE TABLE public.plan_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id text NOT NULL,
  label text NOT NULL,
  checkout_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active plan links"
  ON public.plan_links FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage plan links"
  ON public.plan_links FOR ALL TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

-- Seed default rows
INSERT INTO public.plan_links (plan_id, label, checkout_url, is_active) VALUES
  ('pro_monthly', 'PRO Mensal', '', false),
  ('pro_lifetime', 'PRO Vitalício', '', false);
