import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesUpdate, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type ReturnRequest = Tables<'return_requests'>;
type ReturnRequestUpdate = TablesUpdate<'return_requests'>;
type ReturnRequestInsert = TablesInsert<'return_requests'>;

export function useReturnRequests() {
  return useQuery({
    queryKey: ['admin-return-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('return_requests')
        .select('*, orders(order_number), profiles:user_id(full_name, email)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useUserReturnRequests(userId?: string) {
  return useQuery({
    queryKey: ['user-return-requests', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('return_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useCreateReturnRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ReturnRequestInsert & { request_type?: 'return' | 'replace' }) => {
      const { data: result, error } = await supabase
        .from('return_requests')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-return-requests'] });
      queryClient.invalidateQueries({ queryKey: ['user-return-requests', variables.user_id] });
      const requestType = variables.request_type === 'replace' ? 'Replace' : 'Return';
      toast.success(`${requestType} request submitted successfully`);
    },
    onError: (error) => {
      toast.error('Failed to submit request: ' + error.message);
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
