-- Create customer_segments table
CREATE TABLE public.customer_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  segment_type TEXT NOT NULL DEFAULT 'manual',
  criteria JSONB DEFAULT '{}',
  color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create customer_segment_members table
CREATE TABLE public.customer_segment_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  segment_id UUID NOT NULL REFERENCES public.customer_segments(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by TEXT DEFAULT 'system',
  UNIQUE(customer_id, segment_id)
);

-- Enable RLS
ALTER TABLE public.customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_segment_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for customer_segments (admin only)
CREATE POLICY "Admins can manage customer segments"
ON public.customer_segments
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for customer_segment_members (admin only)
CREATE POLICY "Admins can manage segment members"
ON public.customer_segment_members
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default segments
INSERT INTO public.customer_segments (name, description, segment_type, criteria, color) VALUES
('VIP', 'High-value customers with total orders above ₹50,000 or more than 10 orders', 'auto', '{"min_total_spent": 50000, "min_order_count": 10, "logic": "or"}', '#f59e0b'),
('New', 'Customers who joined in the last 30 days', 'auto', '{"days_since_joined": 30}', '#22c55e'),
('Inactive', 'Customers with no orders in the last 90 days', 'auto', '{"days_since_last_order": 90}', '#ef4444'),
('Regular', 'Customers with 3-10 orders', 'auto', '{"min_order_count": 3, "max_order_count": 10, "logic": "and"}', '#6366f1');

-- Create function to calculate customer stats
CREATE OR REPLACE FUNCTION public.get_customer_stats(p_customer_id UUID)
RETURNS TABLE (
  total_orders BIGINT,
  total_spent NUMERIC,
  first_order_date TIMESTAMP WITH TIME ZONE,
  last_order_date TIMESTAMP WITH TIME ZONE,
  days_since_joined INTEGER,
  days_since_last_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(o.id)::BIGINT as total_orders,
    COALESCE(SUM(o.total_amount), 0)::NUMERIC as total_spent,
    MIN(o.created_at) as first_order_date,
    MAX(o.created_at) as last_order_date,
    EXTRACT(DAY FROM (now() - p.created_at))::INTEGER as days_since_joined,
    CASE 
      WHEN MAX(o.created_at) IS NULL THEN NULL
      ELSE EXTRACT(DAY FROM (now() - MAX(o.created_at)))::INTEGER
    END as days_since_last_order
  FROM public.profiles p
  LEFT JOIN public.orders o ON o.user_id = p.id AND o.status NOT IN ('cancelled', 'refunded')
  WHERE p.id = p_customer_id
  GROUP BY p.id, p.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to auto-assign segments to a customer
CREATE OR REPLACE FUNCTION public.assign_customer_segments(p_customer_id UUID)
RETURNS void AS $$
DECLARE
  v_segment RECORD;
  v_stats RECORD;
  v_should_assign BOOLEAN;
BEGIN
  SELECT * INTO v_stats FROM public.get_customer_stats(p_customer_id);
  
  FOR v_segment IN 
    SELECT * FROM public.customer_segments 
    WHERE segment_type = 'auto' AND is_active = true
  LOOP
    v_should_assign := false;
    
    IF v_segment.name = 'VIP' THEN
      IF (v_stats.total_spent >= 50000) OR (v_stats.total_orders >= 10) THEN
        v_should_assign := true;
      END IF;
    ELSIF v_segment.name = 'New' THEN
      IF v_stats.days_since_joined <= 30 THEN
        v_should_assign := true;
      END IF;
    ELSIF v_segment.name = 'Inactive' THEN
      IF v_stats.days_since_last_order IS NOT NULL AND v_stats.days_since_last_order >= 90 THEN
        v_should_assign := true;
      ELSIF v_stats.total_orders = 0 AND v_stats.days_since_joined > 30 THEN
        v_should_assign := true;
      END IF;
    ELSIF v_segment.name = 'Regular' THEN
      IF v_stats.total_orders >= 3 AND v_stats.total_orders <= 10 THEN
        v_should_assign := true;
      END IF;
    END IF;
    
    IF v_should_assign THEN
      INSERT INTO public.customer_segment_members (customer_id, segment_id, assigned_by)
      VALUES (p_customer_id, v_segment.id, 'system')
      ON CONFLICT (customer_id, segment_id) DO NOTHING;
    ELSE
      DELETE FROM public.customer_segment_members 
      WHERE customer_id = p_customer_id AND segment_id = v_segment.id AND assigned_by = 'system';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to refresh all customer segments
CREATE OR REPLACE FUNCTION public.refresh_all_customer_segments()
RETURNS void AS $$
DECLARE
  v_customer RECORD;
BEGIN
  FOR v_customer IN SELECT id FROM public.profiles LOOP
    PERFORM public.assign_customer_segments(v_customer.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update segments when order is placed
CREATE OR REPLACE FUNCTION public.trigger_update_customer_segment()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.assign_customer_segments(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_customer_segment_on_order
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_customer_segment();

-- Add updated_at trigger
CREATE TRIGGER update_customer_segments_updated_at
BEFORE UPDATE ON public.customer_segments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();