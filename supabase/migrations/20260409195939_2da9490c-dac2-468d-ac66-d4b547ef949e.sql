
-- 1. Create plan enum
DO $$ BEGIN
  CREATE TYPE public.plan_tier AS ENUM ('free', 'starter', 'pro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.content_tier AS ENUM ('essential', 'advanced');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.access_level AS ENUM ('starter', 'pro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create entitlements table
CREATE TABLE IF NOT EXISTS public.entitlements (
  user_id uuid PRIMARY KEY,
  plan text NOT NULL DEFAULT 'free',
  is_active boolean NOT NULL DEFAULT false,
  current_period_end timestamptz,
  limits jsonb NOT NULL DEFAULT '{"max_protocols_month":0,"compare_limit":0,"history_days":0,"export_level":"none"}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;

-- Users can only view their own entitlements
CREATE POLICY "Users can view own entitlements"
  ON public.entitlements FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Block all client writes
CREATE POLICY "No client insert on entitlements"
  ON public.entitlements FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "No client update on entitlements"
  ON public.entitlements FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "No client delete on entitlements"
  ON public.entitlements FOR DELETE TO authenticated
  USING (false);

-- 3. Create usage_counters table
CREATE TABLE IF NOT EXISTS public.usage_counters (
  user_id uuid NOT NULL,
  month text NOT NULL,
  protocols_created int NOT NULL DEFAULT 0,
  comparisons_made int NOT NULL DEFAULT 0,
  exports_made int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, month)
);

ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON public.usage_counters FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "No client insert on usage_counters"
  ON public.usage_counters FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "No client update on usage_counters"
  ON public.usage_counters FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "No client delete on usage_counters"
  ON public.usage_counters FOR DELETE TO authenticated
  USING (false);

-- 4. Add tier and access_level to peptides
ALTER TABLE public.peptides ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'essential';
ALTER TABLE public.peptides ADD COLUMN IF NOT EXISTS access_level text NOT NULL DEFAULT 'starter';

-- 5. Create protocol_templates table
CREATE TABLE IF NOT EXISTS public.protocol_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  access_level text NOT NULL DEFAULT 'starter',
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.protocol_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates viewable by plan"
  ON public.protocol_templates FOR SELECT TO authenticated
  USING (
    access_level = 'starter'
    OR (access_level = 'pro' AND EXISTS (
      SELECT 1 FROM public.entitlements
      WHERE user_id = auth.uid() AND plan = 'pro' AND is_active = true
    ))
  );

CREATE POLICY "Admins can manage templates"
  ON public.protocol_templates FOR ALL TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

-- 6. Create is_pro() function
CREATE OR REPLACE FUNCTION public.is_pro()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entitlements
    WHERE user_id = auth.uid()
      AND plan = 'pro'
      AND is_active = true
  )
$$;

-- 7. Create is_starter_or_above() function
CREATE OR REPLACE FUNCTION public.is_starter_or_above()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.entitlements
    WHERE user_id = auth.uid()
      AND plan IN ('starter', 'pro')
      AND is_active = true
  )
$$;

-- 8. Update peptides SELECT policy to enforce tier gating
DROP POLICY IF EXISTS "Peptides viewable by everyone" ON public.peptides;

CREATE POLICY "Peptides viewable by tier"
  ON public.peptides FOR SELECT
  USING (
    tier = 'essential'
    OR (tier = 'advanced' AND is_pro() = true)
    OR has_role('admin'::app_role)
  );

-- 9. Secure view for peptides
CREATE OR REPLACE VIEW public.v_peptides_visible AS
SELECT * FROM public.peptides
WHERE tier = 'essential'
   OR (tier = 'advanced' AND is_pro() = true)
   OR has_role('admin'::app_role);

-- 10. Trigger to auto-create entitlements for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.entitlements (user_id, plan, is_active, limits)
  VALUES (
    NEW.id,
    'free',
    false,
    '{"max_protocols_month":0,"compare_limit":0,"history_days":0,"export_level":"none"}'::jsonb
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_entitlements ON auth.users;
CREATE TRIGGER on_auth_user_created_entitlements
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_entitlements();

-- 11. Update timestamp trigger for entitlements
CREATE TRIGGER update_entitlements_updated_at
  BEFORE UPDATE ON public.entitlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_protocol_templates_updated_at
  BEFORE UPDATE ON public.protocol_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
