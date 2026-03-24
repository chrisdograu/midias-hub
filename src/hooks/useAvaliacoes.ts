import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Avaliacao {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null };
}

export function useAvaliacoes(productId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: avaliacoes = [], ...query } = useQuery({
    queryKey: ['avaliacoes', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('*, profiles:user_id(display_name, avatar_url)')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Avaliacao[];
    },
    enabled: !!productId,
  });

  const addAvaliacao = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment: string }) => {
      if (!user || !productId) throw new Error('Missing data');
      const { error } = await supabase.from('avaliacoes').insert({
        user_id: user.id,
        product_id: productId,
        rating,
        comment: comment || null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['avaliacoes', productId] }),
  });

  return { avaliacoes, addAvaliacao, isLoading: query.isLoading };
}
