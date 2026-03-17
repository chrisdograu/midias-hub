import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { games } from '@/lib/gameData';
import GameCard from '@/components/GameCard';
import { motion } from 'framer-motion';
import { ChevronRight, Flame, TrendingUp, Zap } from 'lucide-react';

export default function Index() {
  const featured = games.slice(0, 3);
  const bestDeals = useMemo(() => [...games].sort((a, b) => b.discount - a.discount).slice(0, 6), []);
  const topRated = useMemo(() => [...games].sort((a, b) => b.rating - a.rating).slice(0, 6), []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(170 80% 50% / 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(270 60% 55% / 0.08) 0%, transparent 50%)' }} />
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-4">
              <span className="gradient-text">MIDIAS</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Jogos digitais com os melhores preços. Entrega instantânea de chaves.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/catalogo"
                className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all glow-primary"
              >
                Ver Catálogo
              </Link>
              <Link
                to="/ofertas"
                className="px-6 py-3 bg-secondary text-secondary-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-all border border-border"
              >
                Ofertas do Dia
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Games - Large Cards */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-6">
          <Flame className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Destaques</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featured.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={`/jogo/${game.id}`} className="group block relative rounded-xl overflow-hidden aspect-[16/9]">
                <img src={game.image} alt={game.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-bold text-foreground mb-1">{game.title}</h3>
                  <div className="flex items-center gap-2">
                    {game.discount > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded">-{game.discount}%</span>
                    )}
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
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-price" />
            <h2 className="text-xl font-bold text-foreground">Melhores Ofertas</h2>
          </div>
          <Link to="/ofertas" className="text-sm text-primary hover:underline flex items-center gap-1">
            Ver todas <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {bestDeals.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>
      </section>

      {/* Top Rated */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <h2 className="text-xl font-bold text-foreground">Mais Bem Avaliados</h2>
          </div>
          <Link to="/catalogo" className="text-sm text-primary hover:underline flex items-center gap-1">
            Ver todos <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {topRated.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
