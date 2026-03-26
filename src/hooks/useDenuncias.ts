import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useDenuncias() {
  const { user } = useAuth();

  const reportar = useMutation({
    mutationFn: async ({ targetType, targetId, reason, description }: {
      targetType: 'anuncio' | 'usuario';
      targetId: string;
      reason: string;
      description?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('denuncias' as any)
        .insert({
          reporter_id: user.id,
          target_type: targetType,
          target_id: targetId,
          reason,
          description,
        } as any);
      if (error) throw error;
    },
  });

  return { reportar };
}
