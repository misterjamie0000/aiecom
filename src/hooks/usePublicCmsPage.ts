import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePublicCmsPage(slug: string) {
  return useQuery({
    queryKey: ['cms-page', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

export function usePublicCmsPages() {
  return useQuery({
    queryKey: ['public-cms-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_pages')
        .select('title, slug')
        .eq('is_active', true)
        .order('title');
      
      if (error) throw error;
      return data;
    },
  });
}
