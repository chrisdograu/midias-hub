import { useMemo } from 'react';
import { useProdutos } from '@/hooks/useProdutos';
import GameCard from '@/components/GameCard';
import { Zap, Loader2 } from 'lucide-react';

export default function Ofertas() {
  const { data: games = [], isLoading } = useProdutos();
  const deals = useMemo(() => [...games].sort((a, b) => b.discount - a.discount), [games]);

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-6 w-6 text-price" />
        <h1 className="text-2xl font-bold text-foreground">Ofertas Especiais</h1>
      </div>
      <p className="text-muted-foreground mb-8">Os melhores descontos em jogos digitais. Aproveite antes que acabe!</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {deals.map((game, i) => <GameCard key={game.id} game={game} index={i} />)}
      </div>
    </div>
  );
}
