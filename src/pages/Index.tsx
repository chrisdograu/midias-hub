import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProdutos } from '@/hooks/useProdutos';
import GameCard from '@/components/GameCard';
import { motion } from 'framer-motion';
import { ChevronRight, Flame, TrendingUp, Zap, Loader2, Sparkles, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FlashPromo { id: string; product_id: string; discount_percent: number; ends_at: string; }

export default function Index() {
  const { data: games = [], isLoading } = useProdutos();
  const inStock = useMemo(() => games.filter(g => g.stock > 0), [games]);
  const featured = inStock.slice(0, 3);
  const bestDeals = useMemo(() => [...inStock].sort((a, b) => b.discount - a.discount).slice(0, 6), [inStock]);
  const topRated = useMemo(() => [...inStock].sort((a, b) => b.rating - a.rating).slice(0, 6), [inStock]);

  // Daily Pick: deterministic by date — pick from inStock based on day-of-year
  const dailyPick = useMemo(() => {
    if (inStock.length === 0) return null;
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return inStock[dayOfYear % inStock.length];
  }, [inStock]);

  // Active flash promo
  const [flashPromo, setFlashPromo] = useState<{ promo: FlashPromo; product: typeof games[0] } | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('flash_promotions')
        .select('id, product_id, discount_percent, ends_at')
        .eq('is_active', true)
        .gt('ends_at', new Date().toISOString())
        .order('ends_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data) {
        const product = inStock.find(g => g.id === data.product_id);
        if (product) setFlashPromo({ promo: data as FlashPromo, product });
      }
    })();
  }, [inStock.length]);


  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(170 80% 50% / 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(270 60% 55% / 0.08) 0%, transparent 50%)' }} />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto">
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-4"><span className="gradient-text">MIDIAS</span></h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">Jogos digitais com os melhores preços. Entrega instantânea de chaves.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/catalogo" className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all glow-primary">Ver Catálogo</Link>
              <Link to="/ofertas" className="px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-all border border-border">Ofertas do Dia</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Flash Promo banner */}
      {flashPromo && (() => {
        const remainingMs = new Date(flashPromo.promo.ends_at).getTime() - now;
        if (remainingMs <= 0) return null;
        const h = Math.floor(remainingMs / 3600000);
        const m = Math.floor((remainingMs % 3600000) / 60000);
        const s = Math.floor((remainingMs % 60000) / 1000);
        return (
          <section className="container mx-auto px-4 -mt-4">
            <Link to={`/jogo/${flashPromo.product.id}`} className="block">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative overflow-hidden rounded-xl bg-gradient-to-r from-price/20 via-price/10 to-accent/10 border border-price/40 p-4 md:p-6 flex items-center gap-4">
                <div className="bg-price text-price-foreground rounded-lg px-3 py-2 font-bold text-sm flex items-center gap-1"><Zap className="h-4 w-4" /> RELÂMPAGO</div>
                <img src={flashPromo.product.image} alt={flashPromo.product.title} className="w-16 h-20 object-cover rounded hidden sm:block" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">{flashPromo.product.title}</h3>
                  <p className="text-sm text-muted-foreground">-{flashPromo.promo.discount_percent}% por tempo limitado</p>
                </div>
                <div className="flex items-center gap-2 text-price font-mono font-bold tabular-nums">
                  <Clock className="h-4 w-4" />
                  {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
                </div>
              </motion.div>
            </Link>
          </section>
        );
      })()}

      {/* Daily Pick */}
      {dailyPick && (
        <section className="container mx-auto px-4 pt-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-bold text-foreground">Escolha do Dia</h2>
          </div>
          <Link to={`/jogo/${dailyPick.id}`} className="group block relative rounded-2xl overflow-hidden aspect-[21/9] md:aspect-[3/1]">
            <img src={dailyPick.image} alt={dailyPick.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <span className="inline-block bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded mb-2">PICK DO DIA</span>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-1">{dailyPick.title}</h3>
              <div className="flex items-center gap-3">
                {dailyPick.discount > 0 && <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">-{dailyPick.discount}%</span>}
                <span className="text-price font-bold text-lg">R$ {dailyPick.price.toFixed(2)}</span>
              </div>
            </div>
          </Link>
        </section>
      )}

      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-6">
          <Flame className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Destaques</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featured.map((game, i) => (
            <motion.div key={game.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Link to={`/jogo/${game.id}`} className="group block relative rounded-xl overflow-hidden aspect-[16/9]">
                <img src={game.image} alt={game.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-bold text-white mb-1">{game.title}</h3>
                  <div className="flex items-center gap-2">
                    {game.discount > 0 && <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">-{game.discount}%</span>}
                    <span className="text-price font-bold">R$ {game.price.toFixed(2)}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Best Deals */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2"><Zap className="h-5 w-5 text-price" /><h2 className="text-xl font-bold text-foreground">Melhores Ofertas</h2></div>
          <Link to="/ofertas" className="text-sm text-primary hover:underline flex items-center gap-1">Ver todas <ChevronRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {bestDeals.map((game, i) => <GameCard key={game.id} game={game} index={i} />)}
        </div>
      </section>

      {/* Top Rated */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-success" /><h2 className="text-xl font-bold text-foreground">Mais Bem Avaliados</h2></div>
          <Link to="/catalogo" className="text-sm text-primary hover:underline flex items-center gap-1">Ver todos <ChevronRight className="h-4 w-4" /></Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {topRated.map((game, i) => <GameCard key={game.id} game={game} index={i} />)}
        </div>
      </section>
    </div>
  );
}
