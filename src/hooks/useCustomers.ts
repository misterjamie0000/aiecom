import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCustomers() {
  return useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCustomer(customerId: string) {
  return useQuery({
    queryKey: ['admin-customer', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}

export function useCustomerOrders(customerId: string) {
  return useQuery({
    queryKey: ['admin-customer-orders', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}

export function useCustomerCart(customerId: string) {
  return useQuery({
    queryKey: ['admin-customer-cart', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (
            id, name, slug, price, mrp, discount_percent, image_url, stock_quantity
          )
        `)
        .eq('user_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}

export function useCustomerWishlist(customerId: string) {
  return useQuery({
    queryKey: ['admin-customer-wishlist', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          *,
          products (
            id, name, slug, price, mrp, discount_percent, image_url, stock_quantity
          )
        `)
        .eq('user_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}

export function useCustomerAddresses(customerId: string) {
  return useQuery({
    queryKey: ['admin-customer-addresses', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', customerId)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}

export function useCustomerLoyalty(customerId: string) {
  return useQuery({
    queryKey: ['admin-customer-loyalty', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Calculate total balance
      const balance = data.reduce((sum, item) => sum + item.points, 0);
      return { transactions: data, balance };
    },
    enabled: !!customerId,
  });
}

export function useCustomerReviews(customerId: string) {
  return useQuery({
    queryKey: ['admin-customer-reviews', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          products (id, name, slug, image_url)
        `)
        .eq('user_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}

export function useCustomerReturns(customerId: string) {
  return useQuery({
    queryKey: ['admin-customer-returns', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('return_requests')
        .select(`
          *,
          orders (id, order_number)
        `)
        .eq('user_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}

export function useCustomerRecentlyViewed(customerId: string) {
  return useQuery({
    queryKey: ['admin-customer-recently-viewed', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recently_viewed')
        .select(`
          *,
          products (id, name, slug, price, image_url)
        `)
        .eq('user_id', customerId)
        .order('viewed_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
    enabled: !!customerId,
  });
}

export function useCustomerStats(customerId: string) {
  return useQuery({
    queryKey: ['admin-customer-stats', customerId],
    queryFn: async () => {
      // Fetch all stats in parallel
      const [ordersRes, cartRes, wishlistRes, loyaltyRes, reviewsRes, returnsRes, addressesRes] = await Promise.all([
        supabase.from('orders').select('id, total_amount, status').eq('user_id', customerId),
        supabase.from('cart_items').select('id').eq('user_id', customerId),
        supabase.from('wishlist').select('id').eq('user_id', customerId),
        supabase.from('loyalty_points').select('points').eq('user_id', customerId),
        supabase.from('reviews').select('id').eq('user_id', customerId),
        supabase.from('return_requests').select('id').eq('user_id', customerId),
        supabase.from('addresses').select('id').eq('user_id', customerId),
      ]);

      const orders = ordersRes.data || [];
      const completedOrders = orders.filter(o => !['cancelled', 'refunded'].includes(o.status));
      const totalSpent = completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const loyaltyBalance = (loyaltyRes.data || []).reduce((sum, l) => sum + l.points, 0);

      return {
        totalOrders: completedOrders.length,
        totalSpent,
        cartItems: cartRes.data?.length || 0,
        wishlistItems: wishlistRes.data?.length || 0,
        loyaltyPoints: loyaltyBalance,
        reviewsCount: reviewsRes.data?.length || 0,
        returnsCount: returnsRes.data?.length || 0,
        addressesCount: addressesRes.data?.length || 0,
      };
    },
    enabled: !!customerId,
  });
}

export function useCustomersWithStats() {
  return useQuery({
    queryKey: ['admin-customers-with-stats'],
    queryFn: async () => {
      // Get all customers
      const { data: customers, error: customersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (customersError) throw customersError;

      // Get order stats for all customers
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, total_amount, status');
      
      if (ordersError) throw ordersError;

      // Calculate stats per customer
      const statsMap = new Map<string, { totalOrders: number; totalSpent: number }>();
      
      orders?.forEach(order => {
        if (!['cancelled', 'refunded'].includes(order.status)) {
          const existing = statsMap.get(order.user_id) || { totalOrders: 0, totalSpent: 0 };
          statsMap.set(order.user_id, {
            totalOrders: existing.totalOrders + 1,
            totalSpent: existing.totalSpent + (order.total_amount || 0),
          });
        }
      });

      return customers?.map(customer => ({
        ...customer,
        stats: statsMap.get(customer.id) || { totalOrders: 0, totalSpent: 0 },
      }));
    },
  });
}
