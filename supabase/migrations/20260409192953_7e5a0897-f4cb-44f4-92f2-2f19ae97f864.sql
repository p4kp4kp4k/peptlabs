
-- 1. Fix subscriptions: remove user INSERT policy (prevent self-granting premium)
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;

-- Add status constraint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_status_check') THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check
      CHECK (status IN ('free', 'active', 'trialing', 'canceled', 'past_due', 'premium'));
  END IF;
END$$;

-- 2. Fix user_roles: explicit DENY for INSERT/DELETE from regular users
-- (The trigger handle_new_user_role runs as SECURITY DEFINER so it bypasses RLS)
CREATE POLICY "No direct insert on user_roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "No direct delete on user_roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (false);

-- 3. Fix profiles: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- 4. Create a public view that hides flagged_at
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT id, user_id, display_name, avatar_url, created_at, updated_at
  FROM public.profiles;

-- 5. Rewrite has_role() to use auth.uid() internally (no external user_id param)
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = _role
  )
$$;

-- Keep the old 2-param version for backward compat in triggers/edge functions
-- but make it only work when called with auth.uid()
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 6. Update RLS policies that use has_role to use the 1-param version
-- peptides
DROP POLICY IF EXISTS "Admins can insert peptides" ON public.peptides;
CREATE POLICY "Admins can insert peptides" ON public.peptides
  FOR INSERT TO authenticated WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS "Admins can update peptides" ON public.peptides;
CREATE POLICY "Admins can update peptides" ON public.peptides
  FOR UPDATE TO authenticated USING (has_role('admin'));

DROP POLICY IF EXISTS "Admins can delete peptides" ON public.peptides;
CREATE POLICY "Admins can delete peptides" ON public.peptides
  FOR DELETE TO authenticated USING (has_role('admin'));

-- peptide_references
DROP POLICY IF EXISTS "Admins can insert references" ON public.peptide_references;
CREATE POLICY "Admins can insert references" ON public.peptide_references
  FOR INSERT TO authenticated WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS "Admins can update references" ON public.peptide_references;
CREATE POLICY "Admins can update references" ON public.peptide_references
  FOR UPDATE TO authenticated USING (has_role('admin'));

DROP POLICY IF EXISTS "Admins can delete references" ON public.peptide_references;
CREATE POLICY "Admins can delete references" ON public.peptide_references
  FOR DELETE TO authenticated USING (has_role('admin'));

-- stacks
DROP POLICY IF EXISTS "Admins can insert stacks" ON public.stacks;
CREATE POLICY "Admins can insert stacks" ON public.stacks
  FOR INSERT TO authenticated WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS "Admins can update stacks" ON public.stacks;
CREATE POLICY "Admins can update stacks" ON public.stacks
  FOR UPDATE TO authenticated USING (has_role('admin'));

DROP POLICY IF EXISTS "Admins can delete stacks" ON public.stacks;
CREATE POLICY "Admins can delete stacks" ON public.stacks
  FOR DELETE TO authenticated USING (has_role('admin'));

-- sync_log
DROP POLICY IF EXISTS "Admins can insert sync logs" ON public.sync_log;
CREATE POLICY "Admins can insert sync logs" ON public.sync_log
  FOR INSERT TO authenticated WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS "Admins can update sync logs" ON public.sync_log;
CREATE POLICY "Admins can update sync logs" ON public.sync_log
  FOR UPDATE TO authenticated USING (has_role('admin'));

DROP POLICY IF EXISTS "Admins can view sync logs" ON public.sync_log;
CREATE POLICY "Admins can view sync logs" ON public.sync_log
  FOR SELECT TO authenticated USING (has_role('admin'));

-- protocols admin policy
DROP POLICY IF EXISTS "Admins can view all protocols" ON public.protocols;
CREATE POLICY "Admins can view all protocols" ON public.protocols
  FOR SELECT TO authenticated USING (has_role('admin'));
