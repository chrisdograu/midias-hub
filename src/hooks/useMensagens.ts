import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export interface Mensagem {
  id: string;
  sender_id: string;
  receiver_id: string;
  anuncio_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_profile?: { display_name: string | null };
  receiver_profile?: { display_name: string | null };
}

export interface Conversa {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  lastDate: string;
  unread: number;
  anuncioId: string | null;
}

export function useMensagens(partnerId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // List conversations
  const { data: conversas = [] } = useQuery({
    queryKey: ['conversas', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('mensagens')
        .select('*, sender_profile:sender_id(display_name), receiver_profile:receiver_id(display_name)')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const msgs = data as unknown as Mensagem[];
      const convMap = new Map<string, Conversa>();
      for (const msg of msgs) {
        const pid = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!convMap.has(pid)) {
          const pName = msg.sender_id === user.id
            ? (msg.receiver_profile as any)?.display_name || 'Usuário'
            : (msg.sender_profile as any)?.display_name || 'Usuário';
          convMap.set(pid, {
            partnerId: pid,
            partnerName: pName,
            lastMessage: msg.content,
            lastDate: msg.created_at,
            unread: 0,
            anuncioId: msg.anuncio_id,
          });
        }
        if (msg.receiver_id === user.id && !msg.is_read) {
          const conv = convMap.get(pid)!;
          conv.unread++;
        }
      }
      return Array.from(convMap.values());
    },
    enabled: !!user,
  });

  // Messages with a specific partner
  const { data: mensagens = [] } = useQuery({
    queryKey: ['mensagens', user?.id, partnerId],
    queryFn: async () => {
      if (!user || !partnerId) return [];
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Mensagem[];
    },
    enabled: !!user && !!partnerId,
  });

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('mensagens-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, () => {
        queryClient.invalidateQueries({ queryKey: ['mensagens'] });
        queryClient.invalidateQueries({ queryKey: ['conversas'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const enviarMensagem = useMutation({
    mutationFn: async ({ receiverId, content, anuncioId }: { receiverId: string; content: string; anuncioId?: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('mensagens').insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        anuncio_id: anuncioId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens'] });
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
    },
  });

  const marcarLida = useMutation({
    mutationFn: async (messageId: string) => {
      await supabase.from('mensagens').update({ is_read: true }).eq('id', messageId);
    },
  });

  return { conversas, mensagens, enviarMensagem, marcarLida };
}
