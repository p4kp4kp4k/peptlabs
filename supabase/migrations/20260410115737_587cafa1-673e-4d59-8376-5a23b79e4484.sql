CREATE OR REPLACE FUNCTION public.handle_new_user_entitlements()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.entitlements (user_id, plan, is_active, limits)
  VALUES (
    NEW.id,
    'free',
    true,
    '{"max_protocols_month":1,"compare_limit":1,"history_days":0,"export_level":"basic","calc_limit":1,"stack_limit":1,"template_limit":1,"interaction_limit":1}'::jsonb
  );
  RETURN NEW;
END;
$function$;