import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { games, categories, platforms } from '@/lib/gameData';
import GameCard from '@/components/GameCard';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function Catalogo() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState('Todos');
  const [platform, setPlatform] = useState('Todos');
  const [sortBy, setSortBy] = useState('relevance');

  const filtered = useMemo(() => {
    let result = games.filter(g => {
      const matchQuery = !query || g.title.toLowerCase().includes(query.toLowerCase()) || g.tags.some(t => t.toLowerCase().includes(query.toLowerCase()));
      const matchCat = category === 'Todos' || g.category === category;
      const matchPlat = platform === 'Todos' || g.platform.includes(platform);
      return matchQuery && matchCat && matchPlat;
    });

    switch (sortBy) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'discount': result.sort((a, b) => b.discount - a.discount); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
    }
    return result;
  }, [query, category, platform, sortBy]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Catálogo de Jogos</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nome ou tag..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            className="px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="relevance">Relevância</option>
            <option value="price-asc">Menor Preço</option>
            <option value="price-desc">Maior Preço</option>
            <option value="discount">Maior Desconto</option>
            <option value="rating">Melhor Avaliação</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <p className="text-sm text-muted-foreground mb-4">{filtered.length} jogos encontrados</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filtered.map((game, i) => (
          <GameCard key={game.id} game={game} index={i} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">Nenhum jogo encontrado.</p>
          <p className="text-sm mt-1">Tente ajustar os filtros ou buscar por outro termo.</p>
        </div>
      )}
    </div>
  );
}
