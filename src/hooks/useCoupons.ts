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

export function useValidateCoupon() {
  return useMutation({
    mutationFn: async ({ code, orderTotal }: { code: string; orderTotal: number }) => {
      // Fetch coupon by code (case-insensitive)
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .ilike('code', code)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      
      if (!coupon) {
        throw new Error('Invalid coupon code');
      }

      // Check if coupon is valid (dates)
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        throw new Error('Coupon is not yet active');
      }
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        throw new Error('Coupon has expired');
      }

      // Check minimum order value
      if (coupon.min_order_value && orderTotal < coupon.min_order_value) {
        throw new Error(`Minimum order value is ₹${coupon.min_order_value}`);
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        throw new Error('Coupon usage limit reached');
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = Math.round((orderTotal * coupon.discount_value) / 100);
        // Apply max discount cap if set
        if (coupon.max_discount && discountAmount > coupon.max_discount) {
          discountAmount = coupon.max_discount;
        }
      } else {
        // Fixed discount
        discountAmount = coupon.discount_value;
      }

      // Ensure discount doesn't exceed order total
      if (discountAmount > orderTotal) {
        discountAmount = orderTotal;
      }

      return {
        coupon,
        discountAmount,
      };
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
