import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ProductRecommendation {
  id: string;
  product_id: string;
  recommended_product_id: string;
  recommendation_type: 'frequently_bought' | 'similar' | 'complementary' | 'upsell' | 'cross_sell';
  score: number;
  is_manual: boolean;
  created_at: string;
  updated_at: string;
  product?: { id: string; name: string; image_url: string | null };
  recommended_product?: { 
    id: string; 
    name: string; 
    price: number;
    image_url: string | null; 
    slug: string;
    discount_percent: number | null;
  };
}

export interface UserProductView {
  id: string;
  user_id: string;
  product_id: string;
  view_count: number;
  last_viewed_at: string;
}

// Get recommendations for a specific product
export function useProductRecommendations(productId: string | null, type?: string) {
  return useQuery({
    queryKey: ['product-recommendations', productId, type],
    queryFn: async () => {
      if (!productId) return [];
      
      let query = supabase
        .from('product_recommendations')
        .select(`
          *,
          recommended_product:products!product_recommendations_recommended_product_id_fkey(
            id, name, price, image_url, slug, discount_percent, is_active
          )
        `)
        .eq('product_id', productId)
        .order('score', { ascending: false })
        .limit(10);

      if (type) {
        query = query.eq('recommendation_type', type);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Filter out inactive products
      return (data as ProductRecommendation[]).filter(
        r => (r.recommended_product as any)?.is_active !== false
      );
    },
    enabled: !!productId,
  });
}

// Get personalized recommendations for the current user
export function usePersonalizedRecommendations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['personalized-recommendations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get user's recently viewed products
      const { data: views, error: viewsError } = await supabase
        .from('user_product_views')
        .select('product_id')
        .eq('user_id', user.id)
        .order('last_viewed_at', { ascending: false })
        .limit(5);

      if (viewsError) throw viewsError;

      if (!views?.length) {
        // Return popular products if no view history
        const { data: popular, error: popularError } = await supabase
          .from('products')
          .select('id, name, price, image_url, slug, discount_percent')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(8);

        if (popularError) throw popularError;
        return popular;
      }

      // Get recommendations based on viewed products
      const productIds = views.map(v => v.product_id);
      const { data: recommendations, error: recError } = await supabase
        .from('product_recommendations')
        .select(`
          recommended_product:products!product_recommendations_recommended_product_id_fkey(
            id, name, price, image_url, slug, discount_percent, is_active
          )
        `)
        .in('product_id', productIds)
        .order('score', { ascending: false })
        .limit(12);

      if (recError) throw recError;

      // Deduplicate and filter active products
      const seen = new Set<string>();
      const uniqueProducts: any[] = [];
      
      for (const rec of recommendations || []) {
        const product = (rec as any).recommended_product;
        if (product && product.is_active && !seen.has(product.id)) {
          seen.add(product.id);
          uniqueProducts.push(product);
        }
      }

      return uniqueProducts.slice(0, 8);
    },
    enabled: !!user?.id,
  });
}

// Track product view
export function useTrackProductView() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      if (!user?.id) return null;

      // Upsert view record
      const { error } = await supabase
        .from('user_product_views')
        .upsert({
          user_id: user.id,
          product_id: productId,
          last_viewed_at: new Date().toISOString(),
          view_count: 1,
        } as any, {
          onConflict: 'user_id,product_id',
        });

      if (error) throw error;
    },
  });
}

// Admin: Get all recommendations
export function useAllRecommendations() {
  return useQuery({
    queryKey: ['all-recommendations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_recommendations')
        .select(`
          *,
          product:products!product_recommendations_product_id_fkey(id, name, image_url),
          recommended_product:products!product_recommendations_recommended_product_id_fkey(id, name, image_url)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProductRecommendation[];
    },
  });
}

// Admin: Create recommendation
export function useCreateRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      product_id: string;
      recommended_product_id: string;
      recommendation_type: string;
      score?: number;
    }) => {
      const { error } = await supabase
        .from('product_recommendations')
        .insert({
          ...data,
          is_manual: true,
          score: data.score || 1,
        } as any);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-recommendations'] });
      toast.success('Recommendation created');
    },
    onError: (error) => {
      toast.error('Failed to create recommendation: ' + error.message);
    },
  });
}

// Admin: Delete recommendation
export function useDeleteRecommendation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_recommendations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-recommendations'] });
      toast.success('Recommendation deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete recommendation: ' + error.message);
    },
  });
}

// Generate recommendations based on order history (admin action)
export function useGenerateRecommendations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Get order items grouped by order to find frequently bought together
      const { data: orders, error } = await supabase
        .from('order_items')
        .select('order_id, product_id')
        .order('order_id');

      if (error) throw error;

      // Group products by order
      const orderProducts: Record<string, string[]> = {};
      for (const item of orders || []) {
        if (!orderProducts[item.order_id]) {
          orderProducts[item.order_id] = [];
        }
        orderProducts[item.order_id].push(item.product_id);
      }

      // Find co-occurrence pairs
      const pairCounts: Record<string, number> = {};
      for (const products of Object.values(orderProducts)) {
        if (products.length < 2) continue;
        
        for (let i = 0; i < products.length; i++) {
          for (let j = i + 1; j < products.length; j++) {
            const key = [products[i], products[j]].sort().join('|');
            pairCounts[key] = (pairCounts[key] || 0) + 1;
          }
        }
      }

      // Create recommendations for pairs that appear together frequently
      const recommendations: any[] = [];
      for (const [pair, count] of Object.entries(pairCounts)) {
        if (count >= 2) { // At least 2 co-occurrences
          const [productA, productB] = pair.split('|');
          recommendations.push({
            product_id: productA,
            recommended_product_id: productB,
            recommendation_type: 'frequently_bought',
            score: count,
            is_manual: false,
          });
          recommendations.push({
            product_id: productB,
            recommended_product_id: productA,
            recommendation_type: 'frequently_bought',
            score: count,
            is_manual: false,
          });
        }
      }

      // Upsert recommendations
      if (recommendations.length > 0) {
        const { error: insertError } = await supabase
          .from('product_recommendations')
          .upsert(recommendations as any, {
            onConflict: 'product_id,recommended_product_id,recommendation_type',
          });

        if (insertError) throw insertError;
      }

      return recommendations.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['all-recommendations'] });
      toast.success(`Generated ${count} recommendations from order history`);
    },
    onError: (error) => {
      toast.error('Failed to generate recommendations: ' + error.message);
    },
  });
}
