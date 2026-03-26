import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Anuncio {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  game_title: string;
  platform: string;
  condition: string;
  price: number;
  status: string;
  ad_type: string;
  category: string;
  certificate_type: string;
  desired_item: string | null;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null };
  fotos_anuncio?: { id: string; image_url: string; position: number }[];
}

export function useAnuncios() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: anuncios = [], ...query } = useQuery({
    queryKey: ['anuncios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anuncios')
        .select('*, profiles:seller_id(display_name, avatar_url), fotos_anuncio(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Anuncio[];
    },
  });

  const meusAnuncios = useQuery({
    queryKey: ['meus-anuncios', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('anuncios')
        .select('*, fotos_anuncio(*)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Anuncio[];
    },
    enabled: !!user,
  });

  const criarAnuncio = useMutation({
    mutationFn: async (anuncio: {
      title: string; description: string; game_title: string;
      platform: string; condition: string; price: number;
      ad_type?: string; category?: string; certificate_type?: string; desired_item?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('anuncios')
        .insert({ ...anuncio, seller_id: user.id } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anuncios'] });
      queryClient.invalidateQueries({ queryKey: ['meus-anuncios'] });
    },
  });

  const deletarAnuncio = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('anuncios').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anuncios'] });
      queryClient.invalidateQueries({ queryKey: ['meus-anuncios'] });
    },
  });

  return { anuncios, meusAnuncios: meusAnuncios.data || [], criarAnuncio, deletarAnuncio, isLoading: query.isLoading };
}
