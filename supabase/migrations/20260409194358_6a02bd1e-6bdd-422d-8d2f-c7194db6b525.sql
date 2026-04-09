
-- 1. Block UPDATE on user_roles to prevent privilege escalation
CREATE POLICY "No direct update on user_roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (false);

-- 2. Restrict profiles SELECT to own profile only (replace overly permissive policy)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (has_role('admin'::app_role));
