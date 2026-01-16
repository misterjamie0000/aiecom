-- Create email_campaigns table
CREATE TABLE public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'promotional', -- promotional, abandoned_cart, segment_campaign
  target_segment_id UUID REFERENCES public.customer_segments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, scheduled, sending, sent, cancelled
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_opened INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create campaign_recipients table to track who received what
CREATE TABLE public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, opened, clicked
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create abandoned_carts view to identify abandoned carts
CREATE TABLE public.abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_items INTEGER NOT NULL DEFAULT 0,
  total_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL,
  reminder_sent_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  recovered BOOLEAN DEFAULT FALSE,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create email_templates table for reusable templates
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'promotional', -- promotional, abandoned_cart, welcome, etc
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_campaigns (admin only)
CREATE POLICY "Admin can manage email campaigns" ON public.email_campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for campaign_recipients (admin only)
CREATE POLICY "Admin can manage campaign recipients" ON public.campaign_recipients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for abandoned_carts (admin only)
CREATE POLICY "Admin can view abandoned carts" ON public.abandoned_carts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for email_templates (admin only)
CREATE POLICY "Admin can manage email templates" ON public.email_templates
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Function to update abandoned carts
CREATE OR REPLACE FUNCTION public.update_abandoned_carts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cart_record RECORD;
BEGIN
  -- First, mark recovered carts (users who have placed orders after cart was created)
  UPDATE abandoned_carts ac
  SET recovered = TRUE, recovered_at = NOW(), updated_at = NOW()
  WHERE recovered = FALSE
  AND EXISTS (
    SELECT 1 FROM orders o 
    WHERE o.user_id = ac.user_id 
    AND o.created_at > ac.last_activity_at
  );

  -- Remove entries for users with no cart items
  DELETE FROM abandoned_carts ac
  WHERE NOT EXISTS (
    SELECT 1 FROM cart_items ci WHERE ci.user_id = ac.user_id
  );

  -- Upsert abandoned carts for users with items in cart
  FOR cart_record IN
    SELECT 
      ci.user_id,
      COUNT(*) as item_count,
      SUM(p.price * ci.quantity) as cart_value,
      MAX(ci.updated_at) as last_activity
    FROM cart_items ci
    JOIN products p ON p.id = ci.product_id
    GROUP BY ci.user_id
    HAVING MAX(ci.updated_at) < NOW() - INTERVAL '1 hour'
  LOOP
    INSERT INTO abandoned_carts (user_id, total_items, total_value, last_activity_at)
    VALUES (cart_record.user_id, cart_record.item_count, cart_record.cart_value, cart_record.last_activity)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      total_items = cart_record.item_count,
      total_value = cart_record.cart_value,
      last_activity_at = cart_record.last_activity,
      updated_at = NOW()
    WHERE abandoned_carts.recovered = FALSE;
  END LOOP;
END;
$$;

-- Insert default email templates
INSERT INTO public.email_templates (name, subject, content, template_type, is_default) VALUES
(
  'Abandoned Cart Reminder',
  'You left something behind! 🛒',
  '<h1>Don''t forget your items!</h1>
<p>Hi {{customer_name}},</p>
<p>You have items waiting in your cart. Complete your purchase before they''re gone!</p>
<div>{{cart_items}}</div>
<p><a href="{{cart_url}}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Complete Your Order</a></p>
<p>If you have any questions, we''re here to help!</p>',
  'abandoned_cart',
  TRUE
),
(
  'Welcome Email',
  'Welcome to GlowMart! 🎉',
  '<h1>Welcome to GlowMart!</h1>
<p>Hi {{customer_name}},</p>
<p>Thank you for joining our family! We''re excited to have you.</p>
<p>Explore our amazing collection and enjoy exclusive member benefits:</p>
<ul>
<li>Early access to new arrivals</li>
<li>Exclusive member discounts</li>
<li>Loyalty rewards on every purchase</li>
</ul>
<p><a href="{{shop_url}}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Start Shopping</a></p>',
  'welcome',
  TRUE
),
(
  'Promotional Campaign',
  'Special offer just for you! 🎁',
  '<h1>Exclusive Offer!</h1>
<p>Hi {{customer_name}},</p>
<p>{{campaign_content}}</p>
<p><a href="{{shop_url}}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Shop Now</a></p>',
  'promotional',
  TRUE
);