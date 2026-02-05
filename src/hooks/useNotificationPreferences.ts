import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface NotificationPreferences {
  order_updates: boolean;
  promotions: boolean;
  newsletter: boolean;
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      // Return default values if no preferences exist
      if (!data) {
        return {
          order_updates: true,
          promotions: false,
          newsletter: true,
        };
      }
      
      return {
        order_updates: data.order_updates,
        promotions: data.promotions,
        newsletter: data.newsletter,
      };
    },
    enabled: !!user?.id,
  });
}

export function useUpdateNotificationPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (preferences: NotificationPreferences) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      // Try to update first
      const { data: existing } = await supabase
        .from('user_notification_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) {
        // Update existing preferences
        const { error } = await supabase
          .from('user_notification_preferences')
          .update({
            order_updates: preferences.order_updates,
            promotions: preferences.promotions,
            newsletter: preferences.newsletter,
          })
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        // Insert new preferences
        const { error } = await supabase
          .from('user_notification_preferences')
          .insert({
            user_id: user.id,
            order_updates: preferences.order_updates,
            promotions: preferences.promotions,
            newsletter: preferences.newsletter,
          });
        
        if (error) throw error;
      }
      
      return preferences;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Preferences saved');
    },
    onError: (error) => {
      toast.error('Failed to save preferences: ' + error.message);
    },
  });
}
