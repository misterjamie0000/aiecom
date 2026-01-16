import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface WhatsAppTemplate {
  id: string;
  name: string;
  template_name: string;
  content: string;
  template_type: string;
  language: string;
  header_type: string | null;
  header_content: string | null;
  footer_content: string | null;
  button_text: string | null;
  button_url: string | null;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppCampaign {
  id: string;
  name: string;
  template_id: string | null;
  message_content: string;
  campaign_type: string;
  target_segment_id: string | null;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  total_sent: number;
  total_delivered: number;
  total_read: number;
  total_failed: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  segment?: {
    name: string;
    color: string;
  };
  template?: WhatsAppTemplate;
}

// Fetch all WhatsApp templates
export function useWhatsAppTemplates() {
  return useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WhatsAppTemplate[];
    },
  });
}

// Fetch all WhatsApp campaigns
export function useWhatsAppCampaigns() {
  return useQuery({
    queryKey: ['whatsapp-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_campaigns')
        .select(`
          *,
          segment:customer_segments(name, color),
          template:whatsapp_templates(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WhatsAppCampaign[];
    },
  });
}

// Create WhatsApp template
export function useCreateWhatsAppTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: {
      name: string;
      template_name: string;
      content: string;
      template_type?: string;
      language?: string;
      header_type?: string;
      header_content?: string;
      footer_content?: string;
      button_text?: string;
      button_url?: string;
      is_approved?: boolean;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .insert([template])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast.success('WhatsApp template created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create template: ' + error.message);
    },
  });
}

// Update WhatsApp template
export function useUpdateWhatsAppTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WhatsAppTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('whatsapp_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast.success('WhatsApp template updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update template: ' + error.message);
    },
  });
}

// Delete WhatsApp template
export function useDeleteWhatsAppTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whatsapp_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast.success('WhatsApp template deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete template: ' + error.message);
    },
  });
}

// Create WhatsApp campaign
export function useCreateWhatsAppCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campaign: {
      name: string;
      message_content: string;
      template_id?: string;
      campaign_type?: string;
      target_segment_id?: string | null;
      status?: string;
      scheduled_at?: string;
    }) => {
      const { data, error } = await supabase
        .from('whatsapp_campaigns')
        .insert([campaign])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-campaigns'] });
      toast.success('WhatsApp campaign created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create campaign: ' + error.message);
    },
  });
}

// Update WhatsApp campaign
export function useUpdateWhatsAppCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WhatsAppCampaign> & { id: string }) => {
      const { data, error } = await supabase
        .from('whatsapp_campaigns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-campaigns'] });
      toast.success('WhatsApp campaign updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update campaign: ' + error.message);
    },
  });
}

// Delete WhatsApp campaign
export function useDeleteWhatsAppCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whatsapp_campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-campaigns'] });
      toast.success('WhatsApp campaign deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete campaign: ' + error.message);
    },
  });
}

// Send WhatsApp campaign
export function useSendWhatsAppCampaign() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-marketing', {
        body: { campaign_id: campaignId, type: 'campaign' },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-campaigns'] });
      toast.success('WhatsApp campaign is being sent');
    },
    onError: (error) => {
      toast.error('Failed to send campaign: ' + error.message);
    },
  });
}

// Send WhatsApp cart reminder
export function useSendWhatsAppCartReminder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cartId: string) => {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-marketing', {
        body: { cart_id: cartId, type: 'cart_reminder' },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['abandoned-carts'] });
      toast.success('WhatsApp reminder sent successfully');
    },
    onError: (error) => {
      toast.error('Failed to send reminder: ' + error.message);
    },
  });
}

// Get WhatsApp marketing stats
export function useWhatsAppStats() {
  return useQuery({
    queryKey: ['whatsapp-stats'],
    queryFn: async () => {
      const { data: campaigns, error: campaignsError } = await supabase
        .from('whatsapp_campaigns')
        .select('*');
      
      if (campaignsError) throw campaignsError;
      
      const totalCampaigns = campaigns?.length || 0;
      const sentCampaigns = campaigns?.filter(c => c.status === 'sent').length || 0;
      const totalSent = campaigns?.reduce((sum, c) => sum + (c.total_sent || 0), 0) || 0;
      const totalDelivered = campaigns?.reduce((sum, c) => sum + (c.total_delivered || 0), 0) || 0;
      const totalRead = campaigns?.reduce((sum, c) => sum + (c.total_read || 0), 0) || 0;
      
      const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
      const readRate = totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0;
      
      return {
        totalCampaigns,
        sentCampaigns,
        totalSent,
        totalDelivered,
        totalRead,
        deliveryRate,
        readRate,
      };
    },
  });
}
