import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  campaign_type: string;
  target_segment_id: string | null;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  segment?: {
    name: string;
    color: string;
  };
}

export interface AbandonedCart {
  id: string;
  user_id: string;
  total_items: number;
  total_value: number;
  last_activity_at: string;
  reminder_sent_at: string | null;
  reminder_count: number;
  recovered: boolean;
  recovered_at: string | null;
  created_at: string;
  customer?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
  cart_items?: any[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  template_type: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch all email campaigns
export function useEmailCampaigns() {
  return useQuery({
    queryKey: ['email-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select(`
          *,
          segment:customer_segments(name, color)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EmailCampaign[];
    },
  });
}

// Fetch abandoned carts with customer details
export function useAbandonedCarts() {
  return useQuery({
    queryKey: ['abandoned-carts'],
    queryFn: async () => {
      // First refresh abandoned carts data
      await supabase.rpc('update_abandoned_carts');
      
      const { data: carts, error } = await supabase
        .from('abandoned_carts')
        .select('*')
        .eq('recovered', false)
        .order('last_activity_at', { ascending: false });
      
      if (error) throw error;

      // Get customer details and cart items for each abandoned cart
      const cartsWithDetails = await Promise.all(
        (carts || []).map(async (cart) => {
          // Get customer profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, phone')
            .eq('id', cart.user_id)
            .single();

          // Get cart items
          const { data: cartItems } = await supabase
            .from('cart_items')
            .select(`
              *,
              product:products(name, price, image_url)
            `)
            .eq('user_id', cart.user_id);

          return {
            ...cart,
            customer: profile,
            cart_items: cartItems || [],
          };
        })
      );

      return cartsWithDetails as AbandonedCart[];
    },
  });
}

// Fetch email templates
export function useEmailTemplates() {
  return useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('template_type', { ascending: true });
      
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });
}

// Create email campaign
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaign: Partial<EmailCampaign>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('email_campaigns')
        .insert({
          name: campaign.name || '',
          subject: campaign.subject || '',
          content: campaign.content || '',
          campaign_type: campaign.campaign_type || 'promotional',
          target_segment_id: campaign.target_segment_id || null,
          created_by: user?.id,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create campaign: ' + error.message);
    },
  });
}

// Update email campaign
export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailCampaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('email_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign updated');
    },
    onError: (error) => {
      toast.error('Failed to update campaign: ' + error.message);
    },
  });
}

// Delete email campaign
export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete campaign: ' + error.message);
    },
  });
}

// Send campaign
export function useSendCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('send-marketing-email', {
        body: { campaignId, action: 'send_campaign' },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-campaigns'] });
      toast.success('Campaign is being sent');
    },
    onError: (error) => {
      toast.error('Failed to send campaign: ' + error.message);
    },
  });
}

// Send abandoned cart reminder
export function useSendCartReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cartId: string) => {
      const { data, error } = await supabase.functions.invoke('send-marketing-email', {
        body: { cartId, action: 'send_cart_reminder' },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      toast.success('Reminder sent successfully');
    },
    onError: (error) => {
      toast.error('Failed to send reminder: ' + error.message);
    },
  });
}

// Create email template
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (template: Partial<EmailTemplate>) => {
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          name: template.name || '',
          subject: template.subject || '',
          content: template.content || '',
          template_type: template.template_type || 'promotional',
          is_default: template.is_default || false,
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template created');
    },
    onError: (error) => {
      toast.error('Failed to create template: ' + error.message);
    },
  });
}

// Update email template
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('email_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template updated');
    },
    onError: (error) => {
      toast.error('Failed to update template: ' + error.message);
    },
  });
}

// Delete email template
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Template deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete template: ' + error.message);
    },
  });
}

// Marketing stats
export function useMarketingStats() {
  return useQuery({
    queryKey: ['marketing-stats'],
    queryFn: async () => {
      // Get campaign stats
      const { data: campaigns } = await supabase
        .from('email_campaigns')
        .select('status, total_sent, total_opened, total_clicked');

      const totalCampaigns = campaigns?.length || 0;
      const sentCampaigns = campaigns?.filter(c => c.status === 'sent').length || 0;
      const totalSent = campaigns?.reduce((sum, c) => sum + (c.total_sent || 0), 0) || 0;
      const totalOpened = campaigns?.reduce((sum, c) => sum + (c.total_opened || 0), 0) || 0;
      const totalClicked = campaigns?.reduce((sum, c) => sum + (c.total_clicked || 0), 0) || 0;

      // Get abandoned cart stats
      const { count: abandonedCount } = await supabase
        .from('abandoned_carts')
        .select('*', { count: 'exact', head: true })
        .eq('recovered', false);

      const { count: recoveredCount } = await supabase
        .from('abandoned_carts')
        .select('*', { count: 'exact', head: true })
        .eq('recovered', true);

      const { data: abandonedValue } = await supabase
        .from('abandoned_carts')
        .select('total_value')
        .eq('recovered', false);

      const totalAbandonedValue = abandonedValue?.reduce((sum, c) => sum + Number(c.total_value), 0) || 0;

      return {
        totalCampaigns,
        sentCampaigns,
        totalSent,
        totalOpened,
        totalClicked,
        openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0,
        clickRate: totalOpened > 0 ? ((totalClicked / totalOpened) * 100).toFixed(1) : 0,
        abandonedCarts: abandonedCount || 0,
        recoveredCarts: recoveredCount || 0,
        totalAbandonedValue,
        recoveryRate: (abandonedCount || 0) + (recoveredCount || 0) > 0 
          ? (((recoveredCount || 0) / ((abandonedCount || 0) + (recoveredCount || 0))) * 100).toFixed(1) 
          : 0,
      };
    },
  });
}
