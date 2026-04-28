import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, ThumbsUp, MessageSquare, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MForumTag, MobileBadge } from '@/mobile/lib/badge';
import { timeAgo } from '@/mobile/lib/time';
import { HalfStarDisplay, InteractiveHalfStar } from '@/components/HalfStarRating';
import { toast } from 'sonner';

interface Game { id: string; title: string; image_url: string | null; description: string | null; rating: number | null }
interface Post { id: string; content: string; created_at: string; likes_count: number; user_id: string; replies: number; author: string }
interface Review { id: string; rating: number; comment: string | null; created_at: string; user_id: string; author: string; likes: number }

export default function MForumGame() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [tab, setTab] = useState<'forum' | 'reviews'>('forum');
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [postOpen, setPostOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [postText, setPostText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data: g } = await supabase.from('produtos').select('id, title, image_url, description, rating').eq('id', id).maybeSingle();
    setGame(g as Game);
    const [{ data: ps }, { data: rs }] = await Promise.all([
      supabase.from('forum_posts').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(50),
      supabase.from('avaliacoes').select('*').eq('product_id', id).eq('is_approved', true).order('created_at', { ascending: false }).limit(50),
    ]);
    const userIds = new Set<string>();
    ps?.forEach(p => userIds.add(p.user_id));
    rs?.forEach(r => userIds.add(r.user_id));
    const pIds = ps?.map(p => p.id) || [];
    const rIds = rs?.map(r => r.id) || [];
    const [{ data: profiles }, { data: replies }, { data: likes }] = await Promise.all([
      userIds.size ? supabase.from('profiles').select('id, display_name').in('id', [...userIds]) : Promise.resolve({ data: [] }),
      pIds.length ? supabase.from('forum_replies').select('post_id').in('post_id', pIds) : Promise.resolve({ data: [] }),
      rIds.length ? supabase.from('review_likes').select('review_id').in('review_id', rIds) : Promise.resolve({ data: [] }),
    ]);
    const pm = new Map((profiles || []).map(p => [p.id, p.display_name || 'Usuário']));
    const rc = new Map<string, number>(); (replies || []).forEach(r => rc.set(r.post_id, (rc.get(r.post_id) || 0) + 1));
    const lc = new Map<string, number>(); (likes || []).forEach(l => lc.set(l.review_id, (lc.get(l.review_id) || 0) + 1));
    setPosts((ps || []).map(p => ({ id: p.id, content: p.content, created_at: p.created_at || '', likes_count: p.likes_count, user_id: p.user_id, replies: rc.get(p.id) || 0, author: pm.get(p.user_id) || 'Usuário' })));
    setReviews((rs || []).map(r => ({ id: r.id, rating: Number(r.rating), comment: r.comment, created_at: r.created_at, user_id: r.user_id, author: pm.get(r.user_id) || 'Usuário', likes: lc.get(r.id) || 0 })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const submitPost = async () => {
    if (!user || !postText.trim() || !id) return;
    const { error } = await supabase.from('forum_posts').insert({ user_id: user.id, product_id: id, content: postText.trim().slice(0, 2000) });
    if (error) { toast.error('Erro ao publicar'); return; }
    toast.success('Post criado'); setPostOpen(false); setPostText(''); load();
  };
  const submitReview = async () => {
    if (!user || !id) return;
    const { error } = await supabase.from('avaliacoes').upsert({ user_id: user.id, product_id: id, rating: reviewRating, comment: reviewText.trim().slice(0, 1000) || null });
    if (error) { toast.error('Erro ao publicar review'); return; }
    toast.success('Review publicada'); setReviewOpen(false); setReviewText(''); load();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!game) return <div className="p-6 text-center text-muted-foreground">Jogo não encontrado.</div>;

  return (
    <div className="pb-24">
      <button onClick={() => navigate(-1)} className="px-4 py-3 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</button>

      <div className="px-4">
        <div className="glass rounded-2xl overflow-hidden">
          {game.image_url && <img src={game.image_url} alt={game.title} className="w-full aspect-video object-cover" />}
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
          <button onClick={() => setTab('forum')} className={`flex-1 py-2 rounded-md text-xs font-semibold ${tab === 'forum' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>💬 Fórum (M/{game.title.toLowerCase().replace(/\s+/g, '').slice(0, 10)})</button>
          <button onClick={() => setTab('reviews')} className={`flex-1 py-2 rounded-md text-xs font-semibold ${tab === 'reviews' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`}>⭐ Reviews</button>
        </div>

        {user && (
          <button onClick={() => tab === 'forum' ? setPostOpen(true) : setReviewOpen(true)} className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5">
            <Plus className="h-4 w-4" /> {tab === 'forum' ? 'Criar post' : 'Escrever review'}
          </button>
        )}

        <div className="mt-4 space-y-2.5">
          {tab === 'forum' ? (
            posts.length === 0 ? <p className="text-center py-10 text-sm text-muted-foreground">Nenhum post ainda.</p> :
              posts.map(p => (
                <Link key={p.id} to={`/m/forum/post/${p.id}`} className="block glass rounded-xl p-3 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground"><b className="text-foreground">{p.author}</b><span>{timeAgo(p.created_at)}</span></div>
                  <p className="text-sm mt-1.5 line-clamp-3">{p.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{p.likes_count}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{p.replies}</span>
                  </div>
                </Link>
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
                    <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{r.likes}</span>
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
