
-- Performance indexes for frequently queried columns

-- usage_counters: queried every feature check
CREATE INDEX IF NOT EXISTS idx_usage_counters_user_month ON public.usage_counters (user_id, month);

-- history: queried for rate limiting and audit
CREATE INDEX IF NOT EXISTS idx_history_user_kind_created ON public.history (user_id, kind, created_at DESC);

-- entitlements: queried on every authenticated request
CREATE INDEX IF NOT EXISTS idx_entitlements_user_id ON public.entitlements (user_id);

-- protocols: queried for user's protocol list
CREATE INDEX IF NOT EXISTS idx_protocols_user_deleted ON public.protocols (user_id, deleted_at) WHERE deleted_at IS NULL;

-- peptides: queried by slug on detail page
CREATE INDEX IF NOT EXISTS idx_peptides_slug ON public.peptides (slug);

-- peptides: queried by tier for RLS policy
CREATE INDEX IF NOT EXISTS idx_peptides_tier ON public.peptides (tier);

-- calculations: queried by user
CREATE INDEX IF NOT EXISTS idx_calculations_user_deleted ON public.calculations (user_id, deleted_at) WHERE deleted_at IS NULL;
