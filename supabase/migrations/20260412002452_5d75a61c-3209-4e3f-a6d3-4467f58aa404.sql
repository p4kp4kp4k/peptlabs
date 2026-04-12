
CREATE OR REPLACE FUNCTION public.decrement_stock_safe(
  p_variant_id uuid,
  p_quantity integer
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_stock integer;
BEGIN
  UPDATE public.product_variants
  SET stock = GREATEST(0, stock - p_quantity),
      updated_at = now()
  WHERE id = p_variant_id
  RETURNING stock INTO v_new_stock;

  RETURN COALESCE(v_new_stock, -1);
END;
$$;
