import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TradeProposal {
  id: string;
  anuncio_id: string;
  proposer_id: string;
  offered_item: string;
  status: string;
  created_at: string;
  proposer_profile?: { display_name: string | null };
}

export function useTradeProposals(anuncioId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: proposals = [] } = useQuery({
    queryKey: ['trade-proposals', anuncioId],
    queryFn: async () => {
      if (!anuncioId) return [];
      const { data, error } = await supabase
        .from('trade_proposals' as any)
        .select('*, proposer_profile:proposer_id(display_name)')
        .eq('anuncio_id', anuncioId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as TradeProposal[];
    },
    enabled: !!anuncioId && !!user,
  });

  const createProposal = useMutation({
    mutationFn: async (offeredItem: string) => {
      if (!user || !anuncioId) throw new Error('Missing data');
      const { error } = await supabase
        .from('trade_proposals' as any)
        .insert({ anuncio_id: anuncioId, proposer_id: user.id, offered_item: offeredItem } as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trade-proposals', anuncioId] }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ proposalId, status }: { proposalId: string; status: string }) => {
      const { error } = await supabase
        .from('trade_proposals' as any)
        .update({ status } as any)
        .eq('id', proposalId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trade-proposals', anuncioId] }),
  });

  return { proposals, createProposal, updateStatus };
}
