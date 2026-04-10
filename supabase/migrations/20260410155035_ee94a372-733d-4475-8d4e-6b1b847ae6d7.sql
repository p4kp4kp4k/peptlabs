-- Add billing_type to entitlements to differentiate monthly vs lifetime PRO
ALTER TABLE public.entitlements
ADD COLUMN IF NOT EXISTS billing_type text NOT NULL DEFAULT 'monthly';

-- Add a check constraint for valid values
ALTER TABLE public.entitlements
ADD CONSTRAINT entitlements_billing_type_check
CHECK (billing_type IN ('monthly', 'lifetime'));