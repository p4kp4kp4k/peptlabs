
DROP VIEW IF EXISTS public.v_peptides_visible;

CREATE VIEW public.v_peptides_visible
WITH (security_invoker = true)
AS
SELECT * FROM public.peptides
WHERE tier = 'essential'
   OR (tier = 'advanced' AND is_pro() = true)
   OR has_role('admin'::app_role);
