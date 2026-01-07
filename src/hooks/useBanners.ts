import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Banner = Tables<'banners'>;
type BannerInsert = TablesInsert<'banners'>;
type BannerUpdate = TablesUpdate<'banners'>;

export function useBanners() {
  return useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (banner: BannerInsert) => {
      const { data, error } = await supabase
        .from('banners')
        .insert(banner)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success('Banner created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create banner: ' + error.message);
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...banner }: BannerUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('banners')
        .update(banner)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success('Banner updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update banner: ' + error.message);
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success('Banner deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete banner: ' + error.message);
    },
  });
}
