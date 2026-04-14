
-- Audit corrections table
CREATE TABLE public.audit_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_run_id uuid REFERENCES public.audit_runs(id),
  finding_id uuid REFERENCES public.audit_findings(id),
  peptide_id uuid REFERENCES public.peptides(id),
  field_name text NOT NULL,
  correction_type text NOT NULL DEFAULT 'add',
  old_value text,
  new_value text,
  source_provider text,
  source_record_id text,
  confidence_score integer DEFAULT 0,
  confidence_level text DEFAULT 'low',
  approved_by uuid,
  approved_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage audit_corrections"
  ON public.audit_corrections FOR ALL TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

-- Peptide change history table
CREATE TABLE public.peptide_change_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  peptide_id uuid NOT NULL REFERENCES public.peptides(id),
  change_origin text NOT NULL DEFAULT 'audit_correction',
  change_summary text,
  before_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  applied_by uuid,
  applied_at timestamptz NOT NULL DEFAULT now(),
  correction_id uuid REFERENCES public.audit_corrections(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.peptide_change_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage peptide_change_history"
  ON public.peptide_change_history FOR ALL TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));
