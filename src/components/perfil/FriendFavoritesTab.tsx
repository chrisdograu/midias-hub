// Amigos favoritos — gerido APENAS pelo dono na página de Perfil Web.
// Lista amigos mútuos + permite favoritar/desfavoritar.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Star, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface Friend {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_favorite: boolean;
}

export default function FriendFavoritesTab() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: rels }, { data: favs }] = await Promise.all([
        supabase.from('v_friendships').select('friend_id').eq('user_id', user.id),
        supabase.from('friend_favorites').select('friend_id').eq('user_id', user.id),
      ]);
      const friendIds = [...new Set((rels || []).map((r: any) => r.friend_id))];
      const favSet = new Set((favs || []).map((f: any) => f.friend_id));
      if (friendIds.length === 0) { setFriends([]); setLoading(false); return; }
      const { data: profs } = await supabase.from('profiles')
        .select('id, display_name, avatar_url').in('id', friendIds);
      const list: Friend[] = (profs || []).map(p => ({
        id: p.id, display_name: p.display_name, avatar_url: p.avatar_url,
        is_favorite: favSet.has(p.id),
      })).sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite)
                       || (a.display_name || '').localeCompare(b.display_name || ''));
      setFriends(list);
      setLoading(false);
    })();
  }, [user?.id]);

  const toggle = async (friend: Friend) => {
    if (!user) return;
    if (friend.is_favorite) {
      const { error } = await supabase.from('friend_favorites').delete()
        .eq('user_id', user.id).eq('friend_id', friend.id);
      if (error) { toast.error('Erro'); return; }
      toast.success('Removido dos favoritos');
    } else {
      const { error } = await supabase.from('friend_favorites').insert({
        user_id: user.id, friend_id: friend.id,
      });
      if (error) { toast.error('Erro'); return; }
      toast.success('Marcado como favorito ⭐');
    }
    setFriends(prev => prev.map(f => f.id === friend.id ? { ...f, is_favorite: !f.is_favorite } : f));
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-4">
        Marque amigos como favoritos para acesso rápido na Biblioteca Social. Visível apenas para você.
      </p>
      {friends.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Você ainda não tem amigos (follow mútuo). Siga pessoas no app mobile e peça para te seguirem de volta.
        </p>
      ) : (
        <ul className="space-y-2">
          {friends.map(f => (
            <li key={f.id} className="flex items-center gap-3 p-2.5 bg-secondary/40 rounded-lg">
              <div className="w-9 h-9 rounded-full bg-secondary overflow-hidden">
                {f.avatar_url ? <img src={f.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><User className="h-4 w-4 text-muted-foreground" /></div>}
              </div>
              <Link to={`/amigo/${f.id}`} className="flex-1 text-sm font-medium truncate hover:text-primary">
                {f.display_name || 'Amigo'}
              </Link>
              <button onClick={() => toggle(f)}
                className={`p-2 rounded-lg transition-colors ${
                  f.is_favorite ? 'bg-yellow-500/20 text-yellow-400' : 'text-muted-foreground hover:text-yellow-400'
                }`}
                title={f.is_favorite ? 'Remover dos favoritos' : 'Favoritar'}>
                <Star className={`h-4 w-4 ${f.is_favorite ? 'fill-current' : ''}`} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
