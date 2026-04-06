ALTER TABLE public.peptides
  ADD COLUMN IF NOT EXISTS dosage_table jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS protocol_phases jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reconstitution_steps text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS mechanism_points text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS interactions jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stacks jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS scientific_references jsonb DEFAULT NULL;