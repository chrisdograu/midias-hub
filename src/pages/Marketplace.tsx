import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnuncios } from '@/hooks/useAnuncios';
import { useAuth } from '@/hooks/useAuth';
import CertificateBadge from '@/components/CertificateBadge';
import AdFilters, { AdFilterState, defaultFilters } from '@/components/AdFilters';
import { Search, Plus, Loader2, ShoppingBag, Gamepad2, SlidersHorizontal, List } from 'lucide-react';
import { motion } from 'framer-motion';

const categoryLabels: Record<string, string> = {
  jogo_fisico: 'Jogo Físico', jogo_digital: 'Jogo Digital', console: 'Console', acessorio: 'Acessório',
};

export default function Marketplace() {
  const { anuncios, isLoading } = useAnuncios();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AdFilterState>(defaultFilters);

  const filtered = anuncios.filter(a => {
    if (query && !a.title.toLowerCase().includes(query.toLowerCase()) && !a.game_title.toLowerCase().includes(query.toLowerCase())) return false;
    if (filters.adType && (a as any).ad_type !== filters.adType) return false;
    if (filters.category && (a as any).category !== filters.category) return false;
    if (filters.platform && a.platform !== filters.platform) return false;
    if (filters.condition && a.condition !== filters.condition) return false;
    if (filters.certificate && (a as any).certificate_type !== filters.certificate) return false;
    if (filters.minPrice && Number(a.price) < Number(filters.minPrice)) return false;
    if (filters.maxPrice && Number(a.price) > Number(filters.maxPrice)) return false;
    return true;
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
        </div>
        <div className="flex gap-2">
          {user && (
            <>
              <Link to="/marketplace/meus-anuncios" className="px-3 py-2 text-sm bg-secondary border border-border rounded-lg hover:bg-secondary/80 transition-colors text-foreground flex items-center gap-1">
                <List className="h-4 w-4" /> Meus
              </Link>
              <Link to="/marketplace/criar" className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-1">
                <Plus className="h-4 w-4" /> Anunciar
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Search + filter toggle */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar anúncios..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-2.5 rounded-lg border transition-colors ${showFilters ? 'bg-primary/15 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Type quick filter */}
      <div className="flex gap-2 mb-4">
        {[
          { value: '', label: 'Todos' },
          { value: 'venda', label: '💰 Vendas' },
          { value: 'troca', label: '🔄 Trocas' },
        ].map(t => (
          <button key={t.value} onClick={() => setFilters(f => ({ ...f, adType: t.value }))}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filters.adType === t.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters panel */}
      {showFilters && <div className="mb-4"><AdFilters filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} /></div>}

      {/* Ads grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Gamepad2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Nenhum anúncio encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}>
              <Link to={`/marketplace/${a.id}`}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-all block">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${(a as any).ad_type === 'troca' ? 'bg-accent/20 text-accent' : 'bg-primary/15 text-primary'}`}>
                        {(a as any).ad_type === 'troca' ? '🔄 Troca' : '💰 Venda'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{categoryLabels[(a as any).category] || (a as any).category}</span>
                    </div>
                    <h3 className="font-semibold text-foreground line-clamp-1">{a.title}</h3>
                    <p className="text-xs text-muted-foreground">{a.game_title}</p>
                  </div>
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded shrink-0 ml-2">{a.condition}</span>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{a.description}</p>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{a.platform}</span>
                  {(a as any).ad_type === 'venda' ? (
                    <span className="text-lg font-bold text-price">R$ {Number(a.price).toFixed(2)}</span>
                  ) : (
                    <span className="text-xs text-accent font-medium">Aceita troca</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-primary">{((a.profiles as any)?.display_name || 'U')[0].toUpperCase()}</span>
                    </div>
                    {(a.profiles as any)?.display_name || 'Vendedor'}
                  </div>
                  <CertificateBadge type={(a as any).certificate_type || 'sem_certificado'} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
