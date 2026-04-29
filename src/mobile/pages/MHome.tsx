import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, ShoppingBag, MessagesSquare, Star, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MobileBadge, MobileChip, MForumTag } from '@/mobile/lib/badge';
import { timeAgo } from '@/mobile/lib/time';
import { HalfStarDisplay } from '@/components/HalfStarRating';
import { getFollowingIds } from '@/mobile/lib/useFollow';

type FeedItem =
  | { kind: 'forum'; id: string; created_at: string; content: string; author: string; product: string; likes: number; replies: number }
  | { kind: 'review'; id: string; created_at: string; rating: number; comment: string | null; author: string; product: string; productId: string }
  | { kind: 'ad'; id: string; created_at: string; title: string; price: number; image: string | null; seller: string };

const FILTERS = [
  { id: 'all', label: 'Tudo' },
  { id: 'forum', label: 'Fórum' },
  { id: 'review', label: 'Reviews' },
  { id: 'ad', label: 'Marketplace' },
] as const;
type Filter = typeof FILTERS[number]['id'];

export default function MHome() {
  const [filter, setFilter] = useState<Filter>('all');
  const [topGames, setTopGames] = useState<{ id: string; title: string; image_url: string | null; rating: number | null }[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);

      const [{ data: top }, { data: posts }, { data: reviews }, { data: ads }] = await Promise.all([
        supabase.from('produtos').select('id, title, image_url, rating').eq('is_active', true).order('rating', { ascending: false }).limit(5),
        supabase.from('forum_posts').select('id, content, created_at, likes_count, user_id, product_id').order('created_at', { ascending: false }).limit(15),
        supabase.from('avaliacoes').select('id, rating, comment, created_at, user_id, product_id').eq('is_approved', true).order('created_at', { ascending: false }).limit(15),
        supabase.from('anuncios').select('id, title, price, created_at, seller_id').eq('status', 'active').order('created_at', { ascending: false }).limit(15),
      ]);

      const userIds = new Set<string>();
      const productIds = new Set<string>();
      const adIds: string[] = [];
      posts?.forEach(p => { userIds.add(p.user_id); productIds.add(p.product_id); });
      reviews?.forEach(r => { userIds.add(r.user_id); productIds.add(r.product_id); });
      ads?.forEach(a => { userIds.add(a.seller_id); adIds.push(a.id); });

      const [{ data: profiles }, { data: products }, { data: photos }, { data: replies }] = await Promise.all([
        userIds.size ? supabase.from('profiles').select('id, display_name').in('id', [...userIds]) : Promise.resolve({ data: [] }),
        productIds.size ? supabase.from('produtos').select('id, title').in('id', [...productIds]) : Promise.resolve({ data: [] }),
        adIds.length ? supabase.from('fotos_anuncio').select('anuncio_id, image_url, position').in('anuncio_id', adIds).order('position') : Promise.resolve({ data: [] }),
        posts?.length ? supabase.from('forum_replies').select('post_id').in('post_id', posts.map(p => p.id)) : Promise.resolve({ data: [] }),
      ]);

      const profileMap = new Map((profiles || []).map(p => [p.id, p.display_name || 'Usuário']));
      const productMap = new Map((products || []).map(p => [p.id, p.title]));
      const photoMap = new Map<string, string>();
      (photos || []).forEach(p => { if (!photoMap.has(p.anuncio_id)) photoMap.set(p.anuncio_id, p.image_url); });
      const replyCount = new Map<string, number>();
      (replies || []).forEach(r => replyCount.set(r.post_id, (replyCount.get(r.post_id) || 0) + 1));

      const items: FeedItem[] = [];
      posts?.forEach(p => items.push({
        kind: 'forum', id: p.id, created_at: p.created_at || '', content: p.content,
        author: profileMap.get(p.user_id) || 'Usuário', product: productMap.get(p.product_id) || 'Jogo',
        likes: p.likes_count, replies: replyCount.get(p.id) || 0,
      }));
      reviews?.forEach(r => items.push({
        kind: 'review', id: r.id, created_at: r.created_at, rating: Number(r.rating),
        comment: r.comment, author: profileMap.get(r.user_id) || 'Usuário',
        product: productMap.get(r.product_id) || 'Jogo', productId: r.product_id,
      }));
      ads?.forEach(a => items.push({
        kind: 'ad', id: a.id, created_at: a.created_at, title: a.title, price: Number(a.price),
        image: photoMap.get(a.id) || null, seller: profileMap.get(a.seller_id) || 'Vendedor',
      }));

      items.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

      if (!cancel) {
        setTopGames(top || []);
        setFeed(items);
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const visible = feed.filter(i => filter === 'all' || i.kind === filter);

  return (
    <div className="px-4 py-5 space-y-6">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden p-5 glass"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 pointer-events-none" />
        <div className="relative">
          <h2 className="font-display text-2xl font-bold gradient-text leading-tight">Bem-vindo à MIDIAS</h2>
          <p className="text-sm text-muted-foreground mt-1">Comunidade, marketplace e reviews num só lugar.</p>
          <div className="flex gap-2 mt-4">
            <Link to="/m/marketplace" className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-primary text-primary-foreground">
              <ShoppingBag className="h-3.5 w-3.5" /> Marketplace
            </Link>
            <Link to="/m/forum" className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-accent text-accent-foreground">
              <MessagesSquare className="h-3.5 w-3.5" /> Fórum
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Top games */}
      {topGames.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold flex items-center gap-1.5"><Flame className="h-4 w-4 text-primary" /> Top jogos da plataforma</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-thin -mx-4 px-4 pb-1">
            {topGames.map(g => (
              <Link key={g.id} to={`/m/review/${g.id}`} className="shrink-0 w-32">
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-card border border-border/50 relative group">
                  {g.image_url
                    ? <img src={g.image_url} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Flame className="h-8 w-8" /></div>}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <div className="text-[10px] text-white font-bold line-clamp-2">{g.title}</div>
                    {g.rating != null && <div className="flex items-center gap-1 mt-0.5"><HalfStarDisplay rating={Number(g.rating)} size={10} /></div>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Feed filter */}
      <section>
        <div className="flex gap-2 overflow-x-auto scrollbar-thin -mx-4 px-4 pb-2 mb-2">
          {FILTERS.map(f => (
            <MobileChip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</MobileChip>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : visible.length === 0 ? (
          <p className="text-center py-10 text-sm text-muted-foreground">Nada por aqui ainda.</p>
        ) : (
          <div className="space-y-3">
            {visible.map(item => <FeedCard key={`${item.kind}-${item.id}`} item={item} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function FeedCard({ item }: { item: FeedItem }) {
  if (item.kind === 'forum') {
    return (
      <Link to={`/m/forum/post/${item.id}`} className="block glass rounded-xl p-4 hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <MForumTag name={item.product.toLowerCase().replace(/\s+/g, '').slice(0, 12)} />
            <MobileBadge tone="accent">Fórum</MobileBadge>
          </div>
          <span className="text-[10px] text-muted-foreground">{timeAgo(item.created_at)}</span>
        </div>
        <p className="text-sm text-foreground line-clamp-3">{item.content}</p>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
          <span>por <b className="text-foreground">{item.author}</b></span>
          <span>👍 {item.likes}</span>
          <span>💬 {item.replies}</span>
        </div>
      </Link>
    );
  }
  if (item.kind === 'review') {
    return (
      <Link to={`/m/review/${item.productId}`} className="block glass rounded-xl p-4 hover:border-accent/40 transition-colors">
        <div className="flex items-center justify-between mb-1.5">
          <MobileBadge tone="price">Review</MobileBadge>
          <span className="text-[10px] text-muted-foreground">{timeAgo(item.created_at)}</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-foreground">{item.product}</span>
          <HalfStarDisplay rating={item.rating} size={12} />
        </div>
        {item.comment && <p className="text-sm text-foreground line-clamp-2">{item.comment}</p>}
        <div className="text-[11px] text-muted-foreground mt-2">por <b className="text-foreground">{item.author}</b></div>
      </Link>
    );
  }
  return (
    <Link to={`/m/marketplace/${item.id}`} className="block glass rounded-xl overflow-hidden hover:border-primary/40 transition-colors">
      <div className="flex">
        <div className="w-24 h-24 shrink-0 bg-muted">
          {item.image ? <img src={item.image} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-6 w-6 text-muted-foreground" /></div>}
        </div>
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <MobileBadge tone="primary">Marketplace</MobileBadge>
            <span className="text-[10px] text-muted-foreground">{timeAgo(item.created_at)}</span>
          </div>
          <p className="text-sm font-semibold text-foreground line-clamp-1">{item.title}</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-base font-bold text-price">R$ {item.price.toFixed(2)}</span>
            <span className="text-[11px] text-muted-foreground truncate max-w-[100px]">por {item.seller}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
