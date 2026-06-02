import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProduto } from '@/hooks/useProdutos';
import { useAuth } from '@/hooks/useAuth';
import { useMutualFriends } from '@/hooks/useFriendActivity';
import { HalfStarDisplay } from '@/components/HalfStarRating';
import {
  ArrowLeft, Users, Library, Star, MessageSquare, Film, Lock, Loader2, Clock,
  Image as ImageIcon, BookOpen, History, Sparkles, TrendingUp, Heart, Filter,
} from 'lucide-react';
import { motion } from 'framer-motion';
import MediaLightbox, { LightboxItem } from '@/components/social/MediaLightbox';
import ReviewCompletaCard, { ReviewCompletaData } from '@/components/social/ReviewCompletaCard';
import { Pencil } from 'lucide-react';

type Tab = 'biblioteca' | 'reviews' | 'reviewsCompletas' | 'screenshots' | 'discussoes' | 'historico';
type SortKey = 'recent' | 'liked' | 'trending' | 'close';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'biblioteca', label: 'Biblioteca', icon: Library },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'reviewsCompletas', label: 'Reviews Completas', icon: BookOpen },
  { id: 'screenshots', label: 'Screenshots', icon: ImageIcon },
  { id: 'discussoes', label: 'Discussões', icon: MessageSquare },
  { id: 'historico', label: 'Histórico', icon: History },
];

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  ja_joguei: { label: 'Já jogou', color: 'text-success' },
  jogando: { label: 'Jogando', color: 'text-primary' },
  zerado: { label: 'Zerado', color: 'text-warning' },
  pausado: { label: 'Pausado', color: 'text-muted-foreground' },
  abandonado: { label: 'Abandonou', color: 'text-destructive' },
  quero_jogar: { label: 'Quer jogar', color: 'text-accent' },
  favoritos: { label: 'Favorito', color: 'text-price' },
};

export default function GameSocialHub() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: game, isLoading } = useProduto(id);
  const { data: friendIds = [], isLoading: loadingFriends } = useMutualFriends();
  const hasFriends = friendIds.length > 0;

  const [tab, setTab] = useState<Tab>('biblioteca');
  const [sort, setSort] = useState<SortKey>('recent');
  const [lightbox, setLightbox] = useState<{ items: LightboxItem[]; index: number } | null>(null);

  // Close friends of current viewer (used to render content marked private to them)
  const { data: closeFriendIds = [] } = useQuery({
    queryKey: ['close-friends-mine', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('close_friends' as any)
        .select('friend_id').eq('user_id', user!.id);
      return ((data as any[]) || []).map(r => r.friend_id as string);
    },
  });

  const { data: library = [] } = useQuery({
    queryKey: ['gsh-library', id, friendIds],
    enabled: !!id && hasFriends,
    queryFn: async () => {
      const { data } = await supabase.from('biblioteca_usuario')
        .select('id,user_id,status,status_updated_at,profile:user_id(display_name,avatar_url)')
        .eq('product_id', id).in('user_id', friendIds);
      return (data as any[]) || [];
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['gsh-reviews', id, friendIds],
    enabled: !!id && hasFriends,
    queryFn: async () => {
      const { data } = await supabase.from('avaliacoes')
        .select('id,user_id,rating,comment,created_at,profile:user_id(display_name,avatar_url)')
        .eq('product_id', id).in('user_id', friendIds)
        .order('created_at', { ascending: false });
      const ids = (data as any[] || []).map(r => r.id);
      const { data: meta } = ids.length
        ? await supabase.from('review_metadata' as any).select('*').in('review_id', ids)
        : { data: [] as any[] };
      const metaMap = new Map((meta as any[] || []).map(m => [m.review_id, m]));
      const { data: shots } = ids.length
        ? await supabase.from('review_screenshots' as any).select('*').in('review_id', ids)
        : { data: [] as any[] };
      const shotsMap = new Map<string, any[]>();
      (shots as any[] || []).forEach(s => {
        const arr = shotsMap.get(s.review_id) || [];
        arr.push(s); shotsMap.set(s.review_id, arr);
      });
      return (data as any[] || []).map(r => ({ ...r, meta: metaMap.get(r.id), screenshots: shotsMap.get(r.id) || [] }));
    },
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['gsh-posts', id, friendIds],
    enabled: !!id && hasFriends,
    queryFn: async () => {
      const { data } = await supabase.from('forum_posts')
        .select('id,user_id,title,content,created_at,likes_count,profile:user_id(display_name,avatar_url)')
        .eq('product_id', id).in('user_id', friendIds)
        .order('created_at', { ascending: false }).limit(50);
      return (data as any[]) || [];
    },
  });

  const { data: clips = [] } = useQuery({
    queryKey: ['gsh-clips', id, friendIds],
    enabled: !!id && hasFriends,
    queryFn: async () => {
      const { data } = await supabase.from('game_clips')
        .select('id,user_id,title,thumbnail_url,video_url,created_at,profile:user_id(display_name)')
        .eq('product_id', id).in('user_id', friendIds)
        .order('created_at', { ascending: false }).limit(24);
      return (data as any[]) || [];
    },
  });

  // Filter: a content with visibility=private is only visible if I'm in author's close friends
  // For now, screenshots have owner_id+visibility; reviews have full visibility logic later.
  const visibleScreenshots = useMemo(() => {
    const all: any[] = [];
    reviews.forEach((r: any) => r.screenshots.forEach((s: any) => all.push({ ...s, review: r })));
    return all.filter(s => {
      if (s.visibility !== 'private') return true;
      // Only show private if viewer is in owner's close friends. (We approximate: owner=author of review)
      const owner = s.owner_id || s.review?.user_id;
      return owner === user?.id; // self always sees
      // (Cross-user close-friend visibility resolved server-side later via can_view_friend_content RPC)
    });
  }, [reviews, user?.id]);

  // Reviews completas: those with rich metadata (hours/platform/etc.)
  const reviewsCompletas = useMemo(
    () => reviews.filter((r: any) => r.meta && (r.meta.hours_played || r.meta.platform || r.meta.mood)),
    [reviews]
  );
  const reviewsSimples = useMemo(
    () => reviews.filter((r: any) => !r.meta || (!r.meta.hours_played && !r.meta.platform && !r.meta.mood)),
    [reviews]
  );

  // Sorting helpers
  const sortItems = <T extends { created_at: string; likes_count?: number; user_id?: string }>(arr: T[]): T[] => {
    const copy = [...arr];
    if (sort === 'recent') copy.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    if (sort === 'liked') copy.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    if (sort === 'trending') {
      copy.sort((a, b) => {
        const score = (x: any) => (x.likes_count || 0) * 2 + (Date.now() - +new Date(x.created_at) < 7 * 86400000 ? 5 : 0);
        return score(b) - score(a);
      });
    }
    if (sort === 'close') copy.sort((a, b) =>
      (closeFriendIds.includes(b.user_id || '') ? 1 : 0) - (closeFriendIds.includes(a.user_id || '') ? 1 : 0)
    );
    return copy;
  };

  // Histórico: timeline combinando tudo
  const historico = useMemo(() => {
    const events: any[] = [];
    library.forEach((l: any) => events.push({ kind: 'library', date: l.status_updated_at, data: l }));
    reviews.forEach((r: any) => events.push({ kind: 'review', date: r.created_at, data: r }));
    posts.forEach((p: any) => events.push({ kind: 'post', date: p.created_at, data: p }));
    clips.forEach((c: any) => events.push({ kind: 'clip', date: c.created_at, data: c }));
    return events.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [library, reviews, posts, clips]);

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!game) return <div className="container mx-auto px-4 py-16 text-center"><p className="text-muted-foreground">Jogo não encontrado.</p></div>;

  const openLightbox = (items: LightboxItem[], index: number) => setLightbox({ items, index });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Link to={`/jogo/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar ao jogo
      </Link>

      {/* Cinematic header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent z-10" />
        {game.image && <img src={game.image} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />}
        <div className="relative z-20 p-8">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
            <Lock className="h-3 w-3" /> Hub Social Privado · Apenas amigos
          </p>
          <h1 className="text-3xl font-bold text-foreground">{game.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">O que seu círculo está fazendo neste jogo</p>
          <div className="flex gap-4 mt-4 text-xs text-foreground flex-wrap">
            <span><Users className="inline h-3 w-3 mr-1" />{friendIds.length} amigos</span>
            <span><Library className="inline h-3 w-3 mr-1" />{library.length} têm</span>
            <span><Star className="inline h-3 w-3 mr-1" />{reviews.length} reviews</span>
            <span><ImageIcon className="inline h-3 w-3 mr-1" />{visibleScreenshots.length} screenshots</span>
            <span><MessageSquare className="inline h-3 w-3 mr-1" />{posts.length} discussões</span>
          </div>
        </div>
      </motion.div>

      {loadingFriends ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : !hasFriends ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="font-semibold text-foreground">Seu círculo está vazio</p>
          <p className="text-sm text-muted-foreground mt-1">Siga amigos (e seja seguido de volta) para ver atividade aqui.</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 border-b border-border mb-4 overflow-x-auto">
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-3 py-2 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                    active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}>
                  <Icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            {([
              { k: 'recent', label: 'Recentes', icon: Sparkles },
              { k: 'liked', label: 'Mais curtidos', icon: Heart },
              { k: 'trending', label: 'Tendência', icon: TrendingUp },
              { k: 'close', label: 'Mais próximos', icon: Users },
            ] as { k: SortKey; label: string; icon: any }[]).map(o => {
              const Icon = o.icon;
              const active = sort === o.k;
              return (
                <button key={o.k} onClick={() => setSort(o.k)}
                  className={`px-2.5 py-1 rounded-full text-[11px] flex items-center gap-1 border transition-colors ${
                    active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
                  }`}>
                  <Icon className="h-3 w-3" />{o.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {tab === 'biblioteca' && (
            <section className="bg-card border border-border rounded-xl p-5">
              {library.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum amigo tem este jogo.</p>
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sortItems(library as any).map((l: any) => {
                    const status = STATUS_LABEL[l.status] || { label: l.status, color: 'text-muted-foreground' };
                    return (
                      <li key={l.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40">
                        <Link to={`/perfil/${l.user_id}`} className="flex items-center gap-2 flex-1 min-w-0">
                          {l.profile?.avatar_url
                            ? <img src={l.profile.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                            : <div className="w-9 h-9 rounded-full bg-primary/20" />}
                          <span className="text-sm text-foreground truncate">{l.profile?.display_name || 'Amigo'}</span>
                        </Link>
                        <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {tab === 'reviews' && (
            <ReviewsList reviews={sortItems(reviewsSimples as any)} onOpenShot={openLightbox} />
          )}

          {tab === 'reviewsCompletas' && (
            <ReviewsList reviews={sortItems(reviewsCompletas as any)} onOpenShot={openLightbox} full />
          )}

          {tab === 'screenshots' && (
            <section>
              {visibleScreenshots.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem screenshots ainda.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {visibleScreenshots.map((s, i) => (
                    <button key={s.id} onClick={() => openLightbox(
                      visibleScreenshots.map(x => ({
                        url: x.image_url,
                        author: x.review?.profile?.display_name,
                        caption: x.review?.comment?.slice(0, 80),
                      })), i)}
                      className="aspect-video bg-muted rounded-lg overflow-hidden group relative">
                      <img src={s.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                      {s.visibility === 'private' && (
                        <span className="absolute top-1 right-1 text-[9px] bg-destructive/80 text-destructive-foreground px-1.5 py-0.5 rounded">Privado</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {clips.length > 0 && (
                <>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mt-6 mb-2">
                    <Film className="h-4 w-4 text-accent" /> Clipes
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {clips.map((c: any) => (
                      <a key={c.id} href={c.video_url} target="_blank" rel="noreferrer"
                        className="block bg-card border border-border rounded-lg overflow-hidden">
                        <div className="aspect-video bg-muted">
                          {c.thumbnail_url && <img src={c.thumbnail_url} className="w-full h-full object-cover" alt="" />}
                        </div>
                        <p className="text-[10px] text-foreground p-2 line-clamp-1">{c.profile?.display_name} {c.title && `· ${c.title}`}</p>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </section>
          )}

          {tab === 'discussoes' && (
            <section className="space-y-2">
              {posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem discussões ainda.</p>
              ) : sortItems(posts as any).map((p: any) => (
                <div key={p.id} className="bg-card border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Link to={`/perfil/${p.user_id}`} className="text-xs font-semibold text-foreground hover:text-primary">
                      {p.profile?.display_name}
                    </Link>
                    <span className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
                      <Heart className="h-3 w-3" /> {p.likes_count}
                    </span>
                  </div>
                  {p.title && <p className="text-sm font-semibold text-foreground">{p.title}</p>}
                  <p className="text-xs text-muted-foreground line-clamp-3">{p.content}</p>
                </div>
              ))}
            </section>
          )}

          {tab === 'historico' && (
            <section className="space-y-2">
              {historico.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem histórico ainda.</p>
              ) : historico.map((e, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-3 flex items-start gap-3">
                  <span className="mt-0.5 text-primary">
                    {e.kind === 'library' && <Library className="h-4 w-4" />}
                    {e.kind === 'review' && <Star className="h-4 w-4" />}
                    {e.kind === 'post' && <MessageSquare className="h-4 w-4" />}
                    {e.kind === 'clip' && <Film className="h-4 w-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">
                      <Link to={`/perfil/${e.data.user_id}`} className="font-semibold hover:text-primary">
                        {e.data.profile?.display_name || 'Amigo'}
                      </Link>{' '}
                      {e.kind === 'library' && <>marcou como <span className="text-primary">{STATUS_LABEL[e.data.status]?.label || e.data.status}</span></>}
                      {e.kind === 'review' && <>publicou um review <HalfStarDisplay rating={Number(e.data.rating)} size={10} className="inline-flex ml-1" /></>}
                      {e.kind === 'post' && <>iniciou uma discussão{e.data.title ? `: ${e.data.title}` : ''}</>}
                      {e.kind === 'clip' && <>compartilhou um clipe{e.data.title ? `: ${e.data.title}` : ''}</>}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{new Date(e.date).toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {lightbox && <MediaLightbox items={lightbox.items} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
    </div>
  );
}

function ReviewsList({ reviews, onOpenShot, full }: {
  reviews: any[]; full?: boolean;
  onOpenShot: (items: LightboxItem[], i: number) => void;
}) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">{full ? 'Sem reviews completas ainda.' : 'Sem reviews ainda.'}</p>;
  }
  return (
    <div className="space-y-3">
      {reviews.map((r: any) => (
        <article key={r.id} className="bg-card border border-border rounded-xl p-4">
          <header className="flex items-center gap-3 mb-2">
            <Link to={`/perfil/${r.user_id}`} className="flex items-center gap-2 hover:opacity-80">
              {r.profile?.avatar_url
                ? <img src={r.profile.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                : <div className="w-9 h-9 rounded-full bg-primary/20" />}
              <span className="text-sm font-semibold text-foreground">{r.profile?.display_name || 'Amigo'}</span>
            </Link>
            <HalfStarDisplay rating={Number(r.rating)} size={14} />
            <span className="ml-auto text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
          </header>
          {full && r.meta && (
            <div className="flex flex-wrap gap-1.5 mb-2 text-[10px]">
              {r.meta.hours_played != null && <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"><Clock className="inline h-3 w-3 mr-1" />{r.meta.hours_played}h</span>}
              {r.meta.platform && <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{r.meta.platform}</span>}
              {r.meta.mood && <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent">{r.meta.mood}</span>}
              {r.meta.difficulty && <span className="px-2 py-0.5 rounded-full bg-warning/20 text-warning">{r.meta.difficulty}</span>}
              {r.meta.completion && <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary">{r.meta.completion}</span>}
              {r.meta.has_spoiler && <span className="px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">spoilers</span>}
            </div>
          )}
          {r.comment && <p className="text-sm text-foreground whitespace-pre-wrap">{r.comment}</p>}
          {r.screenshots.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {r.screenshots.slice(0, 6).map((s: any, i: number) => (
                <button key={s.id} onClick={() => onOpenShot(
                  r.screenshots.map((x: any) => ({ url: x.image_url, author: r.profile?.display_name, caption: r.comment?.slice(0, 80) })), i)}
                  className="aspect-video bg-muted rounded overflow-hidden group">
                  <img src={s.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                </button>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
