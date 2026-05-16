import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Users, Loader2, Library } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface FriendActivity {
  user_id: string; display_name: string | null; avatar_url: string | null;
  product_id: string; product_title: string; product_image: string | null;
  acquired_at: string; status: string;
}

const PAGE = 20;
type FilterT = 'all' | 'quero_jogar' | 'jogando' | 'zerado';

export default function Social() {
  const { user } = useAuth();
  const [feed, setFeed] = useState<FriendActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<FilterT>('all');
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data: convs } = await supabase.from('conversas').select('participant_1, participant_2').or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`).eq('status', 'accepted');
      const ids = new Set<string>();
      (convs || []).forEach(c => { ids.add(c.participant_1 === user.id ? c.participant_2 : c.participant_1); });
      ids.delete(user.id);
      setFriendIds([...ids]);
    })();
  }, [user]);

  const loadPage = useCallback(async (reset = false) => {
    if (loadingRef.current || !user || friendIds.length === 0) { setLoading(false); return; }
    loadingRef.current = true;
    const offset = reset ? 0 : feed.length;
    let q = supabase
      .from('biblioteca_usuario')
      .select('user_id, product_id, status, acquired_at, profiles!inner(display_name, avatar_url, is_private), produtos!inner(title, image_url)')
      .in('user_id', friendIds)
      .order('acquired_at', { ascending: false })
      .range(offset, offset + PAGE - 1);
    if (filter !== 'all') q = q.eq('status', filter);
    const { data } = await q;
    const items: FriendActivity[] = ((data as any) || [])
      .filter((r: any) => !r.profiles?.is_private)
      .map((r: any) => ({
        user_id: r.user_id, display_name: r.profiles?.display_name, avatar_url: r.profiles?.avatar_url,
        product_id: r.product_id, product_title: r.produtos?.title, product_image: r.produtos?.image_url,
        acquired_at: r.acquired_at, status: r.status,
      }));
    setFeed(reset ? items : [...feed, ...items]);
    setHasMore(items.length === PAGE);
    setLoading(false);
    loadingRef.current = false;
  }, [user, friendIds, feed, filter]);

  useEffect(() => { setFeed([]); setHasMore(true); loadPage(true); /* eslint-disable-next-line */ }, [friendIds, filter]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const obs = new IntersectionObserver(es => { if (es[0].isIntersecting) loadPage(); }, { threshold: 0.5 });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, loadPage]);

  if (!user) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <Users className="h-12 w-12 text-primary mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Social</h1>
      <p className="text-muted-foreground mb-4">Entre para ver o feed dos seus amigos.</p>
      <Link to="/auth" className="text-primary hover:underline">Entrar</Link>
    </div>
  );

  const filters: { k: FilterT; label: string }[] = [
    { k: 'all', label: 'Tudo' },
    { k: 'quero_jogar', label: 'Wishlist/Compras' },
    { k: 'jogando', label: 'Jogando' },
    { k: 'zerado', label: 'Zerados' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-display font-bold">Social</h1>
          <p className="text-muted-foreground text-sm">Atividade recente dos seus amigos</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map(f => (
          <Button key={f.k} size="sm" variant={filter === f.k ? 'default' : 'outline'} onClick={() => setFilter(f.k)}>
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div> :
        feed.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Nenhuma atividade ainda. Converse com outros usuários no app mobile para começar a seguir suas atividades.</p>
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {feed.map((it, i) => (
                <li key={`${it.user_id}-${it.product_id}-${i}`} className="flex gap-3 items-center bg-card border border-border rounded-lg p-3">
                  <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0">
                    {it.avatar_url ? <img src={it.avatar_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs">{(it.display_name || '?')[0]}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <Link to={`/perfil/${it.user_id}`} className="font-medium hover:text-primary">{it.display_name || 'Usuário'}</Link>{' '}
                      <span className="text-muted-foreground">{it.status === 'jogando' ? 'está jogando' : it.status === 'zerado' ? 'zerou' : 'adicionou'}</span>{' '}
                      <Link to={`/jogo/${it.product_id}`} className="font-medium hover:text-primary">{it.product_title}</Link>
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(it.acquired_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  {it.product_image && <Link to={`/jogo/${it.product_id}`}><img src={it.product_image} alt="" className="w-14 h-14 rounded object-cover" /></Link>}
                </li>
              ))}
            </ul>
            {hasMore && <div ref={sentinelRef} className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}
          </>
        )}
      <div className="mt-10 text-center">
        <Link to="/biblioteca" className="text-sm text-primary hover:underline inline-flex items-center gap-1"><Library className="h-4 w-4" /> Ver minha biblioteca</Link>
      </div>
    </div>
  );
}
