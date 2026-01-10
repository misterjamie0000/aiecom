import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type CmsPage = Tables<'cms_pages'>;
type CmsPageInsert = TablesInsert<'cms_pages'>;
type CmsPageUpdate = TablesUpdate<'cms_pages'>;

export function useCmsPages() {
  return useQuery({
    queryKey: ['admin-cms-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCmsPage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (page: CmsPageInsert) => {
      const { data, error } = await supabase
        .from('cms_pages')
        .insert(page)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cms-pages'] });
      toast.success('Page created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create page: ' + error.message);
    },
  });
}

export function useUpdateCmsPage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...page }: CmsPageUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('cms_pages')
        .update(page)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cms-pages'] });
      toast.success('Page updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update page: ' + error.message);
    },
  });
}

export function useDeleteCmsPage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cms_pages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cms-pages'] });
      toast.success('Page deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete page: ' + error.message);
    },
  });
}
