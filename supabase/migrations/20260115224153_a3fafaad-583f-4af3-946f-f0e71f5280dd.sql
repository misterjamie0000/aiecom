-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  gstin TEXT,
  pan TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_ifsc TEXT,
  payment_terms TEXT DEFAULT '30 days',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ordered', 'partial', 'received', 'cancelled')),
  order_date DATE,
  expected_date DATE,
  received_date DATE,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  received_quantity INTEGER NOT NULL DEFAULT 0,
  unit_price NUMERIC(12,2) NOT NULL,
  tax_percent NUMERIC(5,2) NOT NULL DEFAULT 18,
  total_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers
CREATE POLICY "Admins can manage suppliers" ON public.suppliers
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active suppliers" ON public.suppliers
  FOR SELECT USING (is_active = true);

-- RLS Policies for purchase_orders
CREATE POLICY "Admins can manage purchase orders" ON public.purchase_orders
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for purchase_order_items
CREATE POLICY "Admins can manage PO items" ON public.purchase_order_items
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  seq_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(po_number FROM 4) AS INTEGER)), 0) + 1 INTO seq_num
  FROM purchase_orders
  WHERE po_number LIKE 'PO-%';
  
  new_number := 'PO-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update inventory when PO is received
CREATE OR REPLACE FUNCTION update_inventory_on_po_receive()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update inventory when status changes to 'received' or 'partial'
  IF (NEW.status IN ('received', 'partial') AND OLD.status NOT IN ('received', 'partial')) THEN
    -- Update product stock quantities based on received quantities
    UPDATE products p
    SET stock_quantity = p.stock_quantity + poi.received_quantity,
        updated_at = now()
    FROM purchase_order_items poi
    WHERE poi.po_id = NEW.id
      AND poi.product_id = p.id
      AND poi.received_quantity > 0;
    
    -- If fully received, set received_date
    IF NEW.status = 'received' THEN
      NEW.received_date := CURRENT_DATE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for inventory update
CREATE TRIGGER trigger_update_inventory_on_po_receive
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_po_receive();

-- Function to update PO totals
CREATE OR REPLACE FUNCTION update_po_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_subtotal NUMERIC(12,2);
  v_tax_amount NUMERIC(12,2);
BEGIN
  SELECT 
    COALESCE(SUM(total_price), 0),
    COALESCE(SUM(total_price * tax_percent / 100), 0)
  INTO v_subtotal, v_tax_amount
  FROM purchase_order_items
  WHERE po_id = COALESCE(NEW.po_id, OLD.po_id);
  
  UPDATE purchase_orders
  SET subtotal = v_subtotal,
      tax_amount = v_tax_amount,
      total_amount = v_subtotal + v_tax_amount + shipping_amount - discount_amount,
      updated_at = now()
  WHERE id = COALESCE(NEW.po_id, OLD.po_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for PO totals update
CREATE TRIGGER trigger_update_po_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.purchase_order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_po_totals();

-- Update timestamps trigger for suppliers
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update timestamps trigger for purchase_orders
CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();