
-- Create calculations table
CREATE TABLE public.calculations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calculations" ON public.calculations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own calculations" ON public.calculations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own calculations" ON public.calculations FOR DELETE USING (auth.uid() = user_id);

-- Create history table
CREATE TYPE public.history_kind AS ENUM ('protocol', 'stack', 'calculation', 'compare', 'ai');

CREATE TABLE public.history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind public.history_kind NOT NULL,
  ref_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history" ON public.history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own history" ON public.history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own history" ON public.history FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_history_user_id ON public.history(user_id);
CREATE INDEX idx_history_kind ON public.history(kind);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'free',
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add goals column to peptides if not exists
ALTER TABLE public.peptides ADD COLUMN IF NOT EXISTS goals TEXT[] DEFAULT '{}';
ALTER TABLE public.peptides ADD COLUMN IF NOT EXISTS application TEXT;

-- Trigger for subscriptions updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create auto-subscription on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, status)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_subscription
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_subscription();
