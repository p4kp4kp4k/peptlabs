
-- =============================================
-- SYNC INTELLIGENCE TABLES
-- =============================================

-- 1. Integration Sources
CREATE TABLE public.integration_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  api_base_url text,
  api_type text NOT NULL DEFAULT 'rest',
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 50,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at timestamptz,
  last_sync_status text DEFAULT 'never',
  records_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage integration_sources" ON public.integration_sources
  FOR ALL TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

-- 2. Sync Runs
CREATE TABLE public.sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.integration_sources(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'running',
  mode text NOT NULL DEFAULT 'manual',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  records_processed integer NOT NULL DEFAULT 0,
  records_added integer NOT NULL DEFAULT 0,
  records_updated integer NOT NULL DEFAULT 0,
  conflicts_found integer NOT NULL DEFAULT 0,
  errors_count integer NOT NULL DEFAULT 0,
  error_message text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sync_runs" ON public.sync_runs
  FOR ALL TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

-- 3. Detected Changes
CREATE TABLE public.detected_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_run_id uuid REFERENCES public.sync_runs(id) ON DELETE SET NULL,
  source_id uuid NOT NULL REFERENCES public.integration_sources(id) ON DELETE CASCADE,
  peptide_id uuid REFERENCES public.peptides(id) ON DELETE SET NULL,
  change_type text NOT NULL,
  field_name text,
  old_value text,
  new_value text,
  severity text NOT NULL DEFAULT 'low',
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.detected_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage detected_changes" ON public.detected_changes
  FOR ALL TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

CREATE INDEX idx_detected_changes_status ON public.detected_changes(status);
CREATE INDEX idx_detected_changes_severity ON public.detected_changes(severity);
CREATE INDEX idx_detected_changes_source ON public.detected_changes(source_id);

-- 4. Audit Runs
CREATE TABLE public.audit_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'running',
  scope text NOT NULL DEFAULT 'full',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  total_findings integer NOT NULL DEFAULT 0,
  critical_count integer NOT NULL DEFAULT 0,
  medium_count integer NOT NULL DEFAULT 0,
  low_count integer NOT NULL DEFAULT 0,
  resolved_count integer NOT NULL DEFAULT 0,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage audit_runs" ON public.audit_runs
  FOR ALL TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

-- 5. Audit Findings
CREATE TABLE public.audit_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_run_id uuid NOT NULL REFERENCES public.audit_runs(id) ON DELETE CASCADE,
  peptide_id uuid REFERENCES public.peptides(id) ON DELETE SET NULL,
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'low',
  title text NOT NULL,
  description text,
  source_a text,
  source_b text,
  value_a text,
  value_b text,
  recommendation text,
  status text NOT NULL DEFAULT 'open',
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage audit_findings" ON public.audit_findings
  FOR ALL TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

CREATE INDEX idx_audit_findings_severity ON public.audit_findings(severity);
CREATE INDEX idx_audit_findings_status ON public.audit_findings(status);
CREATE INDEX idx_audit_findings_run ON public.audit_findings(audit_run_id);

-- 6. Peptide Import Queue
CREATE TABLE public.peptide_import_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.integration_sources(id) ON DELETE CASCADE,
  sync_run_id uuid REFERENCES public.sync_runs(id) ON DELETE SET NULL,
  external_id text,
  name text NOT NULL,
  slug text NOT NULL,
  collected_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence_score integer NOT NULL DEFAULT 0,
  is_ready boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  published_peptide_id uuid REFERENCES public.peptides(id) ON DELETE SET NULL,
  reviewed_by uuid,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.peptide_import_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage peptide_import_queue" ON public.peptide_import_queue
  FOR ALL TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

CREATE INDEX idx_import_queue_status ON public.peptide_import_queue(status);

-- 7. Source Priority Rules
CREATE TABLE public.source_priority_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.integration_sources(id) ON DELETE CASCADE,
  data_domain text NOT NULL,
  priority integer NOT NULL DEFAULT 50,
  is_authoritative boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_id, data_domain)
);

ALTER TABLE public.source_priority_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage source_priority_rules" ON public.source_priority_rules
  FOR ALL TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

-- 8. Sync Settings
CREATE TABLE public.sync_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sync_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage sync_settings" ON public.sync_settings
  FOR ALL TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

-- 9. Admin Notifications
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text,
  severity text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage admin_notifications" ON public.admin_notifications
  FOR ALL TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

CREATE INDEX idx_admin_notifications_read ON public.admin_notifications(is_read);

-- Triggers for updated_at
CREATE TRIGGER update_integration_sources_updated_at BEFORE UPDATE ON public.integration_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_peptide_import_queue_updated_at BEFORE UPDATE ON public.peptide_import_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_source_priority_rules_updated_at BEFORE UPDATE ON public.source_priority_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sync_settings_updated_at BEFORE UPDATE ON public.sync_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default integration sources
INSERT INTO public.integration_sources (name, slug, api_base_url, api_type, priority) VALUES
  ('PubMed', 'pubmed', 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/', 'rest', 90),
  ('UniProt', 'uniprot', 'https://rest.uniprot.org/uniprotkb/', 'rest', 95),
  ('PDB', 'pdb', 'https://data.rcsb.org/rest/v1/', 'rest', 85),
  ('openFDA', 'openfda', 'https://api.fda.gov/', 'rest', 80),
  ('Peptipedia', 'peptipedia', NULL, 'dataset', 70),
  ('DRAMP', 'dramp', NULL, 'dataset', 70),
  ('APD', 'apd', NULL, 'dataset', 70);

-- Seed default sync settings
INSERT INTO public.sync_settings (key, value, description) VALUES
  ('sync_mode', '"manual"', 'Modo de sincronização: manual, semi_auto, auto'),
  ('auto_publish', 'false', 'Publicar peptídeos novos automaticamente'),
  ('min_confidence_score', '70', 'Score mínimo de confiança para auto-publicação'),
  ('sync_interval_hours', '24', 'Intervalo entre sincronizações automáticas em horas');

-- Seed default source priority rules
INSERT INTO public.source_priority_rules (source_id, data_domain, priority, is_authoritative) VALUES
  ((SELECT id FROM public.integration_sources WHERE slug = 'uniprot'), 'sequence', 100, true),
  ((SELECT id FROM public.integration_sources WHERE slug = 'uniprot'), 'function', 90, true),
  ((SELECT id FROM public.integration_sources WHERE slug = 'pdb'), 'structure', 100, true),
  ((SELECT id FROM public.integration_sources WHERE slug = 'pubmed'), 'literature', 100, true),
  ((SELECT id FROM public.integration_sources WHERE slug = 'openfda'), 'regulation', 100, true),
  ((SELECT id FROM public.integration_sources WHERE slug = 'openfda'), 'safety', 95, true);
