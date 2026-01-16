import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProductBundle {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bundle_price: number;
  original_price: number | null;
  discount_percent: number | null;
  image_url: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  max_purchases: number | null;
  current_purchases: number;
  created_at: string;
  updated_at: string;
  items?: BundleItem[];
}

export interface BundleItem {
  id: string;
  bundle_id: string;
  product_id: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
}

export function useBundles() {
  return useQuery({
    queryKey: ['product-bundles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_bundles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProductBundle[];
    },
  });
}

export function useActiveBundles() {
  return useQuery({
    queryKey: ['active-bundles'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('product_bundles')
        .select(`
          *,
          items:bundle_items(
            *,
            product:products(id, name, price, image_url, slug)
          )
        `)
        .eq('is_active', true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ProductBundle[];
    },
  });
}

export function useBundleItems(bundleId: string | null) {
  return useQuery({
    queryKey: ['bundle-items', bundleId],
    queryFn: async () => {
      if (!bundleId) return [];
      const { data, error } = await supabase
        .from('bundle_items')
        .select(`
          *,
          product:products(id, name, price, image_url)
        `)
        .eq('bundle_id', bundleId);
      
      if (error) throw error;
      return data as BundleItem[];
    },
    enabled: !!bundleId,
  });
}

export function useCreateBundle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bundle: Partial<ProductBundle>) => {
      const { data, error } = await supabase
        .from('product_bundles')
        .insert(bundle as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
      toast.success('Bundle created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create bundle: ' + error.message);
    },
  });
}

export function useUpdateBundle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProductBundle> & { id: string }) => {
      const { data, error } = await supabase
        .from('product_bundles')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
      toast.success('Bundle updated');
    },
    onError: (error) => {
      toast.error('Failed to update bundle: ' + error.message);
    },
  });
}

export function useDeleteBundle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_bundles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
      toast.success('Bundle deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete bundle: ' + error.message);
    },
  });
}

export function useAddBundleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { bundle_id: string; product_id: string; quantity?: number }) => {
      const { error } = await supabase
        .from('bundle_items')
        .insert({ ...data, quantity: data.quantity || 1 } as any);
      
      if (error) throw error;
      return data.bundle_id;
    },
    onSuccess: (bundle_id) => {
      queryClient.invalidateQueries({ queryKey: ['bundle-items', bundle_id] });
      toast.success('Product added to bundle');
    },
    onError: (error) => {
      toast.error('Failed to add product: ' + error.message);
    },
  });
}

export function useRemoveBundleItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, bundle_id }: { id: string; bundle_id: string }) => {
      const { error } = await supabase
        .from('bundle_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return bundle_id;
    },
    onSuccess: (bundle_id) => {
      queryClient.invalidateQueries({ queryKey: ['bundle-items', bundle_id] });
      toast.success('Product removed from bundle');
    },
    onError: (error) => {
      toast.error('Failed to remove product: ' + error.message);
    },
  });
}

export function useUpdateBundlePrices() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bundleId, bundlePrice }: { bundleId: string; bundlePrice: number }) => {
      // Get bundle items to calculate original price
      const { data: items, error: itemsError } = await supabase
        .from('bundle_items')
        .select('quantity, product:products(price)')
        .eq('bundle_id', bundleId);

      if (itemsError) throw itemsError;

      const originalPrice = items?.reduce((sum, item: any) => {
        return sum + (item.product?.price || 0) * item.quantity;
      }, 0) || 0;

      const discountPercent = originalPrice > 0 
        ? Math.round(((originalPrice - bundlePrice) / originalPrice) * 100) 
        : 0;

      const { error } = await supabase
        .from('product_bundles')
        .update({ 
          bundle_price: bundlePrice,
          original_price: originalPrice,
          discount_percent: discountPercent
        } as any)
        .eq('id', bundleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-bundles'] });
      toast.success('Bundle prices updated');
    },
    onError: (error) => {
      toast.error('Failed to update prices: ' + error.message);
    },
  });
}
