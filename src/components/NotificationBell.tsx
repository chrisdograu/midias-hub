import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Notif {
  id: string; title: string; body: string | null; type: string;
  is_read: boolean; created_at: string; reference_type: string | null; reference_id: string | null;
  kind?: string | null; cta_label?: string | null; cta_url?: string | null;
  href?: string;
}

const isMobileCtx = () => typeof window !== 'undefined' && window.location.pathname.startsWith('/m');

function linkFor(n: Notif): string {
  const isMobile = isMobileCtx();
  const t = n.reference_type;
  const id = n.reference_id;
  if (t === 'produto' && id) return isMobile ? `/m/review/${id}` : `/jogo/${id}`;
  if (t === 'pedido') return isMobile ? '/m/perfil' : '/pedidos';
  if (t === 'anuncio' && id) return isMobile ? `/m/marketplace/${id}` : '/perfil';
  if (t === 'proposta') return isMobile ? '/m/perfil' : '/perfil';
  if (t === 'forum_post' && id) return isMobile ? `/m/forum/post/${id}` : '/perfil';
  if (t === 'tournament') return isMobile ? '/m/perfil' : '/torneios';
  if (t === 'certificado') return isMobile ? '/m/perfil' : '/perfil';
  if (t === 'review_comment' || t === 'avaliacao')
    return isMobile ? (id ? `/m/review/${id}` : '/m/perfil') : (id ? `/jogo/${id}` : '/perfil');
  if (t === 'profile' && id) return isMobile ? `/m/perfil/${id}` : `/perfil/${id}`;
  if (t === 'game_suggestion' && id) return isMobile ? `/m/forum/jogo/${id}` : `/jogo/${id}`;
  return isMobile ? '/m/perfil' : '/perfil';
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);

  const load = async () => {
    if (!user) return;
    const isMobile = isMobileCtx();
    const { data } = await supabase.from('notifications')
      .select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(20);
    const rows = ((data as any) || []) as Notif[];

    const messageIds = rows
      .filter((item) => item.reference_type === 'mensagem' && item.reference_id)
      .map((item) => item.reference_id as string);

    const messageHrefMap = new Map<string, string>();

    if (messageIds.length) {
      const { data: messages } = await supabase
        .from('mensagens')
        .select('id, sender_id, receiver_id')
        .in('id', messageIds);

      await Promise.all(
        (messages || []).map(async (message) => {
          const { data: conversation } = await supabase
            .from('conversas')
            .select('id')
            .or(`and(participant_1.eq.${message.sender_id},participant_2.eq.${message.receiver_id}),and(participant_1.eq.${message.receiver_id},participant_2.eq.${message.sender_id})`)
            .order('last_message_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (conversation?.id) {
            messageHrefMap.set(message.id, isMobile ? `/m/chat/${conversation.id}` : '/perfil');
          }
        })
      );
    }

    setItems(rows.map((item) => ({
      ...item,
      href: item.reference_type === 'mensagem' && item.reference_id
        ? messageHrefMap.get(item.reference_id) || (isMobile ? '/m/chat' : '/perfil')
        : linkFor(item),
    })));
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel('notif-bell')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const unread = items.filter(i => !i.is_read).length;

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    load();
  };

  const markOneRead = async (id: string, alreadyRead: boolean) => {
    if (!alreadyRead) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', user?.id || '');
    }
    setOpen(false);
    load();
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-secondary transition-colors" aria-label="Notificações">
        <Bell className="h-5 w-5 text-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 top-full mt-1 z-50 w-[min(20rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] bg-card border border-border rounded-lg shadow-xl overflow-hidden">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notificações</h3>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">Marcar todas como lidas</button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-border">
                {items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma notificação</p>}
                {items.map(n => {
                  const isMobile = isMobileCtx();
                  const ctaHref = n.cta_url
                    ? (isMobile && n.cta_url.startsWith('/perfil') ? n.cta_url.replace('/perfil', '/m/perfil') : n.cta_url)
                    : null;
                  const mainHref = n.href || linkFor(n);
                  return (
                    <div key={n.id} className={`p-3 hover:bg-secondary/50 transition-colors ${!n.is_read ? 'bg-primary/5' : ''} ${n.kind === 'destacada' ? 'border-l-2 border-primary' : ''}`}>
                      <Link to={mainHref} onClick={() => markOneRead(n.id, n.is_read)} className="block">
                        <div className="flex items-start gap-2">
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{n.title}</p>
                            {n.body && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>}
                            <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                      </Link>
                      {ctaHref && n.cta_label && (
                        <Link
                          to={ctaHref}
                          onClick={() => markOneRead(n.id, n.is_read)}
                          className="mt-2 ml-4 inline-flex items-center px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
                        >
                          {n.cta_label}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
