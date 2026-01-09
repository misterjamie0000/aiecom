import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Review = Tables<'reviews'>;
type ReviewInsert = TablesInsert<'reviews'>;

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, avatar_url)')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

export function useProductRatingStats(productId: string) {
  return useQuery({
    queryKey: ['rating-stats', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId)
        .eq('is_approved', true);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
      }
      
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let total = 0;
      
      data.forEach(review => {
        total += review.rating;
        distribution[review.rating as keyof typeof distribution]++;
      });
      
      return {
        average: total / data.length,
        count: data.length,
        distribution,
      };
    },
    enabled: !!productId,
  });
}

export function useUserReview(productId: string, userId?: string) {
  return useQuery({
    queryKey: ['user-review', productId, userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!productId && !!userId,
  });
}

export function useCanReview(productId: string, userId?: string) {
  return useQuery({
    queryKey: ['can-review', productId, userId],
    queryFn: async () => {
      if (!userId) return { canReview: false, isVerifiedPurchase: false };
      
      // Check if user has purchased this product
      const { data: orders, error } = await supabase
        .from('order_items')
        .select('order_id, orders!inner(user_id, status)')
        .eq('product_id', productId)
        .eq('orders.user_id', userId)
        .eq('orders.status', 'delivered');
      
      if (error) throw error;
      
      const hasPurchased = orders && orders.length > 0;
      
      return {
        canReview: true, // Anyone can review
        isVerifiedPurchase: hasPurchased,
      };
    },
    enabled: !!productId && !!userId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (review: ReviewInsert) => {
      const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['rating-stats', variables.product_id] });
      queryClient.invalidateQueries({ queryKey: ['user-review', variables.product_id] });
      toast.success('Review submitted! It will be visible after approval.');
    },
    onError: (error) => {
      toast.error('Failed to submit review: ' + error.message);
    },
  });
}

// Admin hooks
export function useAllReviews() {
  return useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, email), products(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...review }: { id: string; is_approved?: boolean; admin_reply?: string }) => {
      const { data, error } = await supabase
        .from('reviews')
        .update(review)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update review: ' + error.message);
    },
  });
}

export function useDeleteReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      toast.success('Review deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete review: ' + error.message);
    },
  });
}
