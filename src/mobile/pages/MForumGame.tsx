import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, ThumbsUp, ThumbsDown, MessageSquare, BookMarked, Check, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MForumTag } from '@/mobile/lib/badge';
import { timeAgo, periodSince, type Period, PERIOD_OPTIONS } from '@/mobile/lib/time';
import { HalfStarDisplay, InteractiveHalfStar } from '@/components/HalfStarRating';
import LevelBadge from '@/components/LevelBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import SpoilerGuard from '@/components/spoiler/SpoilerGuard';
import SpoilerComposerControls from '@/components/spoiler/SpoilerComposerControls';

interface Game { id: string; title: string; image_url: string | null; description: string | null; rating: number | null }
interface Post { id: string; content: string; created_at: string; likes_count: number; user_id: string; replies: number; author: string; iLiked: boolean; is_spoiler: boolean; spoiler_achievement_name: string | null }
interface Review { id: string; rating: number; comment: string | null; created_at: string; user_id: string; author: string; likes: number; dislikes: number; myReaction: 'like' | 'dislike' | null; is_spoiler: boolean; spoiler_achievement_name: string | null }

type Sort = 'popular' | 'recent';

export default function MForumGame() {
  const { gameId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [gameLoading, setGameLoading] = useState(true);
  const [tab, setTab] = useState<'forum' | 'reviews' | 'both'>('both');
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [postOpen, setPostOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [postText, setPostText] = useState('');
  const [postSpoiler, setPostSpoiler] = useState(false);
  const [postAchievement, setPostAchievement] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSpoiler, setReviewSpoiler] = useState(false);
  const [reviewAchievement, setReviewAchievement] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('popular');
  const [period, setPeriod] = useState<Period>('all');
  const [libStatus, setLibStatus] = useState<'none' | 'quero_jogar' | 'ja_joguei'>('none');

  useEffect(() => {
    if (!gameId) { setGameLoading(false); return; }
    setGameLoading(true);
    supabase.from('produtos').select('id, title, image_url, description, rating').eq('id', gameId).maybeSingle()
      .then(({ data }) => { setGame(data as Game); setGameLoading(false); });
  }, [gameId]);

  useEffect(() => {
    if (!user || !gameId) { setLibStatus('none'); return; }
    supabase.from('biblioteca_usuario').select('status').eq('user_id', user.id).eq('product_id', gameId).maybeSingle()
      .then(({ data }) => setLibStatus((data?.status as any) || 'none'));
  }, [user?.id, gameId]);

  const setLibrary = async (status: 'quero_jogar' | 'ja_joguei') => {
    if (!user) { toast.error('Entre para usar a biblioteca'); navigate('/m/auth'); return; }
    if (!gameId) return;
    const { error } = await supabase.from('biblioteca_usuario')
      .upsert({ user_id: user.id, product_id: gameId, status }, { onConflict: 'user_id,product_id' });
    if (error) { toast.error('Erro ao atualizar biblioteca'); return; }
    setLibStatus(status);
    toast.success(status === 'ja_joguei' ? '🎮 Marcado como já joguei' : '⭐ Adicionado a "quero jogar"');
  };

  const loadFeed = async () => {
    if (!gameId) { setFeedLoading(false); return; }
    setFeedLoading(true);
    const [{ data: ps }, { data: rs }] = await Promise.all([
      supabase.from('forum_posts').select('id, content, created_at, likes_count, user_id, product_id, is_spoiler, spoiler_achievement_name').eq('product_id', gameId).order('created_at', { ascending: false }).limit(100),
      supabase.from('avaliacoes').select('id, rating, comment, created_at, user_id, is_spoiler, spoiler_achievement_name').eq('product_id', gameId).eq('is_approved', true).order('created_at', { ascending: false }).limit(100),
    ]);
    const userIds = new Set<string>();
    ps?.forEach(p => userIds.add(p.user_id));
    rs?.forEach(r => userIds.add(r.user_id));
    const pIds = ps?.map(p => p.id) || [];
    const rIds = rs?.map(r => r.id) || [];
    const [{ data: profiles }, { data: replies }, { data: likes }, { data: postLikes }, { data: dislikes }] = await Promise.all([
      userIds.size ? supabase.from('profiles').select('id, display_name').in('id', [...userIds]) : Promise.resolve({ data: [] }),
      pIds.length ? supabase.from('forum_replies').select('post_id').in('post_id', pIds) : Promise.resolve({ data: [] }),
      rIds.length ? supabase.from('review_likes').select('review_id, user_id').in('review_id', rIds) : Promise.resolve({ data: [] }),
      pIds.length ? supabase.from('forum_post_likes').select('post_id, user_id').in('post_id', pIds) : Promise.resolve({ data: [] }),
      rIds.length ? supabase.from('review_comments').select('review_id, user_id, content').in('review_id', rIds).eq('content', '__dislike__') : Promise.resolve({ data: [] }),
    ]);
    const pm = new Map((profiles || []).map((p: any) => [p.id, p.display_name || 'Usuário']));
    const rc = new Map<string, number>(); (replies || []).forEach((r: any) => rc.set(r.post_id, (rc.get(r.post_id) || 0) + 1));
    const likesMap = new Map<string, Set<string>>();
    (likes || []).forEach((l: any) => {
      if (!likesMap.has(l.review_id)) likesMap.set(l.review_id, new Set());
      likesMap.get(l.review_id)!.add(l.user_id);
    });
    const disMap = new Map<string, Set<string>>();
    (dislikes || []).forEach((d: any) => {
      if (!disMap.has(d.review_id)) disMap.set(d.review_id, new Set());
      disMap.get(d.review_id)!.add(d.user_id);
    });
    const postLikedSet = new Set<string>();
    (postLikes || []).forEach((l: any) => { if (user && l.user_id === user.id) postLikedSet.add(l.post_id); });

    setPosts((ps || []).map((p: any) => ({
      id: p.id, content: p.content, created_at: p.created_at || '',
      likes_count: p.likes_count, user_id: p.user_id,
      replies: rc.get(p.id) || 0, author: pm.get(p.user_id) || 'Usuário',
      iLiked: postLikedSet.has(p.id),
      is_spoiler: !!p.is_spoiler, spoiler_achievement_name: p.spoiler_achievement_name || null,
    })));
    setReviews((rs || []).map((r: any) => {
      const likeSet = likesMap.get(r.id) || new Set();
      const disSet = disMap.get(r.id) || new Set();
      const myReaction: 'like' | 'dislike' | null = user
        ? likeSet.has(user.id) ? 'like' : disSet.has(user.id) ? 'dislike' : null
        : null;
      return {
        id: r.id, rating: Number(r.rating), comment: r.comment, created_at: r.created_at,
        user_id: r.user_id, author: pm.get(r.user_id) || 'Usuário',
        likes: likeSet.size, dislikes: disSet.size, myReaction,
        is_spoiler: !!r.is_spoiler, spoiler_achievement_name: r.spoiler_achievement_name || null,
      };
    }));
    setFeedLoading(false);
  };

  useEffect(() => { loadFeed(); }, [gameId, user?.id]);

  const filteredPosts = useMemo(() => {
    const since = periodSince(period);
    let arr = posts.filter(p => !since || new Date(p.created_at) >= since);
    if (sort === 'popular') arr = [...arr].sort((a, b) => (b.likes_count + b.replies * 2) - (a.likes_count + a.replies * 2));
    else arr = [...arr].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return arr;
  }, [posts, sort, period]);

  const filteredReviews = useMemo(() => {
    const since = periodSince(period);
    let arr = reviews.filter(r => !since || new Date(r.created_at) >= since);
    if (sort === 'popular') arr = [...arr].sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
    else arr = [...arr].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return arr;
  }, [reviews, sort, period]);

  const submitPost = async () => {
    if (!user || !postText.trim() || !gameId) return;
    const { error } = await supabase.from('forum_posts').insert({
      user_id: user.id, product_id: gameId, content: postText.trim().slice(0, 2000),
      is_spoiler: postSpoiler,
      spoiler_achievement_name: postAchievement,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success('Post criado'); setPostOpen(false); setPostText(''); setPostSpoiler(false); setPostAchievement(null); loadFeed();
  };
  const submitReview = async () => {
    if (!user || !gameId) return;
    const existing = reviews.find(r => r.user_id === user.id);
    const payload = {
      user_id: user.id, product_id: gameId, rating: reviewRating,
      comment: reviewText.trim().slice(0, 1000) || null,
      is_spoiler: reviewSpoiler,
      spoiler_achievement_name: reviewAchievement,
    } as any;
    const { error } = existing
      ? await supabase.from('avaliacoes').update(payload).eq('id', existing.id)
      : await supabase.from('avaliacoes').insert(payload);
    if (error) { toast.error(error.message); return; }
    // Auto: já joguei
    await supabase.from('biblioteca_usuario')
      .upsert({ user_id: user.id, product_id: gameId, status: 'ja_joguei' }, { onConflict: 'user_id,product_id' });
    setLibStatus('ja_joguei');
    toast.success(existing ? 'Review atualizada' : 'Review publicada — adicionada como "já joguei"');
    setReviewOpen(false); setReviewText(''); setReviewSpoiler(false); setReviewAchievement(null); loadFeed();
  };

  const togglePostLike = async (post: Post) => {
    if (!user) { toast.error('Entre para curtir'); return; }
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, iLiked: !p.iLiked, likes_count: p.likes_count + (p.iLiked ? -1 : 1) } : p));
    if (post.iLiked) {
      await supabase.from('forum_post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('forum_post_likes').insert({ post_id: post.id, user_id: user.id });
    }
  };

  const reactReview = async (review: Review, kind: 'like' | 'dislike') => {
    if (!user) { toast.error('Entre para reagir'); return; }
    setReviews(prev => prev.map(r => {
      if (r.id !== review.id) return r;
      const wasLike = r.myReaction === 'like';
      const wasDis = r.myReaction === 'dislike';
      let likes = r.likes, dislikes = r.dislikes;
      let myReaction: 'like' | 'dislike' | null = kind;
      if (kind === 'like') {
        if (wasLike) { likes--; myReaction = null; } else { likes++; if (wasDis) dislikes--; }
      } else {
        if (wasDis) { dislikes--; myReaction = null; } else { dislikes++; if (wasLike) likes--; }
      }
      return { ...r, likes, dislikes, myReaction };
    }));
    try {
      if (kind === 'like') {
        await supabase.from('review_comments').delete().eq('review_id', review.id).eq('user_id', user.id).eq('content', '__dislike__');
        if (review.myReaction === 'like') {
          await supabase.from('review_likes').delete().eq('review_id', review.id).eq('user_id', user.id);
        } else {
          await supabase.from('review_likes').insert({ review_id: review.id, user_id: user.id });
        }
      } else {
        await supabase.from('review_likes').delete().eq('review_id', review.id).eq('user_id', user.id);
        if (review.myReaction === 'dislike') {
          await supabase.from('review_comments').delete().eq('review_id', review.id).eq('user_id', user.id).eq('content', '__dislike__');
        } else {
          await supabase.from('review_comments').insert({ review_id: review.id, user_id: user.id, content: '__dislike__' });
        }
      }
    } catch {
      toast.error('Não foi possível reagir');
      loadFeed();
    }
  };

  if (gameLoading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }
  if (!game) return <div className="p-6 text-center text-muted-foreground">Jogo não encontrado.</div>;

  return (
    <div className="pb-24">
      <button onClick={() => navigate(-1)} className="px-4 py-3 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</button>

      <div className="px-4">
        <div className="glass rounded-2xl overflow-hidden">
          {game.image_url && <img src={game.image_url} alt={game.title} className="w-full aspect-video object-cover" loading="lazy" />}
          <div className="p-4">
            <MForumTag name={game.title.toLowerCase().replace(/\s+/g, '').slice(0, 14)} />
            <h1 className="font-display text-xl font-bold mt-1">{game.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <HalfStarDisplay rating={Number(game.rating || 0)} size={14} />
              <span className="text-xs text-muted-foreground">{(game.rating || 0).toString()} média · {posts.length} posts · {reviews.length} reviews</span>
            </div>

            {/* Biblioteca quick-add */}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setLibrary('quero_jogar')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  libStatus === 'quero_jogar' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground hover:border-primary/40'
                }`}>
                {libStatus === 'quero_jogar' ? <Check className="h-3.5 w-3.5" /> : <BookMarked className="h-3.5 w-3.5" />}
                Quero jogar
              </button>
              <button onClick={() => setLibrary('ja_joguei')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  libStatus === 'ja_joguei' ? 'bg-accent text-accent-foreground' : 'bg-card border border-border text-foreground hover:border-accent/40'
                }`}>
                {libStatus === 'ja_joguei' ? <Check className="h-3.5 w-3.5" /> : <Gamepad2 className="h-3.5 w-3.5" />}
                Já joguei
              </button>
            </div>
          </div>
        </div>

        <div className="flex p-1 bg-secondary/50 rounded-lg mt-4">
          <button onClick={() => setTab('both')} className={`flex-1 py-2 rounded-md text-xs font-semibold ${tab === 'both' ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground' : 'text-muted-foreground'}`}>✨ Ambos</button>
          <button onClick={() => setTab('forum')} className={`flex-1 py-2 rounded-md text-xs font-semibold ${tab === 'forum' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>💬 Fórum</button>
          <button onClick={() => setTab('reviews')} className={`flex-1 py-2 rounded-md text-xs font-semibold ${tab === 'reviews' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}>⭐ Reviews</button>
        </div>

        {/* Filtros: ordem + período */}
        <div className="mt-3 space-y-2">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-thin">
            {(['popular', 'recent'] as Sort[]).map(s => (
              <button key={s} onClick={() => setSort(s)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${sort === s ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
                {s === 'popular' ? '🔥 Populares' : '🕒 Recentes'}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-thin">
            {PERIOD_OPTIONS.map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${period === p.id ? 'bg-accent text-accent-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'reviews' && (
          <Link to={`/m/review/${gameId}`} className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5">
            <Plus className="h-4 w-4" /> Escrever / ver reviews completas
          </Link>
        )}
        {tab === 'forum' && user && (
          <button onClick={() => setPostOpen(true)} className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5">
            <Plus className="h-4 w-4" /> Criar post
          </button>
        )}

        <div className="mt-4 space-y-2.5">
          {feedLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (() => {
            const showPosts = tab !== 'reviews';
            const showReviews = tab !== 'forum';
            const postNodes = filteredPosts.map(p => (
              <div key={`p-${p.id}`} className="glass rounded-xl p-3 hover:border-primary/40 transition-colors">
                <Link to={`/m/forum/post/${p.id}`} className="block">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[9px] font-bold">FÓRUM</span><b className="text-foreground">{p.author}</b><LevelBadge userId={p.user_id} size="sm" /></span><span>{timeAgo(p.created_at)}</span></div>
                  <SpoilerGuard isSpoiler={p.is_spoiler} achievementName={p.spoiler_achievement_name} productId={gameId} className="mt-1.5">
                    <p className="text-sm line-clamp-3">{p.content}</p>
                  </SpoilerGuard>
                </Link>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  <button onClick={() => togglePostLike(p)} className={`flex items-center gap-1 hover:text-primary ${p.iLiked ? 'text-primary' : ''}`}>
                    <ThumbsUp className={`h-3 w-3 ${p.iLiked ? 'fill-current' : ''}`} />{p.likes_count}
                  </button>
                  <Link to={`/m/forum/post/${p.id}`} className="flex items-center gap-1 hover:text-foreground">
                    <MessageSquare className="h-3 w-3" />{p.replies}
                  </Link>
                </div>
              </div>
            ));
            const reviewNodes = filteredReviews.map(r => (
              <Link key={`r-${r.id}`} to={`/m/review/${gameId}?focus=${r.id}`} className="block glass rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5"><span className="px-1.5 py-0.5 rounded bg-accent/15 text-accent text-[9px] font-bold">REVIEW</span><span className="text-sm font-semibold">{r.author}</span><LevelBadge userId={r.user_id} size="sm" /></span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</span>
                </div>
                <div className="flex items-center gap-2 mb-1"><HalfStarDisplay rating={r.rating} size={13} /><span className="text-xs font-semibold text-price">{r.rating.toFixed(1)}</span></div>
                {r.comment && <p className="text-sm">{r.comment}</p>}
                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  <button onClick={(e) => { e.preventDefault(); reactReview(r, 'like'); }} className={`flex items-center gap-1 hover:text-primary ${r.myReaction === 'like' ? 'text-primary' : ''}`}>
                    <ThumbsUp className={`h-3 w-3 ${r.myReaction === 'like' ? 'fill-current' : ''}`} />{r.likes}
                  </button>
                  <button onClick={(e) => { e.preventDefault(); reactReview(r, 'dislike'); }} className={`flex items-center gap-1 hover:text-destructive ${r.myReaction === 'dislike' ? 'text-destructive' : ''}`}>
                    <ThumbsDown className={`h-3 w-3 ${r.myReaction === 'dislike' ? 'fill-current' : ''}`} />{r.dislikes}
                  </button>
                </div>
              </Link>
            ));
            let merged: any[] = [];
            if (tab === 'forum') merged = postNodes;
            else if (tab === 'reviews') merged = reviewNodes;
            else {
              // Both — intercala por data desc
              const all = [
                ...filteredPosts.map(p => ({ kind: 'p' as const, date: p.created_at, node: postNodes.find(n => n.key === `p-${p.id}`)! })),
                ...filteredReviews.map(r => ({ kind: 'r' as const, date: r.created_at, node: reviewNodes.find(n => n.key === `r-${r.id}`)! })),
              ].sort((a,b) => +new Date(b.date) - +new Date(a.date));
              merged = all.map(x => x.node);
            }
            if (!merged.length) return <p className="text-center py-10 text-sm text-muted-foreground">Nada por aqui no período.</p>;
            return merged;
          })()}
        </div>
      </div>

      {postOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={() => setPostOpen(false)}>
          <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="w-full bg-card rounded-t-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold">Criar post em M/{game.title.toLowerCase().replace(/\s+/g, '').slice(0, 12)}</h3>
            <textarea value={postText} onChange={e => setPostText(e.target.value)} maxLength={2000} rows={5} placeholder="Compartilhe algo sobre o jogo..." className="w-full p-3 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" />
            <div className="flex gap-2">
              <button onClick={() => setPostOpen(false)} className="flex-1 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold">Cancelar</button>
              <button onClick={submitPost} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Publicar</button>
            </div>
          </motion.div>
        </div>
      )}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={() => setReviewOpen(false)}>
          <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="w-full bg-card rounded-t-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold">Avaliar {game.title}</h3>
            <div className="flex justify-center"><InteractiveHalfStar value={reviewRating} onChange={setReviewRating} /></div>
            <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} maxLength={1000} rows={4} placeholder="Conte sua experiência (opcional)..." className="w-full p-3 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/50" />
            <div className="flex gap-2">
              <button onClick={() => setReviewOpen(false)} className="flex-1 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold">Cancelar</button>
              <button onClick={submitReview} className="flex-1 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold">Publicar review</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
