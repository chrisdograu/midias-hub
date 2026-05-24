import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2, UserPlus, UserCheck, Users, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Person { id: string; display_name: string | null; avatar_url: string | null; username: string | null }

type Tab = 'followers' | 'following' | 'discover';

function FollowBtn({ targetId, initiallyFollowing, onChange }: { targetId: string; initiallyFollowing: boolean; onChange?: (v: boolean) => void }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(initiallyFollowing);
  const [loading, setLoading] = useState(false);
  useEffect(() => { setFollowing(initiallyFollowing); }, [initiallyFollowing]);
  if (!user || user.id === targetId) return null;
  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (loading) return;
    setLoading(true);
    if (following) {
      await supabase.from('user_follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      setFollowing(false); onChange?.(false);
    } else {
      const { error } = await supabase.from('user_follows').insert({ follower_id: user.id, following_id: targetId });
      if (error) { toast.error('Não foi possível seguir'); setLoading(false); return; }
      setFollowing(true); onChange?.(true);
      await supabase.from('notifications').insert({
        user_id: targetId, type: 'novo_seguidor' as any,
        title: 'Você tem um novo seguidor 🎮',
        body: 'Alguém começou a seguir seu perfil na MIDIAS',
        reference_type: 'profile', reference_id: user.id,
      });
    }
    setLoading(false);
  };
  return (
    <button onClick={toggle} disabled={loading}
      className={`shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all ${following ? 'bg-card border border-border text-foreground' : 'bg-gradient-to-r from-primary to-accent text-primary-foreground'}`}>
      {following ? <span className="inline-flex items-center gap-1"><UserCheck className="h-3 w-3" />Seguindo</span> : <span className="inline-flex items-center gap-1"><UserPlus className="h-3 w-3" />Seguir</span>}
    </button>
  );
}

export default function MFriends() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const initial = (params.get('tab') as Tab) || 'following';
  const [tab, setTab] = useState<Tab>(initial);
  const [followers, setFollowers] = useState<Person[]>([]);
  const [following, setFollowing] = useState<Person[]>([]);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const handleFollowChange = (id: string, isF: boolean) => {
    setFollowingSet(prev => {
      const next = new Set(prev);
      if (isF) next.add(id); else next.delete(id);
      return next;
    });
  };
  const [query, setQuery] = useState('');
  const [discover, setDiscover] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setParams({ tab }, { replace: true }); }, [tab]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancel = false;
    (async () => {
      setLoading(true);
      const [{ data: fol }, { data: fing }] = await Promise.all([
        supabase.from('user_follows').select('follower_id').eq('following_id', user.id),
        supabase.from('user_follows').select('following_id').eq('follower_id', user.id),
      ]);
      const fIds = (fol || []).map((d: any) => d.follower_id);
      const gIds = (fing || []).map((d: any) => d.following_id);
      const all = [...new Set([...fIds, ...gIds])];
      const { data: profs } = all.length
        ? await supabase.from('profiles').select('id, display_name, avatar_url, username').in('id', all)
        : { data: [] as any[] };
      const map = new Map((profs || []).map((p: any) => [p.id, p]));
      if (cancel) return;
      setFollowers(fIds.map(id => map.get(id)).filter(Boolean) as Person[]);
      setFollowing(gIds.map(id => map.get(id)).filter(Boolean) as Person[]);
      setFollowingSet(new Set(gIds));
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [user?.id]);

  useEffect(() => {
    if (tab !== 'discover') return;
    const q = query.trim();
    if (q.length < 2) { setDiscover([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles').select('id, display_name, avatar_url, username')
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`).limit(30);
      setDiscover((data as Person[]) || []);
    }, 250);
    return () => clearTimeout(t);
  }, [query, tab]);

  if (!user) return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground mb-4">Entre para ver seus amigos.</p>
      <Link to="/m/auth" className="inline-block px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Entrar</Link>
    </div>
  );

  const list = tab === 'followers' ? followers : tab === 'following' ? following : discover;

  return (
    <div className="px-4 py-5 space-y-4">
      <Link to="/m/perfil" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</Link>

      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold gradient-text flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> Amigos
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-1 p-1 bg-secondary/40 rounded-lg">
        {([
          { id: 'following', label: `Seguindo (${following.length})` },
          { id: 'followers', label: `Seguidores (${followers.length})` },
          { id: 'discover', label: 'Descobrir' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} type="button"
            className={`py-2 px-1 rounded-md text-[11px] font-semibold ${tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'discover' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nome ou @username..."
            className="w-full pl-10 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : list.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <UserPlus className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">
            {tab === 'discover'
              ? (query.length < 2 ? 'Digite ao menos 2 letras para buscar.' : 'Nenhum usuário encontrado.')
              : tab === 'following' ? 'Você ainda não segue ninguém.' : 'Ninguém te segue ainda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map(p => (
            <div key={p.id} className="flex items-center gap-3 glass rounded-xl p-3 hover:border-primary/40 transition-colors">
              <Link to={`/m/perfil/${p.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-accent overflow-hidden flex items-center justify-center text-primary-foreground font-bold shrink-0">
                  {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : (p.display_name?.[0]?.toUpperCase() || '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{p.display_name || 'Usuário'}</p>
                  {p.username && <p className="text-xs text-muted-foreground truncate">@{p.username}</p>}
                </div>
              </Link>
              <FollowBtn targetId={p.id} initiallyFollowing={followingSet.has(p.id)} onChange={(v) => handleFollowChange(p.id, v)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
