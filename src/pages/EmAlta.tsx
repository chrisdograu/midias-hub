import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapProdutoToGame } from '@/lib/gameData';
import GameCard from '@/components/GameCard';
import { Flame } from 'lucide-react';
import { GameCardGridSkeleton } from '@/components/skeletons';
import { Link } from 'react-router-dom';

async function fetchEmAlta() {
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: views } = await supabase
    .from('product_views' as any)
    .select('product_id')
    .gte('viewed_at', since);
  const counts = new Map<string, number>();
  ((views as any) || []).forEach((v: any) => counts.set(v.product_id, (counts.get(v.product_id) || 0) + 1));
  const ids = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24).map(x => x[0]);
  let prods: any[] = [];
  if (ids.length) {
    const { data } = await supabase.from('produtos').select('*').in('id', ids).eq('is_active', true).eq('awaiting_first_stock', false);
    prods = (data || []).sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0));
  } else {
    const { data } = await supabase.from('produtos').select('*').eq('is_active', true).eq('awaiting_first_stock', false).order('rating', { ascending: false }).limit(24);
    prods = data || [];
  }
  return prods.map(mapProdutoToGame);
}

export default function EmAlta() {
  const { data: games = [], isLoading } = useQuery({
    queryKey: ['em-alta', 7],
    queryFn: fetchEmAlta,
    staleTime: 60_000,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Flame className="h-7 w-7 text-orange-500" />
        <div>
          <h1 className="text-3xl font-display font-bold">Em Alta</h1>
          <p className="text-muted-foreground text-sm">Jogos mais acessados nos últimos 7 dias</p>
        </div>
      </div>
      {isLoading ? <GameCardGridSkeleton count={10} /> : games.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Flame className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm mb-3">Sem dados de tendências ainda.</p>
          <Link to="/catalogo" className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">Explorar catálogo</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {games.map(g => <GameCard key={g.id} game={g} />)}
        </div>
      )}
    </div>
  );
}
