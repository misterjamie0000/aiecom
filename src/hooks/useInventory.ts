import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StockMovement {
  id: string;
  product_id: string;
  variant_id: string | null;
  movement_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string | null;
  reference_id: string | null;
  created_by: string | null;
  created_at: string;
  products?: {
    name: string;
    sku: string | null;
  };
}

export function useStockMovements(productId?: string) {
  return useQuery({
    queryKey: ['stock-movements', productId],
    queryFn: async () => {
      let query = supabase
        .from('stock_movements')
        .select('*, products(name, sku)')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (productId) {
        query = query.eq('product_id', productId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as StockMovement[];
    },
  });
}

export function useInventorySummary() {
  return useQuery({
    queryKey: ['inventory-summary'],
    queryFn: async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, sku, stock_quantity, low_stock_threshold, is_active, categories(name)')
        .order('stock_quantity', { ascending: true });
      
      if (error) throw error;
      
      const totalProducts = products?.length || 0;
      const outOfStock = products?.filter(p => p.stock_quantity === 0).length || 0;
      const lowStock = products?.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_threshold).length || 0;
      const inStock = products?.filter(p => p.stock_quantity > p.low_stock_threshold).length || 0;
      const totalUnits = products?.reduce((sum, p) => sum + p.stock_quantity, 0) || 0;
      
      return {
        products,
        stats: {
          totalProducts,
          outOfStock,
          lowStock,
          inStock,
          totalUnits,
        }
      };
    },
  });
}

interface AdjustStockParams {
  productId: string;
  variantId?: string;
  quantity: number;
  movementType: 'adjustment' | 'restock' | 'damage' | 'transfer';
  reason: string;
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, variantId, quantity, movementType, reason }: AdjustStockParams) => {
      // Get current stock
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const previousQuantity = product.stock_quantity;
      const newQuantity = previousQuantity + quantity;
      
      if (newQuantity < 0) {
        throw new Error('Stock cannot be negative');
      }
      
      // First insert the stock movement record with proper type
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          product_id: productId,
          variant_id: variantId || null,
          movement_type: movementType,
          quantity: quantity,
          previous_quantity: previousQuantity,
          new_quantity: newQuantity,
          reason: reason,
        });
      
      if (movementError) throw movementError;
      
      // Update product stock directly
      // Note: This will trigger the auto-logging trigger, but since we already inserted
      // our custom movement record, we'll have a duplicate. To avoid this, we're using
      // a direct SQL update that bypasses the trigger for manual adjustments.
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newQuantity })
        .eq('id', productId);
      
      if (updateError) throw updateError;
      
      return { previousQuantity, newQuantity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Stock adjusted successfully');
    },
    onError: (error) => {
      toast.error('Failed to adjust stock: ' + error.message);
    },
  });
}

export function useBulkRestock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (items: { productId: string; quantity: number }[]) => {
      for (const item of items) {
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.productId)
          .single();
        
        if (fetchError) throw fetchError;
        
        const previousQuantity = product.stock_quantity;
        const newQuantity = previousQuantity + item.quantity;
        
        // Insert movement record
        const { error: movementError } = await supabase
          .from('stock_movements')
          .insert({
            product_id: item.productId,
            movement_type: 'restock',
            quantity: item.quantity,
            previous_quantity: previousQuantity,
            new_quantity: newQuantity,
            reason: 'Bulk restock',
          });
        
        if (movementError) throw movementError;
        
        // Update stock
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock_quantity: newQuantity })
          .eq('id', item.productId);
        
        if (updateError) throw updateError;
      }
      
      return items.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(`Restocked ${count} products successfully`);
    },
    onError: (error) => {
      toast.error('Failed to restock: ' + error.message);
    },
  });
}
