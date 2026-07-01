import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProdutos } from '@/hooks/useProdutos';
import GameCard from '@/components/GameCard';
import { Zap } from 'lucide-react';
import { GameCardGridSkeleton } from '@/components/skeletons';

export default function Ofertas() {
  const { data: games = [], isLoading } = useProdutos();
  const deals = useMemo(() => games.filter(g => g.discount > 0).sort((a, b) => b.discount - a.discount), [games]);

  if (isLoading) return <div className="container mx-auto px-4 py-8"><GameCardGridSkeleton count={12} /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-6 w-6 text-price" />
        <h1 className="text-2xl font-bold text-foreground">Ofertas Especiais</h1>
      </div>
      <p className="text-muted-foreground mb-8">Os melhores descontos em jogos digitais. Aproveite antes que acabe!</p>
      {deals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">Sem ofertas ativas no momento.</p>
          <Link to="/catalogo" className="inline-block mt-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90">Ver catálogo completo</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {deals.map((game, i) => <GameCard key={game.id} game={game} index={i} />)}
        </div>
      )}
    </div>
  );
}
