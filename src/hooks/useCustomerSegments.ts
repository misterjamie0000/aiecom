import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomerSegment {
  id: string;
  name: string;
  description: string | null;
  segment_type: string;
  criteria: any;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

export interface SegmentMember {
  id: string;
  customer_id: string;
  segment_id: string;
  assigned_at: string;
  assigned_by: string;
  customer?: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    created_at: string;
  };
}

export interface CustomerWithStats {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
  segments: CustomerSegment[];
}

export function useCustomerSegments() {
  return useQuery({
    queryKey: ['customer-segments'],
    queryFn: async () => {
      const { data: segments, error } = await supabase
        .from('customer_segments')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;

      // Get member counts
      const segmentsWithCounts = await Promise.all(
        (segments || []).map(async (segment) => {
          const { count } = await supabase
            .from('customer_segment_members')
            .select('*', { count: 'exact', head: true })
            .eq('segment_id', segment.id);
          
          return {
            ...segment,
            member_count: count || 0
          };
        })
      );

      return segmentsWithCounts as CustomerSegment[];
    },
  });
}

export function useSegmentMembers(segmentId: string | null) {
  return useQuery({
    queryKey: ['segment-members', segmentId],
    queryFn: async () => {
      if (!segmentId) return [];

      // Get segment members
      const { data: members, error } = await supabase
        .from('customer_segment_members')
        .select('*')
        .eq('segment_id', segmentId)
        .order('assigned_at', { ascending: false });
      
      if (error) throw error;

      // Get customer details for each member
      const membersWithCustomers = await Promise.all(
        (members || []).map(async (member) => {
          const { data: customer } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone, created_at')
            .eq('id', member.customer_id)
            .single();

          return {
            ...member,
            customer: customer || undefined,
          };
        })
      );

      return membersWithCustomers as SegmentMember[];
    },
    enabled: !!segmentId,
  });
}

export function useCustomersWithStats() {
  return useQuery({
    queryKey: ['customers-with-stats'],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get order stats for each customer
      const customersWithStats = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get order stats
          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, created_at')
            .eq('user_id', profile.id)
            .not('status', 'in', '("cancelled","refunded")');

          const totalOrders = orders?.length || 0;
          const totalSpent = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;
          const lastOrderDate = orders?.length ? orders.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]?.created_at : null;

          // Get segments
          const { data: memberSegments } = await supabase
            .from('customer_segment_members')
            .select('segment:customer_segments(*)')
            .eq('customer_id', profile.id);

          const segments = memberSegments?.map(m => m.segment).filter(Boolean) || [];

          return {
            ...profile,
            total_orders: totalOrders,
            total_spent: totalSpent,
            last_order_date: lastOrderDate,
            segments: segments as CustomerSegment[],
          };
        })
      );

      return customersWithStats as CustomerWithStats[];
    },
  });
}

export function useCreateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (segment: Partial<CustomerSegment>) => {
      const { data, error } = await supabase
        .from('customer_segments')
        .insert({
          name: segment.name!,
          description: segment.description,
          segment_type: segment.segment_type || 'manual',
          criteria: segment.criteria || {},
          color: segment.color || '#6366f1',
          is_active: segment.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-segments'] });
      toast.success('Segment created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create segment: ' + error.message);
    },
  });
}

export function useUpdateSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...segment }: Partial<CustomerSegment> & { id: string }) => {
      const { data, error } = await supabase
        .from('customer_segments')
        .update(segment)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-segments'] });
      toast.success('Segment updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update segment: ' + error.message);
    },
  });
}

export function useDeleteSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customer_segments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-segments'] });
      toast.success('Segment deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete segment: ' + error.message);
    },
  });
}

export function useAddCustomerToSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, segmentId }: { customerId: string; segmentId: string }) => {
      const { data, error } = await supabase
        .from('customer_segment_members')
        .insert({
          customer_id: customerId,
          segment_id: segmentId,
          assigned_by: 'manual',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-segments'] });
      queryClient.invalidateQueries({ queryKey: ['segment-members'] });
      queryClient.invalidateQueries({ queryKey: ['customers-with-stats'] });
      toast.success('Customer added to segment');
    },
    onError: (error) => {
      toast.error('Failed to add customer: ' + error.message);
    },
  });
}

export function useRemoveCustomerFromSegment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, segmentId }: { customerId: string; segmentId: string }) => {
      const { error } = await supabase
        .from('customer_segment_members')
        .delete()
        .eq('customer_id', customerId)
        .eq('segment_id', segmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-segments'] });
      queryClient.invalidateQueries({ queryKey: ['segment-members'] });
      queryClient.invalidateQueries({ queryKey: ['customers-with-stats'] });
      toast.success('Customer removed from segment');
    },
    onError: (error) => {
      toast.error('Failed to remove customer: ' + error.message);
    },
  });
}

export function useRefreshSegments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('refresh_all_customer_segments');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-segments'] });
      queryClient.invalidateQueries({ queryKey: ['segment-members'] });
      queryClient.invalidateQueries({ queryKey: ['customers-with-stats'] });
      toast.success('All segments refreshed');
    },
    onError: (error) => {
      toast.error('Failed to refresh segments: ' + error.message);
    },
  });
}
