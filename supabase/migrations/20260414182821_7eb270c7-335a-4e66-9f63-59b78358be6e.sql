
CREATE TABLE public.peptide_source_checks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  peptide_id uuid NOT NULL REFERENCES public.peptides(id) ON DELETE CASCADE,
  source_provider text NOT NULL,
  lookup_status text NOT NULL DEFAULT 'not_checked',
  confidence_score integer DEFAULT 0,
  matched_record_id text,
  matched_record_name text,
  suggestion_generated boolean NOT NULL DEFAULT false,
  suggestion_id uuid,
  notes text,
  last_checked_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(peptide_id, source_provider)
);

ALTER TABLE public.peptide_source_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage peptide_source_checks"
  ON public.peptide_source_checks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_peptide_source_checks_updated_at
  BEFORE UPDATE ON public.peptide_source_checks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_peptide_source_checks_peptide ON public.peptide_source_checks(peptide_id);
CREATE INDEX idx_peptide_source_checks_status ON public.peptide_source_checks(lookup_status);
