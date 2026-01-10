import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type LoyaltyPoint = Tables<'loyalty_points'>;
type LoyaltyPointInsert = TablesInsert<'loyalty_points'>;

export function useLoyaltyPoints() {
  return useQuery({
    queryKey: ['admin-loyalty-points'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useLoyaltyStats() {
  return useQuery({
    queryKey: ['admin-loyalty-stats'],
    queryFn: async () => {
      const { data: points, error } = await supabase
        .from('loyalty_points')
        .select('user_id, points, transaction_type');
      
      if (error) throw error;
      
      // Calculate stats
      const userPoints: Record<string, number> = {};
      let totalEarned = 0;
      let totalRedeemed = 0;
      
      points?.forEach(p => {
        if (!userPoints[p.user_id]) userPoints[p.user_id] = 0;
        userPoints[p.user_id] += p.points;
        
        if (p.transaction_type === 'earn') totalEarned += p.points;
        if (p.transaction_type === 'redeem') totalRedeemed += Math.abs(p.points);
      });
      
      return {
        totalUsers: Object.keys(userPoints).length,
        totalEarned,
        totalRedeemed,
        netPoints: totalEarned - totalRedeemed,
      };
    },
  });
}

export function useAddLoyaltyPoints() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: LoyaltyPointInsert) => {
      const { data: result, error } = await supabase
        .from('loyalty_points')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-loyalty-points'] });
      queryClient.invalidateQueries({ queryKey: ['admin-loyalty-stats'] });
      toast.success('Points added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add points: ' + error.message);
    },
  });
}
