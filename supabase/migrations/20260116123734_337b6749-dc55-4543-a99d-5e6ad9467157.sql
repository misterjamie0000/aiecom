-- WhatsApp Message Templates
CREATE TABLE public.whatsapp_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template_name TEXT NOT NULL,
  content TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'promotional',
  language TEXT NOT NULL DEFAULT 'en',
  header_type TEXT DEFAULT 'text',
  header_content TEXT,
  footer_content TEXT,
  button_text TEXT,
  button_url TEXT,
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Campaigns
CREATE TABLE public.whatsapp_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template_id UUID REFERENCES public.whatsapp_templates(id),
  message_content TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'promotional',
  target_segment_id UUID REFERENCES public.customer_segments(id),
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  total_sent INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_read INTEGER DEFAULT 0,
  total_failed INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Campaign Recipients
CREATE TABLE public.whatsapp_campaign_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.whatsapp_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_templates (admin only)
CREATE POLICY "Admins can manage whatsapp templates" 
ON public.whatsapp_templates 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for whatsapp_campaigns (admin only)
CREATE POLICY "Admins can manage whatsapp campaigns" 
ON public.whatsapp_campaigns 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for whatsapp_campaign_recipients (admin only)
CREATE POLICY "Admins can manage whatsapp recipients" 
ON public.whatsapp_campaign_recipients 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_whatsapp_campaigns_status ON public.whatsapp_campaigns(status);
CREATE INDEX idx_whatsapp_campaigns_segment ON public.whatsapp_campaigns(target_segment_id);
CREATE INDEX idx_whatsapp_recipients_campaign ON public.whatsapp_campaign_recipients(campaign_id);
CREATE INDEX idx_whatsapp_recipients_status ON public.whatsapp_campaign_recipients(status);

-- Update trigger for timestamps
CREATE TRIGGER update_whatsapp_templates_updated_at
BEFORE UPDATE ON public.whatsapp_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_campaigns_updated_at
BEFORE UPDATE ON public.whatsapp_campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default templates
INSERT INTO public.whatsapp_templates (name, template_name, content, template_type, language, is_approved) VALUES
('Welcome Message', 'welcome_message', 'Hello {{1}}! Welcome to our store. We are excited to have you here. Check out our latest products at {{2}}', 'welcome', 'en', true),
('Order Confirmation', 'order_confirmed', 'Hi {{1}}! Your order #{{2}} has been confirmed. Track your order at {{3}}', 'transactional', 'en', true),
('Abandoned Cart Reminder', 'cart_reminder', 'Hi {{1}}! You left {{2}} items in your cart worth Rs {{3}}. Complete your purchase now: {{4}}', 'abandoned_cart', 'en', true),
('Promotional Offer', 'promo_offer', 'Hi {{1}}! Special offer just for you! Get {{2}}% off on your next purchase. Use code: {{3}}. Shop now: {{4}}', 'promotional', 'en', true),
('Delivery Update', 'delivery_update', 'Hi {{1}}! Your order #{{2}} is out for delivery. Track: {{3}}', 'transactional', 'en', true);