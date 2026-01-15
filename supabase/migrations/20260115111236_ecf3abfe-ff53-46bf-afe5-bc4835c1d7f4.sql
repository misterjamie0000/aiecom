-- Create stock movements table for tracking inventory history
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('adjustment', 'order', 'return', 'restock', 'damage', 'transfer')),
  quantity INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reason TEXT,
  reference_id UUID, -- Can reference order_id or return_request_id
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Admins can manage stock movements
CREATE POLICY "Admins can manage stock movements"
  ON public.stock_movements
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to log stock movements
CREATE OR REPLACE FUNCTION public.log_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity THEN
    INSERT INTO public.stock_movements (
      product_id,
      movement_type,
      quantity,
      previous_quantity,
      new_quantity,
      reason
    ) VALUES (
      NEW.id,
      'adjustment',
      NEW.stock_quantity - OLD.stock_quantity,
      OLD.stock_quantity,
      NEW.stock_quantity,
      'Direct stock update'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for stock movement logging
CREATE TRIGGER log_product_stock_movement
  AFTER UPDATE OF stock_quantity ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.log_stock_movement();

-- Create index for better query performance
CREATE INDEX idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON public.stock_movements(created_at DESC);