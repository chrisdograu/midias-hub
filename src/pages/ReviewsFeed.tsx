import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProdutos } from '@/hooks/useProdutos';
import { HalfStarDisplay } from '@/components/HalfStarRating';
import { Search, Loader2, Star, TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { categories, platforms } from '@/lib/gameData';

export default function ReviewsFeed() {
  const { data: games = [], isLoading } = useProdutos();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todos');
  const [platform, setPlatform] = useState('Todos');
  const [sort, setSort] = useState<'rating' | 'recent' | 'popular'>('rating');

  const filtered = games
    .filter(g => g.title.toLowerCase().includes(query.toLowerCase()))
    .filter(g => category === 'Todos' || g.category === category)
    .filter(g => platform === 'Todos' || g.platform.includes(platform))
    .sort((a, b) => {
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'recent') return b.releaseDate.localeCompare(a.releaseDate);
      return b.rating - a.rating; // popular fallback
    });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar jogos..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-thin">
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${category === c ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
            {c}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin">
        {platforms.map(p => (
          <button key={p} onClick={() => setPlatform(p)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${platform === p ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
            {p}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setSort('rating')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sort === 'rating' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
          <Star className="h-3 w-3" /> Mais avaliados
        </button>
        <button onClick={() => setSort('recent')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sort === 'recent' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
          <Sparkles className="h-3 w-3" /> Recentes
        </button>
        <button onClick={() => setSort('popular')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sort === 'popular' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
          <TrendingUp className="h-3 w-3" /> Populares
        </button>
      </div>

      {/* Games grid */}
      {filtered.length === 0 ? (
        <p className="text-center py-16 text-muted-foreground">Nenhum jogo encontrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((game, i) => (
            <motion.div key={game.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}>
              <Link to={`/reviews/${game.id}`}
                className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all block group">
                <div className="aspect-video relative overflow-hidden">
                  <img src={game.image} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm line-clamp-1">{game.title}</h3>
                      <p className="text-[10px] text-muted-foreground">{game.publisher}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-card/80 backdrop-blur-sm rounded-md px-2 py-1">
                      <Star className="h-3 w-3 text-price fill-price" />
                      <span className="text-xs font-bold text-foreground">{game.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <HalfStarDisplay rating={game.rating} size={12} />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {game.platform.slice(0, 3).map(p => (
                      <span key={p} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">{p}</span>
                    ))}
                    <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded">{game.category}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
