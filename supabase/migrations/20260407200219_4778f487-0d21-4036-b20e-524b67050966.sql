
-- Add new columns to peptides table for multi-source integration
ALTER TABLE public.peptides
  ADD COLUMN IF NOT EXISTS sequence text,
  ADD COLUMN IF NOT EXISTS sequence_length integer,
  ADD COLUMN IF NOT EXISTS organism text,
  ADD COLUMN IF NOT EXISTS biological_activity text[],
  ADD COLUMN IF NOT EXISTS structure_info jsonb,
  ADD COLUMN IF NOT EXISTS source_origins text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS confidence_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ncbi_protein_id text,
  ADD COLUMN IF NOT EXISTS dramp_id text,
  ADD COLUMN IF NOT EXISTS apd_id text,
  ADD COLUMN IF NOT EXISTS peptipedia_id text,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamp with time zone;

-- Create indexes for external IDs
CREATE INDEX IF NOT EXISTS idx_peptides_ncbi_protein_id ON public.peptides(ncbi_protein_id) WHERE ncbi_protein_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_peptides_dramp_id ON public.peptides(dramp_id) WHERE dramp_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_peptides_apd_id ON public.peptides(apd_id) WHERE apd_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_peptides_peptipedia_id ON public.peptides(peptipedia_id) WHERE peptipedia_id IS NOT NULL;

-- Create peptide_references table for detailed scientific references
CREATE TABLE public.peptide_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  peptide_id uuid NOT NULL REFERENCES public.peptides(id) ON DELETE CASCADE,
  pmid text,
  title text NOT NULL,
  authors text[],
  journal text,
  year integer,
  abstract_text text,
  doi text,
  source text NOT NULL DEFAULT 'pubmed',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(peptide_id, pmid)
);

CREATE INDEX idx_peptide_references_peptide_id ON public.peptide_references(peptide_id);
CREATE INDEX idx_peptide_references_pmid ON public.peptide_references(pmid) WHERE pmid IS NOT NULL;

ALTER TABLE public.peptide_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "References viewable by everyone"
  ON public.peptide_references FOR SELECT USING (true);

CREATE POLICY "Admins can insert references"
  ON public.peptide_references FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update references"
  ON public.peptide_references FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete references"
  ON public.peptide_references FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create sync_log table
CREATE TABLE public.sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  status text NOT NULL DEFAULT 'running',
  records_processed integer DEFAULT 0,
  records_added integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  error_message text,
  details jsonb DEFAULT '{}'::jsonb,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync logs"
  ON public.sync_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert sync logs"
  ON public.sync_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update sync logs"
  ON public.sync_log FOR UPDATE
  USING (true);

-- Trigger for peptide_references updated_at
CREATE TRIGGER update_peptide_references_updated_at
  BEFORE UPDATE ON public.peptide_references
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
