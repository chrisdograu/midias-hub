import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Notif {
  id: string; title: string; body: string | null; type: string;
  is_read: boolean; created_at: string; reference_type: string | null; reference_id: string | null;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications')
      .select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(20);
    setItems((data as any) || []);
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

  const linkFor = (n: Notif) => {
    if (n.reference_type === 'pedido') return '/pedidos';
    if (n.reference_type === 'review_comment' || n.reference_type === 'avaliacao') return '/perfil';
    if (n.reference_type === 'certificado') return '/perfil';
    return '/perfil';
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
              className="absolute right-0 top-full mt-1 w-80 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notificações</h3>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">Marcar todas como lidas</button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-border">
                {items.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma notificação</p>}
                {items.map(n => (
                  <Link key={n.id} to={linkFor(n)} onClick={() => setOpen(false)}
                    className={`block p-3 hover:bg-secondary/50 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}>
                    <div className="flex items-start gap-2">
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{n.title}</p>
                        {n.body && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
