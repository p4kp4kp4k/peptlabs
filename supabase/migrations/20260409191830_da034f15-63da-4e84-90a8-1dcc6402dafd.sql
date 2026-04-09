
-- 1. Add soft delete columns
ALTER TABLE public.protocols ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.stacks ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE public.calculations ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 2. Add flagged_at to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS flagged_at timestamptz DEFAULT NULL;

-- 3. Add 'security' to history_kind enum
ALTER TYPE public.history_kind ADD VALUE IF NOT EXISTS 'security';

-- 4. Create indexes for soft delete filtering
CREATE INDEX IF NOT EXISTS idx_protocols_deleted_at ON public.protocols (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_stacks_deleted_at ON public.stacks (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_calculations_deleted_at ON public.calculations (deleted_at) WHERE deleted_at IS NULL;

-- 5. Unique constraint on peptides slug
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'peptides_slug_unique') THEN
    ALTER TABLE public.peptides ADD CONSTRAINT peptides_slug_unique UNIQUE (slug);
  END IF;
END$$;

-- 6. Unique constraint on subscriptions user_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_user_id_unique') THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);
  END IF;
END$$;

-- 7. Audit log trigger function
CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _action text;
  _metadata jsonb;
BEGIN
  -- Determine user
  _user_id := COALESCE(
    CASE TG_OP
      WHEN 'DELETE' THEN OLD.user_id
      ELSE NEW.user_id
    END,
    auth.uid()
  );

  IF _user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  _action := TG_OP || '_' || TG_TABLE_NAME;

  _metadata := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'operation', TG_OP,
    'record_id', COALESCE(
      CASE TG_OP WHEN 'DELETE' THEN OLD.id ELSE NEW.id END,
      gen_random_uuid()
    )::text,
    'timestamp', now()::text
  );

  -- For soft deletes, note it
  IF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
    _action := 'SOFT_DELETE_' || TG_TABLE_NAME;
  END IF;

  INSERT INTO public.history (user_id, kind, metadata, ref_id)
  VALUES (
    _user_id,
    'security',
    _metadata,
    CASE TG_OP WHEN 'DELETE' THEN OLD.id ELSE NEW.id END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 8. Attach audit triggers
DROP TRIGGER IF EXISTS audit_protocols ON public.protocols;
CREATE TRIGGER audit_protocols
  AFTER INSERT OR UPDATE OR DELETE ON public.protocols
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

DROP TRIGGER IF EXISTS audit_calculations ON public.calculations;
CREATE TRIGGER audit_calculations
  AFTER INSERT OR UPDATE OR DELETE ON public.calculations
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- 9. Update protocols RLS to filter soft-deleted by default
-- Users should only see non-deleted protocols
DROP POLICY IF EXISTS "Users can view own protocols" ON public.protocols;
CREATE POLICY "Users can view own protocols"
  ON public.protocols FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Admin can see all including deleted (for trash/restore)
CREATE POLICY "Admins can view all protocols"
  ON public.protocols FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- 10. Update calculations RLS to filter soft-deleted
DROP POLICY IF EXISTS "Users can view own calculations" ON public.calculations;
CREATE POLICY "Users can view own calculations"
  ON public.calculations FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- 11. Add UPDATE policy for calculations (needed for soft delete)
CREATE POLICY "Users can update own calculations"
  ON public.calculations FOR UPDATE
  USING (auth.uid() = user_id);
