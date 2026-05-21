import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Loader2, ShoppingBag, ShieldCheck, ArrowLeftRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo } from '@/mobile/lib/time';

interface FavAd {
  id: string; title: string; price: number; ad_type: string; certificate_type: string;
  created_at: string; image: string | null; seller_name: string;
}

export default function MFavoritos() {
  const { user } = useAuth();
  const [ads, setAds] = useState<FavAd[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) { setAds([]); setLoading(false); return; }
    setLoading(true);
    const { data: favs } = await supabase
      .from('favoritos_anuncio').select('anuncio_id').eq('user_id', user.id);
    const ids = (favs || []).map(f => f.anuncio_id);
    if (!ids.length) { setAds([]); setLoading(false); return; }
    const { data: list } = await supabase
      .from('anuncios').select('*').in('id', ids).eq('status', 'active');
    const sellerIds = [...new Set((list || []).map(a => a.seller_id))];
    const [{ data: photos }, { data: profiles }] = await Promise.all([
      supabase.from('fotos_anuncio').select('anuncio_id, image_url, position').in('anuncio_id', ids).order('position'),
      sellerIds.length ? supabase.from('profiles').select('id, display_name').in('id', sellerIds) : Promise.resolve({ data: [] as any[] }),
    ]);
    const photo = new Map<string, string>();
    photos?.forEach(p => { if (!photo.has(p.anuncio_id)) photo.set(p.anuncio_id, p.image_url); });
    const seller = new Map((profiles || []).map(p => [p.id, p.display_name || 'Vendedor']));
    setAds((list || []).map(a => ({
      id: a.id, title: a.title, price: Number(a.price), ad_type: a.ad_type,
      certificate_type: a.certificate_type, created_at: a.created_at,
      image: photo.get(a.id) || null, seller_name: seller.get(a.seller_id) || 'Vendedor',
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const remove = async (anuncioId: string) => {
    if (!user) return;
    await supabase.from('favoritos_anuncio').delete().eq('user_id', user.id).eq('anuncio_id', anuncioId);
    setAds(prev => prev.filter(a => a.id !== anuncioId));
  };

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold gradient-text flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary fill-primary" /> Favoritos
        </h1>
        <span className="text-xs text-muted-foreground">{ads.length} anúncio{ads.length === 1 ? '' : 's'}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : ads.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Heart className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum anúncio salvo ainda.</p>
          <Link to="/m/marketplace" className="inline-block mt-3 text-xs font-semibold text-primary">Explorar marketplace</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {ads.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}>
              <div className="relative glass rounded-xl overflow-hidden">
                <Link to={`/m/marketplace/${a.id}`}>
                  <div className="aspect-[3/4] bg-muted relative overflow-hidden">
                    {a.image
                      ? <img src={a.image} alt={a.title} loading="lazy" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-8 w-8 text-muted-foreground" /></div>}
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                    <div className="absolute top-1.5 left-1.5 right-1.5 flex flex-wrap gap-1">
                      {a.certificate_type !== 'sem_certificado' && (
                        <span className="backdrop-blur-md bg-success/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><ShieldCheck className="h-2.5 w-2.5" />Protegido</span>
                      )}
                      {a.ad_type === 'troca' && (
                        <span className="backdrop-blur-md bg-accent/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><ArrowLeftRight className="h-2.5 w-2.5" />Troca</span>
                      )}
                    </div>
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight min-h-[2rem]">{a.title}</p>
                    <p className="text-base font-bold text-price mt-1">{a.ad_type === 'troca' ? 'Troca' : `R$ ${a.price.toFixed(2)}`}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{a.seller_name} · {timeAgo(a.created_at)}</p>
                  </div>
                </Link>
                <button onClick={() => remove(a.id)} type="button"
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center hover:bg-destructive/80 transition-colors"
                  aria-label="Remover dos favoritos">
                  <Heart className="h-3.5 w-3.5 text-white fill-white" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
