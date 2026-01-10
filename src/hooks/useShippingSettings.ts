import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ShippingZone {
  id: string;
  name: string;
  regions: string[];
  rate: number;
  freeAbove?: number;
  estimatedDays: string;
  isActive: boolean;
}

export interface ShippingSettings {
  zones: ShippingZone[];
  defaultRate: number;
  freeShippingThreshold: number;
}

const DEFAULT_SETTINGS: ShippingSettings = {
  zones: [
    { id: '1', name: 'Metro Cities', regions: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'], rate: 40, freeAbove: 499, estimatedDays: '2-3', isActive: true },
    { id: '2', name: 'Tier 2 Cities', regions: ['Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh'], rate: 60, freeAbove: 699, estimatedDays: '3-5', isActive: true },
    { id: '3', name: 'Rest of India', regions: ['All other locations'], rate: 80, freeAbove: 999, estimatedDays: '5-7', isActive: true },
  ],
  defaultRate: 80,
  freeShippingThreshold: 999,
};

export function useShippingSettings() {
  return useQuery({
    queryKey: ['shipping-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'shipping_settings')
        .maybeSingle();
      
      if (error) throw error;
      return (data?.value as unknown as ShippingSettings) || DEFAULT_SETTINGS;
    },
  });
}

export function useUpdateShippingSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: ShippingSettings) => {
      const { data, error } = await supabase
        .from('site_settings')
        .upsert({ 
          key: 'shipping_settings', 
          value: settings as any,
          description: 'Shipping zones and rates configuration' 
        }, { onConflict: 'key' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-settings'] });
      toast.success('Shipping settings saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save shipping settings: ' + error.message);
    },
  });
}
