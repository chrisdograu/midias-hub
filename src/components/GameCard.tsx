import { Link } from 'react-router-dom';
import { Game } from '@/lib/gameData';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface GameCardProps {
  game: Game;
  index?: number;
}

export default function GameCard({ game, index = 0 }: GameCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(game);
    toast.success(`${game.title} adicionado ao carrinho!`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link to={`/jogo/${game.id}`} className="group block">
        <div className="relative bg-card rounded-lg overflow-hidden border border-border hover:border-primary/40 transition-all duration-300 hover:glow-primary">
          {/* Image */}
          <div className="relative aspect-[3/4] overflow-hidden">
            <img
              src={game.image}
              alt={game.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />

            {/* Discount badge */}
            {game.discount > 0 && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-md">
                -{game.discount}%
              </div>
            )}

            {/* Quick add */}
            <button
              onClick={handleAddToCart}
              className="absolute top-2 right-2 p-2 bg-card/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>

            {/* Platforms */}
            <div className="absolute bottom-2 left-2 flex gap-1">
              {game.platform.map(p => (
                <span key={p} className="text-[10px] bg-card/70 backdrop-blur-sm text-muted-foreground px-1.5 py-0.5 rounded">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight mb-2 group-hover:text-primary transition-colors">
              {game.title}
            </h3>
            <div className="flex items-end gap-2">
              <span className="text-lg font-bold text-price">
                R$ {game.price.toFixed(2)}
              </span>
              {game.originalPrice > game.price && (
                <span className="text-xs text-muted-foreground line-through">
                  R$ {game.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
