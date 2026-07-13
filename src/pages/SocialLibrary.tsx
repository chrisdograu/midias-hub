import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  useMutualFriends, useFriendActivityStates, useSetActivityState, useRealtimeActivityStates,
  type ActivityState, type ActivityType, type FriendActivityItem,
} from '@/hooks/useFriendActivity';
import { Loader2, Users, Heart, Bookmark, EyeOff, Sparkles, Star, Library, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import SocialFavorites from '@/components/social/SocialFavorites';

type Tab = 'new' | 'liked' | 'saved' | 'favoritos' | 'hidden';

export default function SocialLibrary() {
  const { user } = useAuth();
  const { data: friendIds = [], isLoading: loadingFriends } = useMutualFriends();
  const { data: stateMap = {} } = useFriendActivityStates();
  const setState = useSetActivityState();
  useRealtimeActivityStates();

  const [tab, setTab] = useState<Tab>('new');
  const [items, setItems] = useState<FriendActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favCount, setFavCount] = useState(0);

  // Conta favoritos reais (item 35)
  useEffect(() => {
    if (!user) { setFavCount(0); return; }
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from('social_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (!cancelled) setFavCount(count ?? 0);
    })();
    return () => { cancelled = true; };
  }, [user?.id, tab]);
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    if (friendIds.length === 0) { setItems([]); setLoading(false); return; }
    setLoading(true);
    (async () => {
      const [libRes, revRes, postRes] = await Promise.all([
        supabase.from('biblioteca_usuario')
          .select('id, user_id, product_id, status, acquired_at, profiles!inner(display_name, avatar_url, is_private), produtos!inner(title, image_url)')
          .in('user_id', friendIds).order('acquired_at', { ascending: false }).limit(60),
        supabase.from('avaliacoes')
          .select('id, user_id, product_id, rating, comment, created_at, profiles!inner(display_name, avatar_url, is_private), produtos!inner(title, image_url)')
          .in('user_id', friendIds).eq('is_approved', true).order('created_at', { ascending: false }).limit(60),
        supabase.from('forum_posts')
          .select('id, user_id, content, title, product_id, created_at, profiles!inner(display_name, avatar_url, is_private)')
          .in('user_id', friendIds).order('created_at', { ascending: false }).limit(60),
      ]);

      const lib: FriendActivityItem[] = (((libRes.data as any[]) || []).filter(r => !r.profiles?.is_private)).map(r => ({
        id: r.id, type: 'library' as ActivityType, friend_id: r.user_id,
        friend_name: r.profiles?.display_name, friend_avatar: r.profiles?.avatar_url,
        product_id: r.product_id, product_title: r.produtos?.title, product_image: r.produtos?.image_url,
        status: r.status, created_at: r.acquired_at, state: 'new' as ActivityState,
      }));
      const rev: FriendActivityItem[] = (((revRes.data as any[]) || []).filter(r => !r.profiles?.is_private)).map(r => ({
        id: r.id, type: 'review' as ActivityType, friend_id: r.user_id,
        friend_name: r.profiles?.display_name, friend_avatar: r.profiles?.avatar_url,
        product_id: r.product_id, product_title: r.produtos?.title, product_image: r.produtos?.image_url,
        rating: Number(r.rating), comment: r.comment, created_at: r.created_at, state: 'new' as ActivityState,
      }));
      const posts: FriendActivityItem[] = (((postRes.data as any[]) || []).filter(r => !r.profiles?.is_private)).map(r => ({
        id: r.id, type: 'post' as ActivityType, friend_id: r.user_id,
        friend_name: r.profiles?.display_name, friend_avatar: r.profiles?.avatar_url,
        product_id: r.product_id, content: r.title ? `${r.title} — ${r.content}` : r.content,
        created_at: r.created_at, state: 'new' as ActivityState,
      }));

      const all = [...lib, ...rev, ...posts].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setItems(all);
      setLoading(false);
    })();
  }, [user, friendIds]);

  // Merge state map → effective state
  const withState = useMemo(() => items.map(it => ({ ...it, state: (stateMap[it.id] || 'new') as ActivityState })), [items, stateMap]);

  const filtered = useMemo(() => {
    if (tab === 'new') return withState.filter(i => i.state === 'new' || i.state === 'seen');
    return withState.filter(i => i.state === tab);
  }, [withState, tab]);

  // Auto mark SEEN when item enters viewport (non-repetition engine)
  useEffect(() => {
    if (tab !== 'new') return;
    const obs = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) {
          const id = (e.target as HTMLElement).dataset.activityId;
          const type = (e.target as HTMLElement).dataset.activityType as ActivityType;
          const friendId = (e.target as HTMLElement).dataset.friendId;
          if (id && type && friendId && (stateMap[id] || 'new') === 'new') {
            setState.mutate({ type, refId: id, friendId, state: 'seen' });
          }
        }
      });
    }, { threshold: 0.6 });
    document.querySelectorAll<HTMLElement>('[data-activity-id]').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [filtered, tab, stateMap, setState]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <Users className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Biblioteca Social</h1>
        <p className="text-muted-foreground mb-4">Entre para ver atividade dos seus amigos.</p>
        <Link to="/auth" className="text-primary hover:underline">Entrar</Link>
      </div>
    );
  }

  const tabs: { k: Tab; label: string; icon: any; count: number }[] = [
    { k: 'new', label: 'Novidades', icon: Sparkles, count: withState.filter(i => i.state === 'new').length },
    { k: 'liked', label: 'Curtidos', icon: Heart, count: withState.filter(i => i.state === 'liked').length },
    { k: 'saved', label: 'Salvos', icon: Bookmark, count: withState.filter(i => i.state === 'saved').length },
    { k: 'favoritos', label: 'Favoritos', icon: Star, count: favCount },
    { k: 'hidden', label: 'Ocultos', icon: EyeOff, count: withState.filter(i => i.state === 'hidden').length },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <Library className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold">Biblioteca Social</h1>
          <p className="text-muted-foreground text-sm">Atividade dos seus amigos — sem nunca repetir.</p>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mb-6">
        {friendIds.length} {friendIds.length === 1 ? 'amigo mútuo' : 'amigos mútuos'}
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-3">
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.k;
          return (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              <Icon className="h-4 w-4" /> {t.label}
              {t.count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-primary-foreground/20' : 'bg-background'}`}>{t.count}</span>}
            </button>
          );
        })}
      </div>

      {tab === 'favoritos' ? (
        <SocialFavorites />
      ) : loadingFriends || loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : friendIds.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-2">Você ainda não tem amigos mútuos.</p>
          <p className="text-sm">Use o app mobile para iniciar conversas e formar conexões.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {tab === 'new' && 'Tudo em dia! Nenhuma novidade dos seus amigos.'}
          {tab === 'liked' && 'Você ainda não curtiu nada.'}
          {tab === 'saved' && 'Nada salvo ainda.'}
          {tab === 'hidden' && 'Nenhum item oculto.'}
        </div>
      ) : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map(it => (
              <motion.li key={`${it.type}-${it.id}`}
                data-activity-id={it.id} data-activity-type={it.type} data-friend-id={it.friend_id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                className={`bg-card border border-border rounded-xl p-4 ${it.state === 'new' ? 'ring-1 ring-primary/30' : ''}`}>
                <div className="flex gap-3">
                  <Link to={`/perfil/${it.friend_id}`} className="shrink-0">
                    <div className="w-11 h-11 rounded-full bg-secondary overflow-hidden">
                      {it.friend_avatar ? <img src={it.friend_avatar} alt="" className="w-full h-full object-cover" /> :
                        <div className="w-full h-full flex items-center justify-center text-sm font-semibold">{(it.friend_name || '?')[0]}</div>}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link to={`/perfil/${it.friend_id}`} className="font-semibold hover:text-primary">{it.friend_name || 'Amigo'}</Link>
                      {it.state === 'new' && <span className="text-[10px] uppercase tracking-wide bg-primary/15 text-primary px-1.5 py-0.5 rounded">novo</span>}
                      <span className="text-xs text-muted-foreground">{new Date(it.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {it.type === 'library' && it.product_title && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">
                          {it.status === 'jogando' ? 'está jogando' : it.status === 'zerado' ? 'zerou' : it.status === 'quero_jogar' ? 'quer jogar' : 'adicionou'}
                        </span>{' '}
                        <Link to={`/jogo/${it.product_id}`} className="font-medium hover:text-primary">{it.product_title}</Link>
                      </p>
                    )}
                    {it.type === 'review' && (
                      <>
                        <p className="text-sm flex items-center gap-1 flex-wrap">
                          <span className="text-muted-foreground">avaliou</span>{' '}
                          <Link to={`/jogo/${it.product_id}`} className="font-medium hover:text-primary">{it.product_title}</Link>
                          <span className="inline-flex items-center gap-0.5 text-amber-500"><Star className="h-3 w-3 fill-current" />{it.rating?.toFixed(1)}</span>
                        </p>
                        {it.comment && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{it.comment}</p>}
                      </>
                    )}
                    {it.type === 'post' && (
                      <p className="text-sm flex items-start gap-1">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <span className="line-clamp-3">{it.content}</span>
                      </p>
                    )}
                  </div>
                  {it.product_image && (
                    <Link to={it.product_id ? `/jogo/${it.product_id}` : '#'} className="shrink-0">
                      <img src={it.product_image} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    </Link>
                  )}
                </div>

                {/* Action bar */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                  <Button size="sm" variant={it.state === 'liked' ? 'default' : 'ghost'}
                    onClick={() => setState.mutate({ type: it.type, refId: it.id, friendId: it.friend_id, state: it.state === 'liked' ? 'seen' : 'liked' })}>
                    <Heart className={`h-4 w-4 ${it.state === 'liked' ? 'fill-current' : ''}`} /> Curtir
                  </Button>
                  <Button size="sm" variant={it.state === 'saved' ? 'default' : 'ghost'}
                    onClick={() => setState.mutate({ type: it.type, refId: it.id, friendId: it.friend_id, state: it.state === 'saved' ? 'seen' : 'saved' })}>
                    <Bookmark className={`h-4 w-4 ${it.state === 'saved' ? 'fill-current' : ''}`} /> Salvar
                  </Button>
                  <Button size="sm" variant="ghost" className="ml-auto text-muted-foreground"
                    onClick={() => setState.mutate({ type: it.type, refId: it.id, friendId: it.friend_id, state: it.state === 'hidden' ? 'seen' : 'hidden' })}>
                    <EyeOff className="h-4 w-4" /> {it.state === 'hidden' ? 'Restaurar' : 'Ocultar'}
                  </Button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
