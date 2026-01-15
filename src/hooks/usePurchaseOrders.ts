import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  product_id: string;
  quantity: number;
  received_quantity: number;
  unit_price: number;
  tax_percent: number;
  total_price: number;
  created_at: string;
  product?: {
    id: string;
    name: string;
    sku: string | null;
    image_url: string | null;
  };
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  status: 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled';
  order_date: string | null;
  expected_date: string | null;
  received_date: string | null;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  purchase_order_items?: PurchaseOrderItem[];
}

export interface POItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
  tax_percent?: number;
}

export function usePurchaseOrders() {
  return useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(id, name, email, phone),
          purchase_order_items(
            *,
            product:products(id, name, sku, image_url)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });
}

export function usePurchaseOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers(*),
          purchase_order_items(
            *,
            product:products(id, name, sku, image_url, stock_quantity)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as PurchaseOrder;
    },
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      supplier_id, 
      items, 
      notes,
      order_date,
      expected_date,
      shipping_amount = 0,
      discount_amount = 0,
    }: { 
      supplier_id: string; 
      items: POItemInput[];
      notes?: string;
      order_date?: string;
      expected_date?: string;
      shipping_amount?: number;
      discount_amount?: number;
    }) => {
      // Generate PO number
      const { data: poNumber, error: poNumError } = await supabase.rpc('generate_po_number');
      if (poNumError) throw poNumError;

      // Create PO
      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          po_number: poNumber,
          supplier_id,
          status: 'draft',
          notes,
          order_date,
          expected_date,
          shipping_amount,
          discount_amount,
        })
        .select()
        .single();
      
      if (poError) throw poError;

      // Create PO items
      const poItems = items.map(item => ({
        po_id: po.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_percent: item.tax_percent || 18,
        total_price: item.quantity * item.unit_price,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(poItems);
      
      if (itemsError) throw itemsError;

      return po;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Purchase order created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create purchase order: ' + error.message);
    },
  });
}

export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: { 
      id: string; 
      status?: string;
      notes?: string;
      order_date?: string;
      expected_date?: string;
      shipping_amount?: number;
      discount_amount?: number;
    }) => {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Purchase order updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update purchase order: ' + error.message);
    },
  });
}

export function useReceivePOItems() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      poId, 
      items 
    }: { 
      poId: string; 
      items: { id: string; received_quantity: number }[];
    }) => {
      // Update each item's received quantity
      for (const item of items) {
        const { error } = await supabase
          .from('purchase_order_items')
          .update({ received_quantity: item.received_quantity })
          .eq('id', item.id);
        
        if (error) throw error;
      }

      // Check if all items are fully received
      const { data: poItems, error: fetchError } = await supabase
        .from('purchase_order_items')
        .select('quantity, received_quantity')
        .eq('po_id', poId);
      
      if (fetchError) throw fetchError;

      const allReceived = poItems?.every(item => item.received_quantity >= item.quantity);
      const anyReceived = poItems?.some(item => item.received_quantity > 0);

      // Update PO status
      const newStatus = allReceived ? 'received' : (anyReceived ? 'partial' : 'ordered');
      
      const { error: updateError } = await supabase
        .from('purchase_orders')
        .update({ status: newStatus })
        .eq('id', poId);
      
      if (updateError) throw updateError;

      return { status: newStatus };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      if (data.status === 'received') {
        toast.success('All items received! Inventory updated.');
      } else {
        toast.success('Items received. Inventory updated.');
      }
    },
    onError: (error) => {
      toast.error('Failed to receive items: ' + error.message);
    },
  });
}

export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Purchase order deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete purchase order: ' + error.message);
    },
  });
}
