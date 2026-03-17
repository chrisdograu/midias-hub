import { useMemo } from 'react';
import { games } from '@/lib/gameData';
import GameCard from '@/components/GameCard';
import { Zap } from 'lucide-react';

export default function Ofertas() {
  const deals = useMemo(() => [...games].sort((a, b) => b.discount - a.discount), []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-6 w-6 text-price" />
        <h1 className="text-2xl font-bold text-foreground">Ofertas Especiais</h1>
      </div>
      <p className="text-muted-foreground mb-8">Os melhores descontos em jogos digitais. Aproveite antes que acabe!</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {deals.map((game, i) => (
          <GameCard key={game.id} game={game} index={i} />
        ))}
      </div>
    </div>
  );
}
