import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { mapProdutoToGame, Game } from '@/lib/gameData';
import GameCard from '@/components/GameCard';
import { Sparkles, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ParaVoce() {
  const { user } = useAuth();
  const [byGenre, setByGenre] = useState<Record<string, Game[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data: lib } = await supabase
        .from('biblioteca_usuario')
        .select('product_id, produtos(category)')
        .eq('user_id', user.id);
      const counts = new Map<string, number>();
      const ownedIds = new Set<string>();
      ((lib as any) || []).forEach((r: any) => {
        ownedIds.add(r.product_id);
        const c = r.produtos?.category;
        if (c) counts.set(c, (counts.get(c) || 0) + 1);
      });
      const topGenres = [...counts.entries()].filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => x[0]);
      const result: Record<string, Game[]> = {};
      for (const g of topGenres) {
        const { data } = await supabase.from('produtos').select('*').eq('category', g).eq('is_active', true).eq('awaiting_first_stock', false).order('rating', { ascending: false }).limit(10);
        result[g] = (data || []).filter(p => !ownedIds.has(p.id)).map(mapProdutoToGame);
      }
      setByGenre(result);
      setLoading(false);
    })();
  }, [user]);

  if (!user) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Pra Você</h1>
      <p className="text-muted-foreground mb-4">Entre para ver recomendações baseadas na sua biblioteca.</p>
      <Link to="/auth" className="text-primary hover:underline">Entrar</Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-display font-bold">Pra Você</h1>
          <p className="text-muted-foreground text-sm">Recomendações baseadas nos seus gêneros favoritos</p>
        </div>
      </div>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div> :
        Object.keys(byGenre).length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Tenha pelo menos 3 jogos do mesmo gênero na biblioteca para ver recomendações personalizadas.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(byGenre).map(([genre, games]) => (
              <section key={genre}>
                <h2 className="text-xl font-semibold mb-4">Porque você curte <span className="text-primary">{genre}</span></h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {games.slice(0, 5).map(g => (
                    <div key={g.id} className="space-y-1">
                      <GameCard game={g} />
                      <p className="text-xs text-primary/80 italic px-1">
                        Porque você curte {genre.toLowerCase()}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
    </div>
  );
}
