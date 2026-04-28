import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, Loader2, Tag, ShieldCheck, ArrowLeftRight, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { MobileChip, MobileBadge } from '@/mobile/lib/badge';
import { timeAgo } from '@/mobile/lib/time';

interface Ad {
  id: string; title: string; price: number; ad_type: string; condition: string;
  certificate_type: string; created_at: string; seller_id: string;
  category: string; plataformas: string[] | null; image: string | null;
  seller_name: string;
}

const TYPE_FILTERS = [
  { id: 'all', label: 'Tudo' },
  { id: 'venda', label: '💰 Venda' },
  { id: 'troca', label: '🔄 Troca' },
] as const;

export default function MMarketplace() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<typeof TYPE_FILTERS[number]['id']>('all');
  const [onlyProtected, setOnlyProtected] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data: list } = await supabase
        .from('anuncios').select('*').eq('status', 'active')
        .order('created_at', { ascending: false }).limit(60);
      if (!list) { if (!cancel) { setAds([]); setLoading(false); } return; }

      const ids = list.map(a => a.id);
      const sellers = [...new Set(list.map(a => a.seller_id))];
      const [{ data: photos }, { data: profiles }] = await Promise.all([
        supabase.from('fotos_anuncio').select('anuncio_id, image_url, position').in('anuncio_id', ids).order('position'),
        supabase.from('profiles').select('id, display_name').in('id', sellers),
      ]);
      const photo = new Map<string, string>();
      photos?.forEach(p => { if (!photo.has(p.anuncio_id)) photo.set(p.anuncio_id, p.image_url); });
      const seller = new Map((profiles || []).map(p => [p.id, p.display_name || 'Vendedor']));

      if (!cancel) {
        setAds(list.map(a => ({
          id: a.id, title: a.title, price: Number(a.price), ad_type: a.ad_type,
          condition: a.condition, certificate_type: a.certificate_type, created_at: a.created_at,
          seller_id: a.seller_id, category: a.category, plataformas: a.plataformas,
          image: photo.get(a.id) || null, seller_name: seller.get(a.seller_id) || 'Vendedor',
        })));
        setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  const filtered = useMemo(() => ads.filter(a => {
    const q = query.trim().toLowerCase();
    if (q && !a.title.toLowerCase().includes(q)) return false;
    if (type !== 'all' && a.ad_type !== type) return false;
    if (onlyProtected && a.certificate_type === 'sem_certificado') return false;
    return true;
  }), [ads, query, type, onlyProtected]);

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold gradient-text">Marketplace</h1>
        <Link to="/m/anuncio/novo" className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground glow-primary">
          <Plus className="h-3.5 w-3.5" /> Anunciar
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Buscar jogos, consoles, acessórios..."
          className="w-full pl-10 pr-3 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-thin -mx-4 px-4">
        {TYPE_FILTERS.map(f => <MobileChip key={f.id} active={type === f.id} onClick={() => setType(f.id)}>{f.label}</MobileChip>)}
        <MobileChip active={onlyProtected} onClick={() => setOnlyProtected(v => !v)}>🛡️ Protegidos</MobileChip>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum anúncio encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <Link to={`/m/marketplace/${a.id}`} className="block glass rounded-xl overflow-hidden hover:border-primary/40 transition-colors">
                <div className="aspect-square bg-muted relative">
                  {a.image
                    ? <img src={a.image} alt={a.title} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-8 w-8 text-muted-foreground" /></div>}
                  <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                    {a.certificate_type !== 'sem_certificado' && (
                      <span className="bg-success/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"><ShieldCheck className="h-2.5 w-2.5" />Protegido</span>
                    )}
                    {a.ad_type === 'troca' && (
                      <span className="bg-accent/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"><ArrowLeftRight className="h-2.5 w-2.5" />Troca</span>
                    )}
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight min-h-[2rem]">{a.title}</p>
                  <p className="text-base font-bold text-price mt-1">R$ {a.price.toFixed(2)}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{a.seller_name} · {timeAgo(a.created_at)}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
