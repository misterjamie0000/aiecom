import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type ReturnRequest = Tables<'return_requests'>;
type ReturnRequestUpdate = TablesUpdate<'return_requests'>;

export function useReturnRequests() {
  return useQuery({
    queryKey: ['admin-return-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('return_requests')
        .select('*, orders(order_number), profiles(full_name, email)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateReturnRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: ReturnRequestUpdate & { id: string }) => {
      const { data: result, error } = await supabase
        .from('return_requests')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-return-requests'] });
      toast.success('Return request updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update return request: ' + error.message);
    },
  });
}
