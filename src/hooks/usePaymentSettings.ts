import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cod' | 'online' | 'upi' | 'wallet';
  isActive: boolean;
  processingFee?: number;
  instructions?: string;
}

export interface PaymentSettings {
  methods: PaymentMethod[];
  codLimit: number;
  gstEnabled: boolean;
  gstPercentage: number;
}

const DEFAULT_SETTINGS: PaymentSettings = {
  methods: [
    { id: '1', name: 'Cash on Delivery', type: 'cod', isActive: true, processingFee: 30, instructions: 'Pay with cash when your order is delivered' },
    { id: '2', name: 'UPI', type: 'upi', isActive: true, instructions: 'Pay using any UPI app' },
    { id: '3', name: 'Credit/Debit Card', type: 'online', isActive: true, processingFee: 0, instructions: 'Pay securely with your card' },
    { id: '4', name: 'Net Banking', type: 'online', isActive: true, instructions: 'Pay through your bank' },
  ],
  codLimit: 10000,
  gstEnabled: true,
  gstPercentage: 18,
};

export function usePaymentSettings() {
  return useQuery({
    queryKey: ['payment-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'payment_settings')
        .maybeSingle();
      
      if (error) throw error;
      return (data?.value as PaymentSettings) || DEFAULT_SETTINGS;
    },
  });
}

export function useUpdatePaymentSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: PaymentSettings) => {
      const { data, error } = await supabase
        .from('site_settings')
        .upsert({ 
          key: 'payment_settings', 
          value: settings as any,
          description: 'Payment methods and configuration' 
        }, { onConflict: 'key' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-settings'] });
      toast.success('Payment settings saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save payment settings: ' + error.message);
    },
  });
}
