
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
  SET stock = stock - p_quantity,
      updated_at = now()
  WHERE id = p_variant_id
    AND stock >= p_quantity
  RETURNING stock INTO v_new_stock;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  RETURN v_new_stock;
END;
$$;
