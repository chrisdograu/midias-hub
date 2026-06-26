import { Link } from 'react-router-dom';
import { Game } from '@/lib/gameData';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart } from 'lucide-react';
import { HalfStarDisplay } from '@/components/HalfStarRating';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { usePrefetchRoute } from '@/hooks/usePrefetchRoute';
import { supabase } from '@/integrations/supabase/client';
import { mapProdutoToGame } from '@/lib/gameData';

interface GameCardProps {
  game: Game;
  index?: number;
}

function platformClass(p: string) {
  const k = p.toLowerCase();
  if (k.includes('ps') || k.includes('playstation')) return 'platform-ps';
  if (k.includes('xbox')) return 'platform-xbox';
  if (k.includes('switch') || k.includes('nintendo')) return 'platform-switch';
  if (k.includes('pc') || k.includes('steam') || k.includes('win')) return 'platform-pc';
  return '';
}

export default function GameCard({ game, index = 0 }: GameCardProps) {
  const { addItem } = useCart();
  const outOfStock = game.stock <= 0;
  const qc = useQueryClient();
  const prefetchRoute = usePrefetchRoute();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) { toast.error('Produto fora de estoque'); return; }
    addItem(game);
    toast.success(`${game.title} adicionado ao carrinho!`);
  };

  // Pré-carrega chunk da GameDetail + dados do produto na cache do React Query
  const handlePrefetch = () => {
    prefetchRoute('/jogo');
    qc.prefetchQuery({
      queryKey: ['produto', game.id],
      queryFn: async () => {
        const { data } = await supabase.from('produtos').select('*').eq('id', game.id).maybeSingle();
        return data ? mapProdutoToGame(data) : null;
      },
      staleTime: 60_000,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link
        to={`/jogo/${game.id}`}
        className="group block"
        onMouseEnter={handlePrefetch}
        onTouchStart={handlePrefetch}
      >
        <div className={`neon-border-hover relative bg-card rounded-lg overflow-hidden border border-border transition-all duration-300 ${outOfStock ? 'opacity-60' : ''}`}>
          <div className="relative aspect-[3/4] overflow-hidden">
            <img src={game.image} alt={game.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {game.discount > 0 && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md z-10">
                -{game.discount}%
              </div>
            )}

            {outOfStock && (
              <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-md z-10">
                Esgotado
              </div>
            )}

            {!outOfStock && (
              <button onClick={handleAddToCart}
                className="absolute top-2 right-2 p-2 bg-card/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground z-10">
                <ShoppingCart className="h-4 w-4" />
              </button>
            )}

            <div className="absolute bottom-2 left-2 flex gap-1 z-10">
              {game.platform.map(p => (
                <span key={p} className={`platform-pill ${platformClass(p)}`}>{p}</span>
              ))}
            </div>
          </div>

          <div className="p-3 relative z-[2]">
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight mb-1 group-hover:text-primary transition-colors">
              {game.title}
            </h3>
            <div className="flex items-center gap-1 mb-1">
              <HalfStarDisplay rating={game.rating} size={12} />
              <span className="text-[10px] text-muted-foreground">{game.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-lg font-bold text-price">R$ {game.price.toFixed(2)}</span>
              {game.originalPrice > game.price && (
                <span className="text-xs text-muted-foreground line-through">R$ {game.originalPrice.toFixed(2)}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
