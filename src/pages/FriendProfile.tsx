import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProdutos } from '@/hooks/useProdutos';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Lock, Loader2, Calendar, Users, Library, Activity, BarChart3, Heart, Gamepad2,
  Star, BookOpen, Trophy, Sparkles,
} from 'lucide-react';
import FriendIdentityPanel from '@/components/social/FriendIdentityPanel';
import { HalfStarDisplay } from '@/components/HalfStarRating';
import LevelTitleBadge from '@/components/LevelTitleBadge';
import GameTimeline from '@/components/social/GameTimeline';
import HighlightsStrip from '@/components/social/HighlightsStrip';
import SellerProfileSwitcher from '@/components/seller/SellerProfileSwitcher';
import { Clock } from 'lucide-react';

type Tab = 'overview' | 'biblioteca' | 'atividade' | 'timeline' | 'estatisticas' | 'amizade';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Visão Geral', icon: Sparkles },
  { id: 'biblioteca', label: 'Biblioteca', icon: Library },
  { id: 'atividade', label: 'Atividade', icon: Activity },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'estatisticas', label: 'Estatísticas', icon: BarChart3 },
  { id: 'amizade', label: 'Amizade', icon: Heart },
];

export default function FriendProfile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { data: games = [] } = useProdutos();
  const [tab, setTab] = useState<Tab>('overview');

  const { data: isMutual, isLoading: checkingFriendship } = useQuery({
    queryKey: ['is-mutual', user?.id, userId],
    enabled: !!user && !!userId && user.id !== userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('are_mutual_friends' as any, {
        _user_a: user!.id, _user_b: userId!,
      });
      if (error) return false;
      return !!data;
    },
  });

  const accessible = !!user && (user.id === userId || isMutual);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['friend-profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId!).maybeSingle();
      return data;
    },
  });

  const { data: biblioteca = [] } = useQuery({
    queryKey: ['friend-biblioteca', userId],
    enabled: !!userId && accessible,
    queryFn: async () => {
      const { data } = await supabase.from('biblioteca_usuario')
        .select('product_id,status,status_updated_at,personal_note,badge_completed,badge_platinum,badge_verified_source')
        .eq('user_id', userId!);
      return (data as any[]) || [];
    },
  });

  const { data: myBiblioteca = [] } = useQuery({
    queryKey: ['my-biblioteca-ids', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('biblioteca_usuario')
        .select('product_id').eq('user_id', user!.id);
      return ((data as any[]) || []).map(r => r.product_id as string);
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['friend-reviews', userId],
    enabled: !!userId && accessible,
    queryFn: async () => {
      const { data } = await supabase.from('avaliacoes')
        .select('id,product_id,rating,comment,created_at')
        .eq('user_id', userId!).order('created_at', { ascending: false }).limit(40);
      return (data as any[]) || [];
    },
  });

  const { data: reviewsCompletas = [] } = useQuery({
    queryKey: ['friend-reviews-completas', userId],
    enabled: !!userId && accessible,
    queryFn: async () => {
      const { data } = await supabase.from('reviews_completas' as any)
        .select('id,product_id,analise,horas_jogadas,plataforma,recomendacao,created_at')
        .eq('user_id', userId!).order('created_at', { ascending: false }).limit(20);
      return (data as any[]) || [];
    },
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['friend-posts', userId],
    enabled: !!userId && accessible,
    queryFn: async () => {
      const { data } = await supabase.from('forum_posts')
        .select('id,product_id,title,content,created_at,likes_count')
        .eq('user_id', userId!).order('created_at', { ascending: false }).limit(20);
      return (data as any[]) || [];
    },
  });

  const { data: friendshipDate } = useQuery({
    queryKey: ['friendship-date', user?.id, userId],
    enabled: !!user && !!userId && !!isMutual,
    queryFn: async () => {
      const { data } = await supabase.from('user_follows' as any)
        .select('created_at')
        .or(`and(follower_id.eq.${user!.id},following_id.eq.${userId}),and(follower_id.eq.${userId},following_id.eq.${user!.id})`)
        .order('created_at', { ascending: true }).limit(1).maybeSingle();
      return (data as any)?.created_at as string | undefined;
    },
  });

  const { data: sellerHandle } = useQuery({
    queryKey: ['friend-seller-handle', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from('seller_profiles' as any)
        .select('handle').eq('user_id', userId!).maybeSingle();
      return ((data as any)?.handle as string | undefined) ?? null;
    },
  });

  const libEnriched = useMemo(
    () => biblioteca.map((b: any) => ({ ...b, game: games.find(g => g.id === b.product_id) })).filter(b => b.game),
    [biblioteca, games]
  );
  const commonGames = useMemo(
    () => libEnriched.filter(b => myBiblioteca.includes(b.product_id)),
    [libEnriched, myBiblioteca]
  );
  const totalHours = useMemo(
    () => reviewsCompletas.reduce((s, r: any) => s + (r.horas_jogadas || 0), 0),
    [reviewsCompletas]
  );
  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((s, r: any) => s + Number(r.rating), 0) / reviews.length;
  }, [reviews]);

  if (isLoading || checkingFriendship) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!profile) {
    return <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Perfil não encontrado.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Link to="/social" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> Biblioteca Social
      </Link>

      <SellerProfileSwitcher
        userId={userId}
        personalHandle={(profile?.display_name || '').toLowerCase() || null}
        sellerHandle={sellerHandle ?? null}
        hasSeller={!!sellerHandle}
      />

      {/* Banner + identidade */}
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden border border-border mb-6">
        <div className="h-40 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 relative">
          {(profile as any).banner_url && (
            <img src={(profile as any).banner_url} className="w-full h-full object-cover" alt="" />
          )}
        </div>
        <div className="p-5 pt-0">
          <div className="-mt-12 flex items-end gap-4 flex-wrap">
            {profile.avatar_url
              ? <img src={profile.avatar_url} className="w-24 h-24 rounded-full border-4 border-card object-cover" alt="" />
              : <div className="w-24 h-24 rounded-full border-4 border-card bg-primary/20" />}
            <div className="flex-1 min-w-0 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{profile.display_name || 'Amigo'}</h1>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <LevelTitleBadge userId={profile.id} variant="card" />
                {friendshipDate && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Amigos desde {new Date(friendshipDate).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
              {profile.bio && <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>}
            </div>
          </div>

          {/* Quick chips */}
          <div className="flex flex-wrap gap-2 mt-4 text-[11px]">
            {(profile as any).gamer_personality && (
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {(profile as any).gamer_personality}
              </span>
            )}
            {((profile as any).favorite_genres || []).slice(0, 6).map((g: string) => (
              <span key={g} className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">{g}</span>
            ))}
          </div>
        </div>
      </motion.section>

      {!accessible ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="font-semibold text-foreground">Conteúdo privado de amigos</p>
          <p className="text-sm text-muted-foreground mt-1">
            Vocês precisam se seguir mutuamente para acessar o perfil completo.
          </p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 border-b border-border mb-5 overflow-x-auto">
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

          {tab === 'overview' && (
            <div className="space-y-5">
              {userId && <HighlightsStrip userId={userId} />}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                <Stat icon={Library} label="Biblioteca" value={biblioteca.length} />
                <Stat icon={Star} label="Reviews" value={reviews.length} />
                <Stat icon={BookOpen} label="Reviews Completas" value={reviewsCompletas.length} />
                <Stat icon={Trophy} label="Horas registradas" value={totalHours} />
              </div>

              {(profile as any).current_game_id && (() => {
                const cg = games.find(g => g.id === (profile as any).current_game_id);
                return cg ? (
                  <Section title="Jogando agora">
                    <Link to={`/jogo/${cg.id}/social`} className="flex items-center gap-3 group">
                      <img src={cg.image} className="w-16 h-20 rounded-lg object-cover group-hover:ring-2 ring-primary transition-all" alt="" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">{cg.title}</p>
                        <p className="text-xs text-muted-foreground">{cg.category}</p>
                      </div>
                    </Link>
                  </Section>
                ) : null;
              })()}

              <FriendIdentityPanel userId={userId!} />
            </div>
          )}

          {tab === 'biblioteca' && (
            <Section title={`Biblioteca (${libEnriched.length})`}>
              {libEnriched.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem jogos na biblioteca.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {libEnriched.map((b: any) => (
                    <Link key={b.product_id} to={`/jogo/${b.product_id}/social`} className="group relative">
                      <img src={b.game.image} className="w-full aspect-[3/4] object-cover rounded-lg group-hover:ring-2 ring-primary transition-all" alt="" />
                      {(b.badge_platinum || b.badge_completed) && (
                        <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg text-white"
                          style={{ background: b.badge_platinum ? 'linear-gradient(135deg,#22d3ee,#0891b2)' : 'linear-gradient(135deg,#a855f7,#7e22ce)' }}>
                          {b.badge_platinum ? '💎' : '✓'}
                        </span>
                      )}
                      <p className="text-[11px] text-foreground line-clamp-1 mt-1">{b.game.title}</p>
                      <p className="text-[10px] text-muted-foreground">{b.status}</p>
                    </Link>
                  ))}
                </div>
              )}
            </Section>
          )}

          {tab === 'atividade' && (
            <Section title="Atividade recente">
              {(() => {
                const events = [
                  ...reviews.map((r: any) => ({ kind: 'review', date: r.created_at, data: r })),
                  ...reviewsCompletas.map((r: any) => ({ kind: 'review-completa', date: r.created_at, data: r })),
                  ...posts.map((p: any) => ({ kind: 'post', date: p.created_at, data: p })),
                ].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 30);
                if (!events.length) return <p className="text-sm text-muted-foreground">Sem atividade recente.</p>;
                return (
                  <ul className="space-y-2">
                    {events.map((e, i) => {
                      const game = games.find(g => g.id === e.data.product_id);
                      return (
                        <li key={i} className="bg-card border border-border rounded-lg p-3 flex items-start gap-3">
                          <span className="text-primary mt-0.5">
                            {e.kind === 'review' && <Star className="h-4 w-4" />}
                            {e.kind === 'review-completa' && <BookOpen className="h-4 w-4" />}
                            {e.kind === 'post' && <Activity className="h-4 w-4" />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground">
                              {e.kind === 'review' && <>Avaliou <strong>{game?.title || 'um jogo'}</strong></>}
                              {e.kind === 'review-completa' && <>Publicou Review Completa de <strong>{game?.title || 'um jogo'}</strong></>}
                              {e.kind === 'post' && <>Discussão em <strong>{game?.title || 'fórum'}</strong>{e.data.title ? `: ${e.data.title}` : ''}</>}
                            </p>
                            {e.kind === 'review' && <HalfStarDisplay rating={Number(e.data.rating)} size={12} className="mt-1" />}
                            <p className="text-[10px] text-muted-foreground mt-1">{new Date(e.date).toLocaleString('pt-BR')}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </Section>
          )}

          {tab === 'timeline' && userId && (
            <Section title="Linha do tempo nos jogos">
              <GameTimeline userId={userId} />
            </Section>
          )}

          {tab === 'estatisticas' && (

            <div className="space-y-5">
              <Section title="Resumo">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Stat icon={Star} label="Nota média" value={avgRating.toFixed(1)} />
                  <Stat icon={Trophy} label="Horas (Reviews Completas)" value={totalHours} />
                  <Stat icon={Library} label="Total jogos" value={biblioteca.length} />
                </div>
              </Section>
              <Section title="Status da biblioteca">
                {(() => {
                  const counts: Record<string, number> = {};
                  libEnriched.forEach((b: any) => { counts[b.status] = (counts[b.status] || 0) + 1; });
                  const keys = Object.keys(counts);
                  if (!keys.length) return <p className="text-sm text-muted-foreground">Sem dados.</p>;
                  return (
                    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {keys.map(k => (
                        <li key={k} className="bg-muted/40 rounded-lg p-2 text-xs flex items-center justify-between">
                          <span className="text-foreground">{k}</span>
                          <span className="font-semibold text-primary">{counts[k]}</span>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </Section>
            </div>
          )}

          {tab === 'amizade' && (
            <div className="space-y-5">
              <Section title="Linha do tempo da amizade">
                {friendshipDate ? (
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Amigos há {Math.max(1, Math.floor((Date.now() - +new Date(friendshipDate)) / 86400000))} dias
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem dados de amizade.</p>
                )}
              </Section>
              <Section title={`Jogos em comum (${commonGames.length})`}>
                {commonGames.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Vocês ainda não têm jogos em comum.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {commonGames.slice(0, 15).map((b: any) => (
                      <Link key={b.product_id} to={`/jogo/${b.product_id}/social`} className="group">
                        <img src={b.game.image} className="w-full aspect-[3/4] object-cover rounded-lg group-hover:ring-2 ring-primary transition-all" alt="" />
                        <p className="text-[10px] text-foreground line-clamp-1 mt-1">{b.game.title}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </Section>
              <Section title="Compatibilidade">
                <p className="text-sm text-foreground">
                  <Gamepad2 className="inline h-4 w-4 text-primary mr-1" />
                  {commonGames.length > 0
                    ? `${Math.min(100, Math.round((commonGames.length / Math.max(1, biblioteca.length)) * 100))}% das experiências dele(a) você também viveu.`
                    : 'Ainda não dá para calcular — joguem algo em comum.'}
                </p>
              </Section>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-xl p-5">
      <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" /> {title}
      </h2>
      {children}
    </section>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-center">
      <Icon className="h-5 w-5 text-primary mx-auto mb-1" />
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
