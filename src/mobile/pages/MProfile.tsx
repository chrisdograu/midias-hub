import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, Edit2, ShoppingBag, Star, Settings, LogOut, ShieldCheck, Send, Flag, ShieldOff, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { HalfStarDisplay } from '@/components/HalfStarRating';
import { MobileBadge } from '@/mobile/lib/badge';
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
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');

  useEffect(() => {
    if (!targetId) { setLoading(false); return; }
    let cancel = false;
    (async () => {
      setLoading(true);
      const [{ data: p }, { data: revs }, { data: adsRaw }] = await Promise.all([
        supabase.from('profiles').select('id, display_name, avatar_url, bio, username').eq('id', targetId).maybeSingle(),
        supabase.from('avaliacoes_usuario').select('rating').eq('reviewed_id', targetId),
        supabase.from('anuncios').select('id, title, price').eq('seller_id', targetId).eq('status', 'active').limit(20),
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
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [targetId]);

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
      </div>

      {!isOwn && user && (
        <div className="flex gap-2">
          <button onClick={handleMessage} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5"><Send className="h-4 w-4" />Mensagem</button>
          <button onClick={handleBlock} className="px-4 rounded-xl bg-card border border-border text-muted-foreground"><ShieldOff className="h-4 w-4" /></button>
          <button onClick={() => setReportOpen(true)} className="px-4 rounded-xl bg-card border border-border text-muted-foreground hover:text-destructive"><Flag className="h-4 w-4" /></button>
        </div>
      )}

      {isOwn && (
        <div className="grid grid-cols-2 gap-2">
          <Link to="/m/anuncio/novo" className="glass rounded-xl p-3 flex flex-col items-center gap-1 hover:border-primary/40"><ShoppingBag className="h-5 w-5 text-primary" /><span className="text-xs font-semibold">Novo anúncio</span></Link>
          <Link to="/m/config" className="glass rounded-xl p-3 flex flex-col items-center gap-1 hover:border-accent/40"><Settings className="h-5 w-5 text-accent" /><span className="text-xs font-semibold">Configurações</span></Link>
        </div>
      )}

      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Anúncios ativos ({ads.length})</h2>
        {ads.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">Nenhum anúncio ativo.</p> : (
          <div className="grid grid-cols-2 gap-2">
            {ads.map(a => (
              <Link key={a.id} to={`/m/marketplace/${a.id}`} className="glass rounded-lg overflow-hidden">
                <div className="aspect-square bg-muted">{a.image ? <img src={a.image} alt={a.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-6 w-6 text-muted-foreground" /></div>}</div>
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
    </div>
  );
}
