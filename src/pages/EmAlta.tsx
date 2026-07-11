import { Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRadarDelta } from '@/hooks/useRadarDelta';
import { GameCardGridSkeleton } from '@/components/skeletons';

/**
 * "Em Alta" agora usa a MESMA fórmula do Radar Delta da Home
 * (views_24h + posts_72h + reviews_7d ponderados), garantindo
 * paridade semântica entre Órbita e Em Alta.
 */
export default function EmAlta() {
  const { data: items = [], isLoading, isError } = useRadarDelta(24);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Flame className="h-7 w-7 text-orange-500" />
        <div>
          <h1 className="text-3xl font-display font-bold">Em Alta</h1>
          <p className="text-muted-foreground text-sm">
            Ranking geral da comunidade — mesma fórmula ponderada do Radar da Home (views_24h + posts_72h + reviews recentes).
          </p>
        </div>
      </div>

      {isLoading ? (
        <GameCardGridSkeleton count={10} />
      ) : isError ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm mb-3">Não conseguimos carregar as tendências agora.</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
          >
            Tentar novamente
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Flame className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm mb-3">Sem tendências ainda — dê o primeiro sinal explorando o catálogo.</p>
          <Link to="/catalogo" className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map(item => (
            <Link
              key={item.product_id}
              to={`/jogo/${item.product_id}`}
              className="group rounded-xl overflow-hidden border border-border bg-card hover:border-primary transition-all"
            >
              <div className="aspect-[3/4] bg-muted overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">🎮</div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>
                <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                  <Flame className="h-3 w-3" />
                  {item.evidence}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
