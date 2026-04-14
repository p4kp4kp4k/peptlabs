
-- Bulk update runs
CREATE TABLE public.bulk_update_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by uuid,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  confidence_threshold integer NOT NULL DEFAULT 75,
  source_priority_mode text NOT NULL DEFAULT 'confidence_then_recency',
  applied_count integer NOT NULL DEFAULT 0,
  skipped_count integer NOT NULL DEFAULT 0,
  reverted_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bulk_update_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bulk_update_runs"
  ON public.bulk_update_runs FOR ALL TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

-- Bulk update items
CREATE TABLE public.bulk_update_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.bulk_update_runs(id) ON DELETE CASCADE,
  peptide_id uuid REFERENCES public.peptides(id) ON DELETE SET NULL,
  finding_id uuid REFERENCES public.audit_findings(id) ON DELETE SET NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  source_provider text,
  source_reference text,
  confidence_score integer NOT NULL DEFAULT 0,
  action_taken text NOT NULL DEFAULT 'pending',
  skip_reason text,
  was_reverted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bulk_update_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bulk_update_items"
  ON public.bulk_update_items FOR ALL TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

CREATE INDEX idx_bulk_update_items_run_id ON public.bulk_update_items(run_id);
CREATE INDEX idx_bulk_update_items_peptide_id ON public.bulk_update_items(peptide_id);
