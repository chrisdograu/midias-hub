import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Search, MessagesSquare, TrendingUp, Clock, MessageSquare, ThumbsUp, ThumbsDown, Star, Flame, Newspaper, Gamepad2, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MobileChip, MForumTag, MobileBadge } from '@/mobile/lib/badge';
import { timeAgo, periodSince, type Period } from '@/mobile/lib/time';
import { HalfStarDisplay } from '@/components/HalfStarRating';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/hooks/useAuth';
import { useLoginGate } from '@/components/LoginGate';
import { ItemActionsMenu } from '@/components/ItemActionsMenu';
import { toast } from 'sonner';

type Sort = 'popular' | 'recent' | 'commented';
type Tab = 'posts';
const SORTS: { id: Sort; label: string; icon: any }[] = [
  { id: 'popular', label: 'Populares', icon: TrendingUp },
  { id: 'recent', label: 'Recentes', icon: Clock },
  { id: 'commented', label: 'Comentados', icon: MessageSquare },
];
const PERIODS: { id: Period; label: string }[] = [
  { id: 'day', label: 'Hoje' }, { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mês' }, { id: 'year', label: 'Ano' }, { id: 'all', label: 'Todos' },
];

interface TopGame { id: string; title: string; image_url: string | null; postCount: number }
interface ForumPost {
  id: string; content: string; created_at: string; likes_count: number; user_id: string;
  product_id: string; replies_count: number; author: string; product: string;
}
export default function MForum() {
  const [tab, setTab] = useState<Tab>('posts');
  const [sort, setSort] = useState<Sort>('popular');
  const [period, setPeriod] = useState<Period>('week');
  const [query, setQuery] = useState('');
  const [topGames, setTopGames] = useState<TopGame[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityHits, setCommunityHits] = useState<{ id: string; title: string; image_url: string | null }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const since = periodSince(period);
      const sinceISO = since ? since.toISOString() : '1970-01-01';

      const [{ data: rawPosts }] = await Promise.all([
        supabase.from('forum_posts').select('id, content, created_at, likes_count, user_id, product_id').gte('created_at', sinceISO).limit(100),
      ]);

      const userIds = new Set<string>();
      const productIds = new Set<string>();
      rawPosts?.forEach(p => userIds.add(p.user_id));
      rawPosts?.forEach(p => productIds.add(p.product_id));
      const postIds = rawPosts?.map(p => p.id) || [];

      const [{ data: profiles }, { data: replies }, { data: products }] = await Promise.all([
        userIds.size ? supabase.from('profiles').select('id, display_name').in('id', [...userIds]) : Promise.resolve({ data: [] }),
        postIds.length ? supabase.from('forum_replies').select('post_id').in('post_id', postIds) : Promise.resolve({ data: [] }),
        productIds.size ? supabase.from('produtos').select('id, title, image_url').in('id', [...productIds]) : Promise.resolve({ data: [] }),
      ]);
      const productMap = new Map((products || []).map(p => [p.id, p]));
      const profileMap = new Map((profiles || []).map(p => [p.id, p.display_name || 'Usuário']));
      const replyCount = new Map<string, number>();
      (replies || []).forEach(r => replyCount.set(r.post_id, (replyCount.get(r.post_id) || 0) + 1));

      // Top 10 games (by post count in period)
      const countByGame = new Map<string, number>();
      rawPosts?.forEach(p => countByGame.set(p.product_id, (countByGame.get(p.product_id) || 0) + 1));
      const top: TopGame[] = [...countByGame.entries()]
        .sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([id, c]) => {
          const p = productMap.get(id);
          return { id, title: p?.title || 'Jogo', image_url: p?.image_url || null, postCount: c };
        });
      // Fallback: se não houver posts no período, lista jogos por rating
      if (top.length === 0) {
        const { data: fallbackProducts } = await supabase
          .from('produtos')
          .select('id, title, image_url')
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .limit(10);
        if (fallbackProducts?.length) {
          top.push(...fallbackProducts.map(p => ({ id: p.id, title: p.title, image_url: p.image_url, postCount: 0 })));
        }
      }

      const postsList: ForumPost[] = (rawPosts || []).map(p => ({
        id: p.id, content: p.content, created_at: p.created_at || '',
        likes_count: p.likes_count, user_id: p.user_id, product_id: p.product_id,
        replies_count: replyCount.get(p.id) || 0,
        author: profileMap.get(p.user_id) || 'Usuário',
        product: productMap.get(p.product_id)?.title || 'Jogo',
      }));
      if (!cancel) { setTopGames(top); setPosts(postsList); setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [period]);

  const debouncedQuery = useDebounce(query, 250);

  // Busca priorizando comunidades de jogos (produtos por título)
  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) { setCommunityHits([]); return; }
    let cancel = false;
    supabase.from('produtos').select('id, title, image_url').eq('is_active', true).ilike('title', `%${q}%`).limit(6)
      .then(({ data }) => { if (!cancel) setCommunityHits(data || []); });
    return () => { cancel = true; };
  }, [debouncedQuery]);

  const sortedPosts = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    let arr = posts.filter(p => !q || p.content.toLowerCase().includes(q) || p.product.toLowerCase().includes(q));
    if (sort === 'recent') arr = [...arr].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    else if (sort === 'commented') arr = [...arr].sort((a, b) => b.replies_count - a.replies_count);
    else arr = [...arr].sort((a, b) => (b.likes_count + b.replies_count * 2) - (a.likes_count + a.replies_count * 2));
    return arr.slice(0, 30);
  }, [posts, sort, debouncedQuery]);

  return (
    <div className="px-4 py-5 space-y-4">
      <h1 className="font-display text-xl font-bold gradient-text flex items-center gap-2">
        <MessagesSquare className="h-5 w-5" /> Fórum MIDIAS
      </h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar posts, reviews, jogos..." className="w-full pl-10 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>


      {/* Comunidades correspondentes (prioridade na busca) */}
      {communityHits.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-accent" /> Comunidades</h2>
          <div className="space-y-1.5">
            {communityHits.map(g => (
              <Link key={g.id} to={`/m/forum/${g.id}`} className="flex items-center gap-2.5 glass rounded-lg p-2 hover:border-primary/40">
                <div className="w-10 h-12 rounded bg-muted overflow-hidden shrink-0">
                  {g.image_url ? <img src={g.image_url} alt={g.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Gamepad2 className="h-4 w-4" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <MForumTag name={g.title.toLowerCase().replace(/\s+/g, '').slice(0, 14)} />
                  <p className="text-xs font-semibold truncate mt-0.5">{g.title}</p>
                </div>
                <span className="text-[10px] text-primary font-semibold">Abrir →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top 10 M/jogos */}
      <section>

        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-primary" /> Top 10 M/jogos</h2>
        <div className="flex gap-2 overflow-x-auto scrollbar-thin -mx-4 px-4 pb-1">
          {topGames.length === 0 && <p className="text-sm text-muted-foreground">Nenhum jogo ativo ainda.</p>}
          {topGames.map((g, i) => (
            <Link key={g.id} to={`/m/forum/${g.id}`} className="shrink-0 w-28 glass rounded-xl overflow-hidden hover:border-accent/40 transition-colors">
              <div className="aspect-[3/4] bg-muted relative">
                {g.image_url ? <img src={g.image_url} alt={g.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Gamepad2 className="h-6 w-6" /></div>}
                <div className="absolute top-1 left-1 bg-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded">#{i + 1}</div>
              </div>
              <div className="p-1.5">
                <MForumTag name={g.title.toLowerCase().replace(/\s+/g, '').slice(0, 10)} />
                <p className="text-[10px] text-muted-foreground mt-0.5">{g.postCount} posts</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Filtros + período */}
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-thin -mx-4 px-4">
          {SORTS.map(s => <MobileChip key={s.id} active={sort === s.id} onClick={() => setSort(s.id)}>{s.label}</MobileChip>)}
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-thin -mx-4 px-4">
          {PERIODS.map(p => <MobileChip key={p.id} active={period === p.id} onClick={() => setPeriod(p.id)}>{p.label}</MobileChip>)}
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2.5">
          {sortedPosts.length === 0 ? <p className="text-center py-10 text-sm text-muted-foreground">Nenhum post no período.</p> :
            sortedPosts.map(p => <PostCard key={p.id} p={p} onDeleted={() => setPosts(prev => prev.filter(x => x.id !== p.id))} />)}
        </div>
      )}
    </div>
  );
}



function PostCard({ p, onDeleted }: { p: ForumPost; onDeleted?: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const handleDelete = async () => {
    if (!user || user.id !== p.user_id) return;
    const { error } = await supabase.from('forum_posts').delete().eq('id', p.id);
    if (error) { toast.error('Não foi possível excluir'); return; }
    toast.success('Post excluído');
    onDeleted?.();
  };
  const handleEdit = () => {
    toast.info('Edição de post será disponibilizada na próxima etapa do fórum.');
  };
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/m/forum/post/${p.id}`)}
      onKeyDown={e => { if (e.key === 'Enter') navigate(`/m/forum/post/${p.id}`); }}
      className="block glass rounded-xl p-3 hover:border-primary/40 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between mb-1.5">
        <button
          onClick={e => { e.stopPropagation(); navigate(`/m/forum/${p.product_id}`); }}
          className="bg-transparent border-0 p-0 cursor-pointer"
        >
          <MForumTag name={p.product.toLowerCase().replace(/\s+/g, '').slice(0, 12)} />
        </button>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">{timeAgo(p.created_at)}</span>
          <ItemActionsMenu
            copyText={p.content}
            shareUrl={`/m/forum/post/${p.id}`}
            canEdit={!!user && user.id === p.user_id}
            onEdit={handleEdit}
            canDelete={!!user && user.id === p.user_id}
            onDelete={handleDelete}
            deleteConfirm="Excluir este post?"
            reportType={user && user.id !== p.user_id ? 'forum_post' : undefined}
            reportTargetId={p.id}
            reportLabel="post"
            iconClassName="h-3.5 w-3.5"
          />
        </div>
      </div>
      <p className="text-sm text-foreground line-clamp-3">{p.content}</p>
      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
        <span>por <b className="text-foreground">{p.author}</b></span>
        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{p.likes_count}</span>
        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{p.replies_count}</span>
      </div>
    </div>
  );
}
