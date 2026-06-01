import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProduto } from '@/hooks/useProdutos';
import { useMutualFriends } from '@/hooks/useFriendActivity';
import { HalfStarDisplay } from '@/components/HalfStarRating';
import { ArrowLeft, Users, Library, Star, MessageSquare, Film, Lock, Loader2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const { data: game, isLoading } = useProduto(id);
  const { data: friendIds = [], isLoading: loadingFriends } = useMutualFriends();

  const hasFriends = friendIds.length > 0;

  const { data: library = [] } = useQuery({
    queryKey: ['gsh-library', id, friendIds],
    enabled: !!id && hasFriends,
    queryFn: async () => {
      const { data } = await supabase.from('biblioteca_usuario')
        .select('user_id,status,status_updated_at,profile:user_id(display_name,avatar_url)')
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
        .order('created_at', { ascending: false }).limit(20);
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
        .order('created_at', { ascending: false }).limit(12);
      return (data as any[]) || [];
    },
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!game) return <div className="container mx-auto px-4 py-16 text-center"><p className="text-muted-foreground">Jogo não encontrado.</p></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link to={`/jogo/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar ao jogo
      </Link>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent z-10" />
        {game.image && <img src={game.image} className="absolute inset-0 w-full h-full object-cover opacity-30" alt="" />}
        <div className="relative z-20 p-8">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">Hub Social Privado</p>
          <h1 className="text-3xl font-bold text-foreground">{game.title}</h1>
          <p className="text-sm text-muted-foreground mt-2">O que seus amigos estão fazendo aqui</p>
          <div className="flex gap-4 mt-4 text-xs">
            <span className="text-foreground"><Users className="inline h-3 w-3 mr-1" />{friendIds.length} amigos</span>
            <span className="text-foreground"><Library className="inline h-3 w-3 mr-1" />{library.length} têm</span>
            <span className="text-foreground"><Star className="inline h-3 w-3 mr-1" />{reviews.length} reviews</span>
            <span className="text-foreground"><MessageSquare className="inline h-3 w-3 mr-1" />{posts.length} discussões</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Library status column */}
          <section className="lg:col-span-1 bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"><Library className="h-4 w-4 text-primary" /> Na biblioteca dos amigos</h2>
            {library.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhum amigo tem este jogo.</p>
            ) : (
              <ul className="space-y-2">
                {library.map((l: any) => {
                  const status = STATUS_LABEL[l.status] || { label: l.status, color: 'text-muted-foreground' };
                  return (
                    <li key={l.user_id} className="flex items-center gap-3">
                      <Link to={`/perfil/${l.user_id}`} className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80">
                        {l.profile?.avatar_url
                          ? <img src={l.profile.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                          : <div className="w-8 h-8 rounded-full bg-primary/20" />}
                        <span className="text-sm text-foreground truncate">{l.profile?.display_name || 'Amigo'}</span>
                      </Link>
                      <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Reviews column */}
          <section className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2"><Star className="h-4 w-4 text-price" /> Reviews dos amigos</h2>
            {reviews.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem reviews ainda.</p>
            ) : reviews.map((r: any) => (
              <article key={r.id} className="bg-card border border-border rounded-xl p-4">
                <header className="flex items-center gap-3 mb-2">
                  <Link to={`/perfil/${r.user_id}`} className="flex items-center gap-2 hover:opacity-80">
                    {r.profile?.avatar_url
                      ? <img src={r.profile.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                      : <div className="w-9 h-9 rounded-full bg-primary/20" />}
                    <span className="text-sm font-semibold text-foreground">{r.profile?.display_name || 'Amigo'}</span>
                  </Link>
                  <HalfStarDisplay rating={Number(r.rating)} size={14} />
                </header>
                {r.meta && (
                  <div className="flex flex-wrap gap-2 mb-2 text-[10px]">
                    {r.meta.hours_played != null && <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"><Clock className="inline h-3 w-3 mr-1" />{r.meta.hours_played}h</span>}
                    {r.meta.platform && <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{r.meta.platform}</span>}
                    {r.meta.mood && <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent">{r.meta.mood}</span>}
                    {r.meta.difficulty && <span className="px-2 py-0.5 rounded-full bg-warning/20 text-warning">{r.meta.difficulty}</span>}
                    {r.meta.completion_status && <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary">{r.meta.completion_status}</span>}
                    {r.meta.has_spoilers && <span className="px-2 py-0.5 rounded-full bg-destructive/20 text-destructive">spoilers</span>}
                  </div>
                )}
                {r.comment && <p className="text-sm text-foreground whitespace-pre-wrap">{r.comment}</p>}
                {r.screenshots.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {r.screenshots.slice(0, 3).map((s: any) => (
                      <img key={s.id} src={s.image_url} className="w-full aspect-video object-cover rounded" alt="" />
                    ))}
                  </div>
                )}
              </article>
            ))}

            {clips.length > 0 && (
              <>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2 pt-2"><Film className="h-4 w-4 text-accent" /> Clipes dos amigos</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {clips.map((c: any) => (
                    <a key={c.id} href={c.video_url} target="_blank" rel="noreferrer" className="block bg-card border border-border rounded-lg overflow-hidden">
                      <div className="aspect-video bg-muted">
                        {c.thumbnail_url && <img src={c.thumbnail_url} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <p className="text-[10px] text-foreground p-2 line-clamp-1">{c.profile?.display_name} {c.title && `· ${c.title}`}</p>
                    </a>
                  ))}
                </div>
              </>
            )}

            {posts.length > 0 && (
              <>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2 pt-2"><MessageSquare className="h-4 w-4 text-primary" /> Discussões dos amigos</h2>
                <div className="space-y-2">
                  {posts.map((p: any) => (
                    <div key={p.id} className="bg-card border border-border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Link to={`/perfil/${p.user_id}`} className="text-xs font-semibold text-foreground hover:text-primary">{p.profile?.display_name}</Link>
                        <span className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {p.title && <p className="text-sm font-semibold text-foreground">{p.title}</p>}
                      <p className="text-xs text-muted-foreground line-clamp-2">{p.content}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
