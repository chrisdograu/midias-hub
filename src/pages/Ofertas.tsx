import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProdutos } from '@/hooks/useProdutos';
import GameCard from '@/components/GameCard';
import { Zap } from 'lucide-react';
import { GameCardGridSkeleton } from '@/components/skeletons';

export default function Ofertas() {
  const { data: games = [], isLoading } = useProdutos();
  // Filtro exclusivo desta página: desconto mínimo em %
  const [minDiscount, setMinDiscount] = useState(0);

  const deals = useMemo(
    () => games.filter(g => g.discount > 0 && g.discount >= minDiscount)
                .sort((a, b) => b.discount - a.discount),
    [games, minDiscount]
  );

  if (isLoading) return <div className="container mx-auto px-4 py-8"><GameCardGridSkeleton count={12} /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-6 w-6 text-price" />
        <h1 className="text-2xl font-bold text-foreground">Ofertas Especiais</h1>
      </div>
      <p className="text-muted-foreground mb-6">Os melhores descontos em jogos digitais. Aproveite antes que acabe!</p>

      <div className="mb-6 max-w-md">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-muted-foreground">Desconto mínimo</label>
          <span className="text-xs text-muted-foreground">{minDiscount}%+</span>
        </div>
        <input
          type="range" min={0} max={90} step={5}
          value={minDiscount}
          onChange={e => setMinDiscount(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {deals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">Sem ofertas com esse desconto mínimo.</p>
          <Link to="/catalogo" className="inline-block mt-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90">Ver catálogo completo</Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">{deals.length} ofertas encontradas</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {deals.map((game, i) => <GameCard key={game.id} game={game} index={i} />)}
          </div>
        </>
      )}
    </div>
  );
}
