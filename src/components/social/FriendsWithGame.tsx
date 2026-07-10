// Item 20 da auditoria: "Amigos que têm esse jogo".
// Cruza user_follows (quem o usuário segue) com biblioteca_usuario (quem tem este product_id).
// Para cada amigo, mostra avatar, nome, status de posse e um botão "Chamar pra jogar"
// que abre o chat direto (rota /chat/:userId, já existente no mobile e web).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MessageCircle, Users, Loader2 } from 'lucide-react';

interface FriendWithGame {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
}

const STATUS_LABEL: Record<string, string> = {
  jogando: 'Jogando',
  zerado: 'Zerado',
  pausado: 'Pausado',
  abandonado: 'Abandonou',
  ja_joguei: 'Já jogou',
  quero_jogar: 'Quer jogar',
};

const STATUS_TONE: Record<string, string> = {
  jogando: 'bg-success/15 text-success border-success/30',
  zerado: 'bg-primary/15 text-primary border-primary/30',
  pausado: 'bg-warning/15 text-warning border-warning/30',
  abandonado: 'bg-muted text-muted-foreground border-border',
  ja_joguei: 'bg-accent/15 text-accent border-accent/30',
  quero_jogar: 'bg-secondary text-secondary-foreground border-border',
};

interface Props {
  productId: string;
}

export default function FriendsWithGame({ productId }: Props) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !productId) { setLoading(false); return; }
    let cancel = false;
    (async () => {
      setLoading(true);
      // 1) Quem eu sigo
      const { data: follows } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);
      const followingIds = (follows || []).map((f: any) => f.following_id);
      if (followingIds.length === 0) {
        if (!cancel) { setFriends([]); setLoading(false); }
        return;
      }
      // 2) Entre eles, quem tem este jogo
      const { data: lib } = await supabase
        .from('biblioteca_usuario')
        .select('user_id, status')
        .eq('product_id', productId)
        .in('user_id', followingIds);
      const rows = (lib || []) as { user_id: string; status: string }[];
      if (rows.length === 0) {
        if (!cancel) { setFriends([]); setLoading(false); }
        return;
      }
      // 3) Perfis públicos (nome/avatar) — respeita RLS já vigente
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', rows.map(r => r.user_id));
      const pmap = new Map((profs || []).map((p: any) => [p.id, p]));
      const merged: FriendWithGame[] = rows.map(r => ({
        user_id: r.user_id,
        status: r.status,
        display_name: pmap.get(r.user_id)?.display_name ?? null,
        avatar_url: pmap.get(r.user_id)?.avatar_url ?? null,
      })).sort((a, b) => {
        const order = ['jogando','zerado','pausado','ja_joguei','abandonado','quero_jogar'];
        return order.indexOf(a.status) - order.indexOf(b.status);
      });
      if (!cancel) { setFriends(merged); setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [user?.id, productId]);

  if (!user) return null;
  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Amigos que têm esse jogo
        </h2>
        <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }
  if (friends.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" /> Amigos que têm esse jogo
        <span className="text-xs font-normal text-muted-foreground">({friends.length})</span>
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {friends.map(f => (
          <div key={f.user_id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
            <Link to={`/perfil/${f.user_id}`} className="shrink-0">
              {f.avatar_url ? (
                <img src={f.avatar_url} alt={f.display_name || ''} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
                  {(f.display_name || '?').charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/perfil/${f.user_id}`} className="text-sm font-semibold text-foreground hover:text-primary truncate block">
                {f.display_name || 'Usuário'}
              </Link>
              <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] rounded-full border ${STATUS_TONE[f.status] || STATUS_TONE.ja_joguei}`}>
                {STATUS_LABEL[f.status] || f.status}
              </span>
            </div>
            <Link
              to={`/chat/${f.user_id}`}
              className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
              title="Chamar pra jogar"
            >
              <MessageCircle className="h-3.5 w-3.5" /> Chamar
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
