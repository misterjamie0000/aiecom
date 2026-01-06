-- Fix function search_path for security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  prefix TEXT := 'ORD';
  year_suffix TEXT := TO_CHAR(NOW(), 'YY');
  seq_num INTEGER;
  order_number TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 6) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.orders
  WHERE order_number LIKE prefix || year_suffix || '%';
  
  order_number := prefix || year_suffix || LPAD(seq_num::TEXT, 6, '0');
  RETURN order_number;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;