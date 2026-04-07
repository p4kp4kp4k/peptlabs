
CREATE TABLE public.stacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  category TEXT NOT NULL,
  description TEXT,
  peptides JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration TEXT,
  timing TEXT,
  benefits TEXT[] DEFAULT '{}',
  warnings TEXT[] DEFAULT '{}',
  icon TEXT DEFAULT 'layers',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stacks viewable by everyone"
ON public.stacks FOR SELECT USING (true);

CREATE POLICY "Admins can insert stacks"
ON public.stacks FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update stacks"
ON public.stacks FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete stacks"
ON public.stacks FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_stacks_updated_at
BEFORE UPDATE ON public.stacks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
