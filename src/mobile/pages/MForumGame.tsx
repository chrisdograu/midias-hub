import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MForumTag } from '@/mobile/lib/badge';
import { timeAgo } from '@/mobile/lib/time';
import { HalfStarDisplay, InteractiveHalfStar } from '@/components/HalfStarRating';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Game { id: string; title: string; image_url: string | null; description: string | null; rating: number | null }
interface Post { id: string; content: string; created_at: string; likes_count: number; user_id: string; replies: number; author: string; iLiked: boolean }
interface Review { id: string; rating: number; comment: string | null; created_at: string; user_id: string; author: string; likes: number; dislikes: number; myReaction: 'like' | 'dislike' | null }

export default function MForumGame() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [gameLoading, setGameLoading] = useState(true);
  const [tab, setTab] = useState<'forum' | 'reviews'>('forum');
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [postOpen, setPostOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [postText, setPostText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  // 1) Carrega o jogo PRIMEIRO (rápido, render imediato)
  useEffect(() => {
    if (!id) return;
    setGameLoading(true);
    supabase.from('produtos').select('id, title, image_url, description, rating').eq('id', id).maybeSingle()
      .then(({ data }) => { setGame(data as Game); setGameLoading(false); });
  }, [id]);

  // 2) Carrega feed em paralelo, sem bloquear a renderização do header
  const loadFeed = async () => {
    if (!id) return;
    setFeedLoading(true);
    const [{ data: ps }, { data: rs }] = await Promise.all([
      supabase.from('forum_posts').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(50),
      supabase.from('avaliacoes').select('*').eq('product_id', id).eq('is_approved', true).order('created_at', { ascending: false }).limit(50),
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
      };
    }));
    setFeedLoading(false);
  };

  useEffect(() => { loadFeed(); }, [id, user?.id]);

  const submitPost = async () => {
    if (!user || !postText.trim() || !id) return;
    const { error } = await supabase.from('forum_posts').insert({ user_id: user.id, product_id: id, content: postText.trim().slice(0, 2000) });
    if (error) { toast.error(error.message); return; }
    toast.success('Post criado'); setPostOpen(false); setPostText(''); loadFeed();
  };
  const submitReview = async () => {
    if (!user || !id) return;
    const existing = reviews.find(r => r.user_id === user.id);
    const payload = { user_id: user.id, product_id: id, rating: reviewRating, comment: reviewText.trim().slice(0, 1000) || null };
    const { error } = existing
      ? await supabase.from('avaliacoes').update(payload).eq('id', existing.id)
      : await supabase.from('avaliacoes').insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(existing ? 'Review atualizada' : 'Review publicada');
    setReviewOpen(false); setReviewText(''); loadFeed();
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
          </div>
        </div>

        <div className="flex p-1 bg-secondary/50 rounded-lg mt-4">
          <button onClick={() => setTab('forum')} className={`flex-1 py-2 rounded-md text-xs font-semibold ${tab === 'forum' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>💬 Fórum</button>
          <button onClick={() => setTab('reviews')} className={`flex-1 py-2 rounded-md text-xs font-semibold ${tab === 'reviews' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}>⭐ Reviews</button>
        </div>

        {user && (
          <button onClick={() => tab === 'forum' ? setPostOpen(true) : setReviewOpen(true)} className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5">
            <Plus className="h-4 w-4" /> {tab === 'forum' ? 'Criar post' : 'Escrever review'}
          </button>
        )}

        <div className="mt-4 space-y-2.5">
          {feedLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : tab === 'forum' ? (
            posts.length === 0 ? <p className="text-center py-10 text-sm text-muted-foreground">Nenhum post ainda.</p> :
              posts.map(p => (
                <div key={p.id} className="glass rounded-xl p-3 hover:border-primary/40 transition-colors">
                  <Link to={`/m/forum/post/${p.id}`} className="block">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground"><b className="text-foreground">{p.author}</b><span>{timeAgo(p.created_at)}</span></div>
                    <p className="text-sm mt-1.5 line-clamp-3">{p.content}</p>
                  </Link>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <button
                      onClick={() => togglePostLike(p)}
                      className={`flex items-center gap-1 hover:text-primary ${p.iLiked ? 'text-primary' : ''}`}
                    >
                      <ThumbsUp className={`h-3 w-3 ${p.iLiked ? 'fill-current' : ''}`} />{p.likes_count}
                    </button>
                    <Link to={`/m/forum/post/${p.id}`} className="flex items-center gap-1 hover:text-foreground">
                      <MessageSquare className="h-3 w-3" />{p.replies}
                    </Link>
                  </div>
                </div>
              ))
          ) : (
            reviews.length === 0 ? <p className="text-center py-10 text-sm text-muted-foreground">Nenhuma review ainda.</p> :
              reviews.map(r => (
                <div key={r.id} className="glass rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold">{r.author}</span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1"><HalfStarDisplay rating={r.rating} size={13} /><span className="text-xs font-semibold text-price">{r.rating.toFixed(1)}</span></div>
                  {r.comment && <p className="text-sm">{r.comment}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <button onClick={() => reactReview(r, 'like')} className={`flex items-center gap-1 hover:text-primary ${r.myReaction === 'like' ? 'text-primary' : ''}`}>
                      <ThumbsUp className={`h-3 w-3 ${r.myReaction === 'like' ? 'fill-current' : ''}`} />{r.likes}
                    </button>
                    <button onClick={() => reactReview(r, 'dislike')} className={`flex items-center gap-1 hover:text-destructive ${r.myReaction === 'dislike' ? 'text-destructive' : ''}`}>
                      <ThumbsDown className={`h-3 w-3 ${r.myReaction === 'dislike' ? 'fill-current' : ''}`} />{r.dislikes}
                    </button>
                  </div>
                </div>
              ))
          )}
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
