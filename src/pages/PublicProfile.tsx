import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProdutos } from '@/hooks/useProdutos';
import { useAuth } from '@/hooks/useAuth';
import { HalfStarDisplay } from '@/components/HalfStarRating';
import { ArrowLeft, Loader2, User, Star, Library, ShoppingBag, Lock, Calendar } from 'lucide-react';
import LevelTitleBadge from '@/components/LevelTitleBadge';

const JA_JOGUEI = ['ja_joguei', 'zerado', 'jogando', 'pausado', 'abandonado'];
const formatMemberSince = (iso?: string | null) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  } catch { return null; }
};

export default function PublicProfile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { data: games = [] } = useProdutos();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['public-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: isFollower = false } = useQuery({
    queryKey: ['is-follower', user?.id, userId],
    queryFn: async () => {
      if (!user || !userId || user.id === userId) return false;
      const { data } = await supabase.from('user_follows')
        .select('follower_id').eq('follower_id', user.id).eq('following_id', userId).maybeSingle();
      return !!data;
    },
    enabled: !!user && !!userId,
  });

  const { data: biblioteca = [] } = useQuery({
    queryKey: ['public-biblioteca', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('biblioteca_usuario')
        .select('product_id, status')
        .eq('user_id', userId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: reputation } = useQuery({
    queryKey: ['user-reputation', userId],
    queryFn: async () => {
      if (!userId) return { avg: 0, count: 0 };
      const { data, error } = await supabase
        .from('avaliacoes_usuario')
        .select('rating')
        .eq('reviewed_id', userId);
      if (error) throw error;
      const ratings = data || [];
      const avg = ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
      return { avg, count: ratings.length };
    },
    enabled: !!userId,
  });

  const { data: anuncios = [] } = useQuery({
    queryKey: ['user-anuncios', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('anuncios')
        .select('*')
        .eq('seller_id', userId)
        .eq('status', 'active');
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!profile) return <div className="container mx-auto px-4 py-16 text-center"><p className="text-muted-foreground">Perfil não encontrado.</p></div>;

  const isOwn = user?.id === userId;
  const canSeePrivate = isOwn || isFollower;
  const privacyGate = profile.is_private && !canSeePrivate;
  const memberSince = formatMemberSince((profile as any).created_at);

  const libGames = biblioteca.map(b => ({ ...b, game: games.find(g => g.id === b.product_id) })).filter(b => b.game);
  const jaJoguei = libGames.filter(b => JA_JOGUEI.includes(b.status));
  const queroJogar = libGames.filter(b => b.status === 'quero_jogar');
  const favoritos = libGames.filter(b => b.status === 'favoritos');

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      {/* Profile header */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <User className="h-8 w-8 text-primary" />
          )}
        </div>
        <h1 className="text-xl font-bold text-foreground">{profile.display_name || 'Usuário'}</h1>
        <div className="mt-2 flex justify-center"><LevelTitleBadge userId={profile.id} variant="card" /></div>
        {memberSince && (
          <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" /> Membro desde {memberSince}
          </p>
        )}
        {profile.bio && <p className="text-sm text-muted-foreground mt-2">{profile.bio}</p>}
        {reputation && reputation.count > 0 && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <HalfStarDisplay rating={reputation.avg} size={16} />
            <span className="text-sm text-foreground font-medium">{reputation.avg.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({reputation.count} avaliações)</span>
          </div>
        )}
      </div>

      {privacyGate ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          <Lock className="h-8 w-8 mx-auto mb-2 opacity-60" />
          <p className="text-sm font-semibold text-foreground">Perfil privado</p>
          <p className="text-xs mt-1">Siga este usuário para ver a biblioteca e atividade.</p>
          {anuncios.length > 0 && (
            <p className="text-xs mt-3">Apenas anúncios ativos abaixo são públicos.</p>
          )}
        </div>
      ) : (
      <>


      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <Library className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{biblioteca.length}</p>
          <p className="text-[10px] text-muted-foreground">Na biblioteca</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <ShoppingBag className="h-5 w-5 text-accent mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{anuncios.length}</p>
          <p className="text-[10px] text-muted-foreground">Anúncios</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <Star className="h-5 w-5 text-price mx-auto mb-1" />
          <p className="text-lg font-bold text-foreground">{reputation?.avg.toFixed(1) || '0'}</p>
          <p className="text-[10px] text-muted-foreground">Reputação</p>
        </div>
      </div>

      {/* Library sections */}
      {[
        { title: 'Já Joguei', items: jaJoguei, emoji: '🎮' },
        { title: 'Quero Jogar', items: queroJogar, emoji: '📋' },
        { title: 'Favoritos', items: favoritos, emoji: '⭐' },
      ].map(section => section.items.length > 0 && (
        <div key={section.title} className="mb-6">
          <h2 className="text-sm font-bold text-foreground mb-3">{section.emoji} {section.title} ({section.items.length})</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {section.items.map(item => item.game && (
              <Link key={item.product_id} to={`/jogo/${item.product_id}`}
                className="group">
                <img src={item.game.image} alt={item.game.title}
                  className="w-full aspect-[3/4] object-cover rounded-lg group-hover:ring-2 ring-primary transition-all" />
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{item.game.title}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
      </>
      )}



      {/* Active ads */}
      {anuncios.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">🏷️ Anúncios Ativos</h2>
          <div className="space-y-2">
            {anuncios.map((a: any) => (
              <Link key={a.id} to={`/marketplace/${a.id}`}
                className="bg-card border border-border rounded-lg p-3 flex justify-between items-center hover:border-primary/40 transition-all block">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.platform} • {a.condition}</p>
                </div>
                {a.price > 0 && <span className="text-sm font-bold text-price">R$ {Number(a.price).toFixed(2)}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
