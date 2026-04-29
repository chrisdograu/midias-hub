import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, ShoppingBag, Settings, LogOut, Send, Flag, ShieldOff, ArrowLeft, UserPlus, UserCheck, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { HalfStarDisplay } from '@/components/HalfStarRating';
import { useFollow } from '@/mobile/lib/useFollow';
import { toast } from 'sonner';

interface Profile { id: string; display_name: string | null; avatar_url: string | null; bio: string | null; username: string | null }
interface Ad { id: string; title: string; price: number; image: string | null }

export default function MProfile() {
  const { userId } = useParams();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const targetId = userId || user?.id;
  const isOwn = !userId || userId === user?.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rating, setRating] = useState(0);
  const [ads, setAds] = useState<Ad[]>([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [followersOpen, setFollowersOpen] = useState<'followers' | 'following' | null>(null);
  const [followList, setFollowList] = useState<{ id: string; display_name: string | null; avatar_url: string | null }[]>([]);

  const { isFollowing, followersCount, followingCount, loading: followLoading, toggle: toggleFollow } = useFollow(targetId);

  useEffect(() => {
    if (!targetId) { setLoading(false); return; }
    let cancel = false;
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: revs }, { data: adsRaw }, { count: rc }, { count: pc }] = await Promise.all([
        supabase.from('profiles').select('id, display_name, avatar_url, bio, username').eq('id', targetId).maybeSingle(),
        supabase.from('avaliacoes_usuario').select('rating').eq('reviewed_id', targetId),
        supabase.from('anuncios').select('id, title, price').eq('seller_id', targetId).eq('status', 'active').limit(20),
        supabase.from('avaliacoes').select('id', { count: 'exact', head: true }).eq('user_id', targetId).eq('is_approved', true),
        supabase.from('forum_posts').select('id', { count: 'exact', head: true }).eq('user_id', targetId),
      ]);
      const adIds = adsRaw?.map(a => a.id) || [];
      const { data: photos } = adIds.length
        ? await supabase.from('fotos_anuncio').select('anuncio_id, image_url, position').in('anuncio_id', adIds).order('position')
        : { data: [] as any[] };
      const photoMap = new Map<string, string>();
      (photos || []).forEach(ph => { if (!photoMap.has(ph.anuncio_id)) photoMap.set(ph.anuncio_id, ph.image_url); });
      const avg = revs?.length ? revs.reduce((s, r) => s + r.rating, 0) / revs.length : 0;
      if (cancel) return;
      setProfile(p as Profile);
      setRating(avg);
      setAds((adsRaw || []).map(a => ({ id: a.id, title: a.title, price: Number(a.price), image: photoMap.get(a.id) || null })));
      setReviewsCount(rc || 0);
      setPostsCount(pc || 0);
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [targetId]);

  const openFollowList = async (kind: 'followers' | 'following') => {
    if (!targetId) return;
    setFollowersOpen(kind);
    const col = kind === 'followers' ? 'follower_id' : 'following_id';
    const filter = kind === 'followers' ? 'following_id' : 'follower_id';
    const { data } = await supabase.from('user_follows').select(col).eq(filter, targetId);
    const ids = (data || []).map((d: any) => d[col]);
    if (!ids.length) { setFollowList([]); return; }
    const { data: profs } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', ids);
    setFollowList(profs || []);
  };

  const handleBlock = async () => {
    if (!user || !targetId) return;
    const { error } = await supabase.from('blocked_users').insert({ blocker_id: user.id, blocked_id: targetId });
    if (error) toast.error('Erro ao bloquear'); else toast.success('Usuário bloqueado');
  };
  const handleMessage = async () => {
    if (!user || !targetId) return;
    const { data: existing } = await supabase.from('conversas').select('id')
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${targetId}),and(participant_1.eq.${targetId},participant_2.eq.${user.id})`)
      .is('anuncio_id', null).maybeSingle();
    if (existing) { navigate(`/m/chat/${existing.id}`); return; }
    const { data: conv } = await supabase.from('conversas').insert({
      participant_1: user.id, participant_2: targetId, status: 'pending'
    }).select('id').single();
    if (conv) { toast.success('Pedido de conversa enviado'); navigate(`/m/chat/${conv.id}`); }
  };
  const submitReport = async () => {
    if (!user || !targetId || !reportText.trim()) return;
    await supabase.from('denuncias').insert({ reporter_id: user.id, target_type: 'profile', target_id: targetId, reason: reportText.trim() });
    toast.success('Denúncia enviada'); setReportOpen(false); setReportText('');
  };

  if (!user && isOwn) return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground mb-4">Entre para ver seu perfil.</p>
      <Link to="/m/auth" className="inline-block px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Entrar</Link>
    </div>
  );
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!profile) return <div className="p-6 text-center text-muted-foreground">Perfil não encontrado.</div>;

  return (
    <div className="px-4 py-5 space-y-5">
      {!isOwn && <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</button>}

      <div className="glass rounded-2xl p-5 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent overflow-hidden mx-auto mb-3 flex items-center justify-center text-primary-foreground text-3xl font-bold">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : profile.display_name?.[0]?.toUpperCase() || '?'}
        </div>
        <h1 className="font-display text-lg font-bold">{profile.display_name || 'Usuário'}</h1>
        {profile.username && <p className="text-xs text-muted-foreground">@{profile.username}</p>}
        <div className="flex items-center justify-center gap-1.5 mt-2"><HalfStarDisplay rating={rating} size={14} /><span className="text-xs text-muted-foreground">{rating > 0 ? rating.toFixed(1) : 'sem avaliações'}</span></div>
        {profile.bio && <p className="text-sm text-muted-foreground mt-3">{profile.bio}</p>}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border/40">
          <button onClick={() => openFollowList('followers')} className="text-center hover:text-primary transition-colors">
            <div className="text-base font-bold">{followersCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Seguidores</div>
          </button>
          <button onClick={() => openFollowList('following')} className="text-center hover:text-primary transition-colors">
            <div className="text-base font-bold">{followingCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Seguindo</div>
          </button>
          <div className="text-center">
            <div className="text-base font-bold">{reviewsCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-base font-bold">{postsCount}</div>
            <div className="text-[10px] text-muted-foreground uppercase">Posts</div>
          </div>
        </div>
      </div>

      {!isOwn && user && (
        <div className="flex gap-2">
          <button onClick={toggleFollow} disabled={followLoading} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${isFollowing ? 'bg-card border border-border text-foreground' : 'bg-gradient-to-r from-primary to-accent text-primary-foreground glow-primary'}`}>
            {isFollowing ? <><UserCheck className="h-4 w-4" />Seguindo</> : <><UserPlus className="h-4 w-4" />Seguir</>}
          </button>
          <button onClick={handleMessage} className="px-4 rounded-xl bg-card border border-border"><Send className="h-4 w-4" /></button>
          <button onClick={handleBlock} className="px-4 rounded-xl bg-card border border-border text-muted-foreground"><ShieldOff className="h-4 w-4" /></button>
          <button onClick={() => setReportOpen(true)} className="px-4 rounded-xl bg-card border border-border text-muted-foreground hover:text-destructive"><Flag className="h-4 w-4" /></button>
        </div>
      )}

      {isOwn && (
        <div className="grid grid-cols-2 gap-2">
          <Link to="/m/marketplace/novo" className="glass rounded-xl p-3 flex flex-col items-center gap-1 hover:border-primary/40"><ShoppingBag className="h-5 w-5 text-primary" /><span className="text-xs font-semibold">Novo anúncio</span></Link>
          <Link to="/m/config" className="glass rounded-xl p-3 flex flex-col items-center gap-1 hover:border-accent/40"><Settings className="h-5 w-5 text-accent" /><span className="text-xs font-semibold">Configurações</span></Link>
        </div>
      )}

      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Anúncios ativos ({ads.length})</h2>
        {ads.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhum anúncio ativo.</p> : (
          <div className="grid grid-cols-2 gap-2">
            {ads.map(a => (
              <Link key={a.id} to={`/m/marketplace/${a.id}`} className="glass rounded-lg overflow-hidden">
                <div className="aspect-square bg-muted">{a.image ? <img src={a.image} alt={a.title} loading="lazy" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-6 w-6 text-muted-foreground" /></div>}</div>
                <div className="p-2"><p className="text-[11px] font-semibold line-clamp-1">{a.title}</p><p className="text-xs font-bold text-price">R$ {a.price.toFixed(2)}</p></div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {isOwn && (
        <button onClick={async () => { await signOut(); navigate('/m/auth'); }} className="w-full py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-semibold flex items-center justify-center gap-1.5"><LogOut className="h-4 w-4" />Sair</button>
      )}

      {reportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={() => setReportOpen(false)}>
          <div className="w-full bg-card rounded-t-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold">Denunciar usuário</h3>
            <textarea value={reportText} onChange={e => setReportText(e.target.value)} maxLength={500} rows={4} placeholder="Motivo..." className="w-full p-3 bg-background border border-border rounded-lg text-sm resize-none" />
            <div className="flex gap-2">
              <button onClick={() => setReportOpen(false)} className="flex-1 py-2.5 rounded-lg bg-secondary text-sm font-semibold">Cancelar</button>
              <button onClick={submitReport} className="flex-1 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold">Enviar</button>
            </div>
          </div>
        </div>
      )}

      {followersOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={() => setFollowersOpen(null)}>
          <div className="w-full max-h-[70vh] overflow-y-auto bg-card rounded-t-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold flex items-center gap-2"><Users className="h-4 w-4" />{followersOpen === 'followers' ? 'Seguidores' : 'Seguindo'}</h3>
            {followList.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Lista vazia.</p> : (
              <div className="space-y-2">
                {followList.map(f => (
                  <Link key={f.id} to={`/m/perfil/${f.id}`} onClick={() => setFollowersOpen(null)} className="flex items-center gap-3 p-2 glass rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent overflow-hidden flex items-center justify-center text-primary-foreground font-bold">
                      {f.avatar_url ? <img src={f.avatar_url} alt="" className="w-full h-full object-cover" /> : f.display_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <span className="text-sm font-semibold flex-1">{f.display_name || 'Usuário'}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
