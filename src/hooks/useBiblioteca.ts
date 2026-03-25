import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface BibliotecaItem {
  id: string;
  user_id: string;
  product_id: string;
  status: string;
  acquired_at: string;
  produto?: {
    title: string;
    image_url: string | null;
    platform: string[] | null;
    category: string | null;
  };
}

export function useBiblioteca() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: biblioteca = [], ...query } = useQuery({
    queryKey: ['biblioteca', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('biblioteca_usuario')
        .select('*, produto:product_id(title, image_url, platform, category)')
        .eq('user_id', user.id)
        .order('acquired_at', { ascending: false });
      if (error) throw error;
      return data as unknown as BibliotecaItem[];
    },
    enabled: !!user,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('biblioteca_usuario')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['biblioteca'] }),
  });

  return { biblioteca, updateStatus, isLoading: query.isLoading };
}
