ALTER TABLE public.usage_counters
  ADD COLUMN IF NOT EXISTS calcs_made integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stacks_viewed integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS templates_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interactions_checked integer NOT NULL DEFAULT 0;