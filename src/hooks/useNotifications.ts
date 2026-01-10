import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push';
  subject?: string;
  content: string;
  trigger: string;
  isActive: boolean;
}

export interface NotificationSettings {
  templates: NotificationTemplate[];
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  templates: [
    { id: '1', name: 'Order Confirmation', type: 'email', subject: 'Order Confirmed - #{order_number}', content: 'Thank you for your order! Your order #{order_number} has been confirmed.', trigger: 'order_confirmed', isActive: true },
    { id: '2', name: 'Order Shipped', type: 'email', subject: 'Your Order is on the Way!', content: 'Great news! Your order #{order_number} has been shipped. Track it here: {tracking_url}', trigger: 'order_shipped', isActive: true },
    { id: '3', name: 'Order Delivered', type: 'email', subject: 'Order Delivered', content: 'Your order #{order_number} has been delivered. We hope you love it!', trigger: 'order_delivered', isActive: true },
    { id: '4', name: 'Welcome Email', type: 'email', subject: 'Welcome to Our Store!', content: 'Welcome {customer_name}! Thank you for creating an account with us.', trigger: 'user_signup', isActive: true },
    { id: '5', name: 'Order SMS', type: 'sms', content: 'Order #{order_number} confirmed. Track: {short_url}', trigger: 'order_confirmed', isActive: false },
  ],
  emailEnabled: true,
  smsEnabled: false,
  pushEnabled: false,
};

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'notification_settings')
        .maybeSingle();
      
      if (error) throw error;
      return (data?.value as NotificationSettings) || DEFAULT_SETTINGS;
    },
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: NotificationSettings) => {
      const { data, error } = await supabase
        .from('site_settings')
        .upsert({ 
          key: 'notification_settings', 
          value: settings as any,
          description: 'Notification templates and settings' 
        }, { onConflict: 'key' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast.success('Notification settings saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save notification settings: ' + error.message);
    },
  });
}
