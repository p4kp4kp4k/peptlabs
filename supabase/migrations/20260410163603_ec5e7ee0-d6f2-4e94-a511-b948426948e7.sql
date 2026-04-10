
-- Add columns to subscriptions for multi-gateway support
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS payment_provider text DEFAULT null,
  ADD COLUMN IF NOT EXISTS plan_id text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false;

-- billing_events: audit trail for all billing operations
CREATE TABLE IF NOT EXISTS public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  provider text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own billing events"
  ON public.billing_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "No client insert on billing_events"
  ON public.billing_events FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "No client update on billing_events"
  ON public.billing_events FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "No client delete on billing_events"
  ON public.billing_events FOR DELETE
  TO authenticated
  USING (false);

-- webhook_events: raw webhook payloads for idempotency/audit
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_type text NOT NULL,
  provider_event_id text,
  payload jsonb DEFAULT '{}'::jsonb,
  processed boolean DEFAULT false,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook events"
  ON public.webhook_events FOR SELECT
  TO authenticated
  USING (has_role('admin'::app_role));

CREATE POLICY "No client insert on webhook_events"
  ON public.webhook_events FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "No client update on webhook_events"
  ON public.webhook_events FOR UPDATE
  TO authenticated
  USING (false);

-- gateway_settings: config for each payment provider
CREATE TABLE IF NOT EXISTS public.gateway_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  is_active boolean DEFAULT false,
  environment text DEFAULT 'sandbox',
  webhook_url text,
  config jsonb DEFAULT '{}'::jsonb,
  configured_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gateway_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view gateway settings"
  ON public.gateway_settings FOR SELECT
  TO authenticated
  USING (has_role('admin'::app_role));

CREATE POLICY "Admins can manage gateway settings"
  ON public.gateway_settings FOR ALL
  TO authenticated
  USING (has_role('admin'::app_role))
  WITH CHECK (has_role('admin'::app_role));

-- Seed default gateway entries
INSERT INTO public.gateway_settings (provider, is_active, environment)
VALUES 
  ('stripe', false, 'sandbox'),
  ('mercadopago', false, 'sandbox')
ON CONFLICT (provider) DO NOTHING;

-- Create index for billing_events lookup
CREATE INDEX IF NOT EXISTS idx_billing_events_user_id ON public.billing_events (user_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON public.billing_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_id ON public.webhook_events (provider_event_id);
