import { Link } from 'react-router-dom';
import { useFavoritos } from '@/hooks/useFavoritos';
import { useProdutos } from '@/hooks/useProdutos';
import GameCard from '@/components/GameCard';
import { Heart, Loader2, ArrowLeft } from 'lucide-react';

export default function Favoritos() {
  const { favoritos, loading } = useFavoritos();
  const { data: games = [], isLoading } = useProdutos();
  const favGames = games.filter(g => favoritos.includes(g.id));

  if (loading || isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-6">Meus Favoritos</h1>

      {favGames.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Nenhum favorito ainda.</p>
          <Link to="/catalogo" className="text-primary hover:underline mt-2 inline-block">Explorar catálogo</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {favGames.map((game, i) => <GameCard key={game.id} game={game} index={i} />)}
        </div>
      )}
    </div>
  );
}
