import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FlashSale {
  id: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  max_uses: number | null;
  current_uses: number;
  banner_image: string | null;
  created_at: string;
  updated_at: string;
  products?: FlashSaleProduct[];
}

export interface FlashSaleProduct {
  id: string;
  flash_sale_id: string;
  product_id: string;
  special_price: number | null;
  max_quantity_per_user: number;
  product?: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
  };
}

export function useFlashSales() {
  return useQuery({
    queryKey: ['flash-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flash_sales')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FlashSale[];
    },
  });
}

export function useActiveFlashSales() {
  return useQuery({
    queryKey: ['active-flash-sales'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('flash_sales')
        .select(`
          *,
          products:flash_sale_products(
            *,
            product:products(id, name, price, image_url, slug)
          )
        `)
        .eq('is_active', true)
        .lte('starts_at', now)
        .gte('ends_at', now)
        .order('ends_at', { ascending: true });
      
      if (error) throw error;
      return data as FlashSale[];
    },
  });
}

export function useFlashSaleProducts(saleId: string | null) {
  return useQuery({
    queryKey: ['flash-sale-products', saleId],
    queryFn: async () => {
      if (!saleId) return [];
      const { data, error } = await supabase
        .from('flash_sale_products')
        .select(`
          *,
          product:products(id, name, price, image_url)
        `)
        .eq('flash_sale_id', saleId);
      
      if (error) throw error;
      return data as FlashSaleProduct[];
    },
    enabled: !!saleId,
  });
}

export function useCreateFlashSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sale: Partial<FlashSale>) => {
      const { data, error } = await supabase
        .from('flash_sales')
        .insert(sale as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      toast.success('Flash sale created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create flash sale: ' + error.message);
    },
  });
}

export function useUpdateFlashSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FlashSale> & { id: string }) => {
      const { data, error } = await supabase
        .from('flash_sales')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      toast.success('Flash sale updated');
    },
    onError: (error) => {
      toast.error('Failed to update flash sale: ' + error.message);
    },
  });
}

export function useDeleteFlashSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('flash_sales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sales'] });
      toast.success('Flash sale deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete flash sale: ' + error.message);
    },
  });
}

export function useAddFlashSaleProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { flash_sale_id: string; product_id: string; special_price?: number; max_quantity_per_user?: number }) => {
      const { error } = await supabase
        .from('flash_sale_products')
        .insert(data as any);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['flash-sale-products', variables.flash_sale_id] });
      toast.success('Product added to flash sale');
    },
    onError: (error) => {
      toast.error('Failed to add product: ' + error.message);
    },
  });
}

export function useRemoveFlashSaleProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, flash_sale_id }: { id: string; flash_sale_id: string }) => {
      const { error } = await supabase
        .from('flash_sale_products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return flash_sale_id;
    },
    onSuccess: (flash_sale_id) => {
      queryClient.invalidateQueries({ queryKey: ['flash-sale-products', flash_sale_id] });
      toast.success('Product removed from flash sale');
    },
    onError: (error) => {
      toast.error('Failed to remove product: ' + error.message);
    },
  });
}
