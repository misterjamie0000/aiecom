import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type SiteSetting = Tables<'site_settings'>;
type SiteSettingInsert = TablesInsert<'site_settings'>;
type SiteSettingUpdate = TablesUpdate<'site_settings'>;

export function useSiteSettings() {
  return useQuery({
    queryKey: ['admin-site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('key', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useSetting(key: string) {
  return useQuery({
    queryKey: ['site-setting', key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', key)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: any; description?: string }) => {
      const { data, error } = await supabase
        .from('site_settings')
        .upsert({ key, value, description }, { onConflict: 'key' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-setting'] });
      toast.success('Setting saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save setting: ' + error.message);
    },
  });
}

export function useDeleteSetting() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('site_settings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-site-settings'] });
      toast.success('Setting deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete setting: ' + error.message);
    },
  });
}
