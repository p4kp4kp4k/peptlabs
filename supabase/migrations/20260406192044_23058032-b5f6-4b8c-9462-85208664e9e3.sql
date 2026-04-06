ALTER TABLE public.peptides
  ADD COLUMN IF NOT EXISTS classification text,
  ADD COLUMN IF NOT EXISTS evidence_level text,
  ADD COLUMN IF NOT EXISTS half_life text,
  ADD COLUMN IF NOT EXISTS reconstitution text,
  ADD COLUMN IF NOT EXISTS alternative_names text[],
  ADD COLUMN IF NOT EXISTS timeline jsonb;