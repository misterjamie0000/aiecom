import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Coupon = Tables<'coupons'>;
type CouponInsert = TablesInsert<'coupons'>;
type CouponUpdate = TablesUpdate<'coupons'>;

export function useCoupons() {
  return useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (coupon: CouponInsert) => {
      const { data, error } = await supabase
        .from('coupons')
        .insert(coupon)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create coupon: ' + error.message);
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...coupon }: CouponUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('coupons')
        .update(coupon)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update coupon: ' + error.message);
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete coupon: ' + error.message);
    },
  });
}
