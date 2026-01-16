import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BxgyOffer {
  id: string;
  name: string;
  description: string | null;
  buy_product_id: string | null;
  buy_category_id: string | null;
  buy_quantity: number;
  get_product_id: string | null;
  get_category_id: string | null;
  get_quantity: number;
  get_discount_type: string;
  get_discount_value: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  current_uses: number;
  usage_per_customer: number;
  created_at: string;
  updated_at: string;
  buy_product?: { id: string; name: string; image_url: string | null };
  buy_category?: { id: string; name: string };
  get_product?: { id: string; name: string; image_url: string | null; price: number };
  get_category?: { id: string; name: string };
}

export function useBxgyOffers() {
  return useQuery({
    queryKey: ['bxgy-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bxgy_offers')
        .select(`
          *,
          buy_product:products!bxgy_offers_buy_product_id_fkey(id, name, image_url),
          buy_category:categories!bxgy_offers_buy_category_id_fkey(id, name),
          get_product:products!bxgy_offers_get_product_id_fkey(id, name, image_url, price),
          get_category:categories!bxgy_offers_get_category_id_fkey(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BxgyOffer[];
    },
  });
}

export function useActiveBxgyOffers() {
  return useQuery({
    queryKey: ['active-bxgy-offers'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('bxgy_offers')
        .select(`
          *,
          buy_product:products!bxgy_offers_buy_product_id_fkey(id, name, image_url, slug),
          buy_category:categories!bxgy_offers_buy_category_id_fkey(id, name, slug),
          get_product:products!bxgy_offers_get_product_id_fkey(id, name, image_url, price, slug),
          get_category:categories!bxgy_offers_get_category_id_fkey(id, name, slug)
        `)
        .eq('is_active', true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BxgyOffer[];
    },
  });
}

export function useCreateBxgyOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offer: Partial<BxgyOffer>) => {
      const { data, error } = await supabase
        .from('bxgy_offers')
        .insert(offer as any)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bxgy-offers'] });
      toast.success('BXGY offer created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create offer: ' + error.message);
    },
  });
}

export function useUpdateBxgyOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BxgyOffer> & { id: string }) => {
      const { data, error } = await supabase
        .from('bxgy_offers')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bxgy-offers'] });
      toast.success('BXGY offer updated');
    },
    onError: (error) => {
      toast.error('Failed to update offer: ' + error.message);
    },
  });
}

export function useDeleteBxgyOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('bxgy_offers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bxgy-offers'] });
      toast.success('BXGY offer deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete offer: ' + error.message);
    },
  });
}

// Check if a cart qualifies for BXGY offers
export function useCheckBxgyEligibility() {
  return useMutation({
    mutationFn: async (cartItems: { product_id: string; quantity: number; category_id?: string }[]) => {
      const now = new Date().toISOString();
      
      // Get all active BXGY offers
      const { data: offers, error } = await supabase
        .from('bxgy_offers')
        .select(`
          *,
          get_product:products!bxgy_offers_get_product_id_fkey(id, name, price, image_url)
        `)
        .eq('is_active', true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`);

      if (error) throw error;

      const eligibleOffers: {
        offer: BxgyOffer;
        freeProduct: any;
        discount: number;
      }[] = [];

      for (const offer of offers || []) {
        // Check buy condition
        let buyQualified = false;
        
        if (offer.buy_product_id) {
          const productInCart = cartItems.find(item => item.product_id === offer.buy_product_id);
          buyQualified = productInCart ? productInCart.quantity >= offer.buy_quantity : false;
        } else if (offer.buy_category_id) {
          const categoryItems = cartItems.filter(item => item.category_id === offer.buy_category_id);
          const totalQty = categoryItems.reduce((sum, item) => sum + item.quantity, 0);
          buyQualified = totalQty >= offer.buy_quantity;
        }

        if (buyQualified && offer.get_product_id) {
          const getProduct = (offer as any).get_product;
          let discount = 0;
          
          if (offer.get_discount_type === 'free') {
            discount = getProduct?.price * offer.get_quantity || 0;
          } else if (offer.get_discount_type === 'percentage') {
            discount = (getProduct?.price * offer.get_quantity * offer.get_discount_value / 100) || 0;
          } else {
            discount = offer.get_discount_value * offer.get_quantity;
          }

          eligibleOffers.push({
            offer: offer as BxgyOffer,
            freeProduct: getProduct,
            discount,
          });
        }
      }

      return eligibleOffers;
    },
  });
}
