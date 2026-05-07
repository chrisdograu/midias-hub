import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, ArrowLeftRight, Send, ChevronLeft, ChevronRight, Loader2, ShoppingBag, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { MobileBadge } from '@/mobile/lib/badge';
import { HalfStarDisplay } from '@/components/HalfStarRating';
import { useFollow } from '@/mobile/lib/useFollow';
import { toast } from 'sonner';
import { ItemActionsMenu } from '@/components/ItemActionsMenu';

interface Ad {
  id: string; title: string; description: string | null; price: number; ad_type: string;
  condition: string; certificate_type: string; created_at: string; seller_id: string;
  category: string; plataformas: string[] | null; desired_item: string | null;
  accepts_counteroffer: boolean;
}
interface Seller { id: string; display_name: string | null; avatar_url: string | null; bio: string | null; rating: number }

export default function MMarketplaceItem() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ad, setAd] = useState<Ad | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [similar, setSimilar] = useState<{ id: string; title: string; price: number; image: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const { isFollowing, loading: followLoading, toggle: toggleFollow } = useFollow(seller?.id);

  useEffect(() => {
    if (!id) return;
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data: a } = await supabase.from('anuncios').select('*').eq('id', id).maybeSingle();
      if (!a || cancel) { setLoading(false); return; }
      const [{ data: ph }, { data: s }, { data: revs }, { data: sim }] = await Promise.all([
        supabase.from('fotos_anuncio').select('image_url, position').eq('anuncio_id', id).order('position'),
        supabase.from('profiles').select('id, display_name, avatar_url, bio').eq('id', a.seller_id).maybeSingle(),
        supabase.from('avaliacoes_usuario').select('rating').eq('reviewed_id', a.seller_id),
        supabase.from('anuncios').select('id, title, price, seller_id').eq('status', 'active').eq('category', a.category).neq('id', id).limit(6),
      ]);
      const simIds = sim?.map(x => x.id) || [];
      const { data: simPhotos } = simIds.length
        ? await supabase.from('fotos_anuncio').select('anuncio_id, image_url, position').in('anuncio_id', simIds).order('position')
        : { data: [] as any[] };
      const simMap = new Map<string, string>();
      (simPhotos || []).forEach(p => { if (!simMap.has(p.anuncio_id)) simMap.set(p.anuncio_id, p.image_url); });
      const avg = revs?.length ? revs.reduce((s, r) => s + r.rating, 0) / revs.length : 0;
      if (cancel) return;
      setAd(a as Ad);
      setPhotos((ph || []).map(p => p.image_url));
      setSeller(s ? { ...s, rating: avg } : null);
      setSimilar((sim || []).map(x => ({ id: x.id, title: x.title, price: Number(x.price), image: simMap.get(x.id) || null })));
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [id]);

  const handleMessage = async () => {
    if (!user) { toast.error('Faça login primeiro'); navigate('/m/auth'); return; }
    if (!ad || user.id === ad.seller_id) return;
    const { data: existing } = await supabase
      .from('conversas').select('id')
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${ad.seller_id}),and(participant_1.eq.${ad.seller_id},participant_2.eq.${user.id})`)
      .eq('anuncio_id', ad.id).maybeSingle();
    if (existing) { navigate(`/m/chat/${existing.id}`); return; }
    const { data: conv, error } = await supabase
      .from('conversas')
      .insert({ participant_1: user.id, participant_2: ad.seller_id, anuncio_id: ad.id, status: 'accepted' })
      .select('id').single();
    if (error || !conv) { toast.error('Erro ao iniciar conversa'); return; }
    navigate(`/m/chat/${conv.id}`);
  };

  const submitReport = async () => {
    if (!user || !ad || !reportReason.trim()) return;
    const { error } = await supabase.from('denuncias').insert({
      reporter_id: user.id, target_type: 'anuncio', target_id: ad.id, reason: reportReason.trim(),
    });
    if (error) toast.error('Erro ao denunciar'); else { toast.success('Denúncia enviada'); setReportOpen(false); setReportReason(''); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!ad) return <div className="p-6 text-center text-muted-foreground">Anúncio não encontrado.</div>;

  return (
    <div className="pb-8">
      <button onClick={() => navigate(-1)} className="px-4 py-3 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</button>

      <div className="relative aspect-square bg-muted">
        {photos.length > 0 ? (
          <>
            <img src={photos[photoIdx]} alt={ad.title} className="w-full h-full object-cover" />
            {photos.length > 1 && (
              <>
                <button onClick={() => setPhotoIdx((photoIdx - 1 + photos.length) % photos.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => setPhotoIdx((photoIdx + 1) % photos.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"><ChevronRight className="h-4 w-4" /></button>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
                  {photos.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === photoIdx ? 'w-6 bg-primary' : 'w-1.5 bg-white/50'}`} />)}
                </div>
              </>
            )}
          </>
        ) : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-12 w-12 text-muted-foreground" /></div>}
      </div>

      <div className="px-4 py-5 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {ad.certificate_type !== 'sem_certificado' && <MobileBadge tone="success"><ShieldCheck className="h-3 w-3" />Protegido pela loja</MobileBadge>}
          {ad.ad_type === 'troca' && <MobileBadge tone="accent"><ArrowLeftRight className="h-3 w-3" />Troca</MobileBadge>}
          <MobileBadge tone="muted">{ad.condition === 'novo' ? '✨ Novo' : '📦 Usado'}</MobileBadge>
          {ad.accepts_counteroffer && <MobileBadge tone="warning">💬 Aceita contraoferta</MobileBadge>}
        </div>

        <div>
          <h1 className="text-xl font-bold text-foreground">{ad.title}</h1>
          <p className="text-3xl font-bold text-price mt-1">R$ {ad.price.toFixed(2)}</p>
          {ad.desired_item && (
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-semibold text-accent">Procura por:</span> {ad.desired_item}
            </p>
          )}
        </div>

        {ad.description && (
          <div className="glass rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Descrição</h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">{ad.description}</p>
          </div>
        )}

        {ad.plataformas && ad.plataformas.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ad.plataformas.map(p => <MobileBadge key={p} tone="primary">{p}</MobileBadge>)}
          </div>
        )}

        {seller && (
          <div className="glass rounded-xl p-3 flex items-center gap-3">
            <Link to={`/m/perfil/${seller.id}`} className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent overflow-hidden flex items-center justify-center text-primary-foreground font-bold shrink-0">
                {seller.avatar_url ? <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" /> : seller.display_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{seller.display_name || 'Vendedor'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <HalfStarDisplay rating={seller.rating} size={11} />
                  <span className="text-[11px] text-muted-foreground">{seller.rating > 0 ? seller.rating.toFixed(1) : 'sem avaliações'}</span>
                </div>
              </div>
            </Link>
            {user && user.id !== seller.id && (
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${isFollowing ? 'bg-secondary text-foreground border border-border' : 'bg-gradient-to-r from-primary to-accent text-primary-foreground'}`}
              >
                {isFollowing ? 'Seguindo' : '+ Seguir'}
              </button>
            )}
          </div>
        )}

        {user && user.id !== ad.seller_id && (
          <div className="flex gap-2">
            <button onClick={handleMessage} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold glow-primary">
              <Send className="h-4 w-4" /> Mandar mensagem
            </button>
            <button onClick={() => setReportOpen(true)} className="px-4 rounded-xl bg-card border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors">
              <Flag className="h-4 w-4" />
            </button>
          </div>
        )}

        {similar.length > 0 && (
          <section>
            <h3 className="text-sm font-bold mb-2">Itens parecidos</h3>
            <div className="flex gap-2 overflow-x-auto scrollbar-thin -mx-4 px-4 pb-1">
              {similar.map(s => (
                <Link key={s.id} to={`/m/marketplace/${s.id}`} className="shrink-0 w-32 glass rounded-lg overflow-hidden">
                  <div className="aspect-square bg-muted">
                    {s.image ? <img src={s.image} alt={s.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-6 w-6 text-muted-foreground" /></div>}
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] font-semibold line-clamp-2 leading-tight min-h-[28px]">{s.title}</p>
                    <p className="text-xs font-bold text-price mt-0.5">R$ {s.price.toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={() => setReportOpen(false)}>
          <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="w-full bg-card rounded-t-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-base">Denunciar anúncio</h3>
            <textarea value={reportReason} onChange={e => setReportReason(e.target.value)} maxLength={500} rows={4} placeholder="Descreva o motivo da denúncia..." className="w-full p-3 rounded-lg bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-destructive/50" />
            <div className="flex gap-2">
              <button onClick={() => setReportOpen(false)} className="flex-1 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold">Cancelar</button>
              <button onClick={submitReport} className="flex-1 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold">Enviar denúncia</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
