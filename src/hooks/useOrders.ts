import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Order = Tables<'orders'>;
type OrderUpdate = TablesUpdate<'orders'>;

export function useOrders() {
  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...order }: OrderUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('orders')
        .update(order)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update order: ' + error.message);
    },
  });
}
