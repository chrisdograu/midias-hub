import { useParams, Link } from 'react-router-dom';
import { games } from '@/lib/gameData';
import { useCart } from '@/lib/cartStore';
import { ShoppingCart, Star, ArrowLeft, Shield, Zap, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import GameCard from '@/components/GameCard';
import { useMemo } from 'react';

export default function GameDetail() {
  const { id } = useParams();
  const game = games.find(g => g.id === id);
  const { addItem } = useCart();

  const related = useMemo(() => {
    if (!game) return [];
    return games.filter(g => g.id !== game.id && g.category === game.category).slice(0, 4);
  }, [game]);

  if (!game) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-xl text-muted-foreground">Jogo não encontrado.</p>
        <Link to="/catalogo" className="text-primary hover:underline mt-4 inline-block">Voltar ao catálogo</Link>
      </div>
    );
  }

  const handleAdd = () => {
    addItem(game);
    toast.success(`${game.title} adicionado ao carrinho!`);
  };

  const installments = Math.ceil(game.price / 10) > 12 ? 12 : Math.ceil(game.price / 10) < 2 ? 2 : Math.ceil(game.price / 10);
  const installmentValue = (game.price / installments).toFixed(2);

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/catalogo" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <div className="relative rounded-xl overflow-hidden aspect-video">
            <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
        </motion.div>

        {/* Info panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {game.platform.map(p => (
                <span key={p} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">{p}</span>
              ))}
              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">{game.category}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{game.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{game.publisher}</p>
          </div>

          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < Math.floor(game.rating) ? 'text-price fill-price' : 'text-muted-foreground'}`} />
            ))}
            <span className="text-sm text-muted-foreground ml-1">{game.rating}</span>
          </div>

          {/* Price card */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            {game.discount > 0 && (
              <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground text-sm font-bold px-2 py-1 rounded">-{game.discount}%</span>
                <span className="text-muted-foreground line-through text-sm">R$ {game.originalPrice.toFixed(2)}</span>
              </div>
            )}
            <div className="text-3xl font-bold text-price">R$ {game.price.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              ou {installments}x de R$ {installmentValue} sem juros
            </p>

            <button
              onClick={handleAdd}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all glow-primary"
            >
              <ShoppingCart className="h-5 w-5" /> Adicionar ao Carrinho
            </button>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-primary" /> Entrega instantânea por e-mail
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-3.5 w-3.5 text-success" /> Garantia de 30 dias
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-warning" /> Suporte 24/7
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Description */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Sobre o Jogo</h2>
          <p className="text-muted-foreground leading-relaxed">{game.description}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {game.tags.map(tag => (
              <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Detalhes</h2>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Publicadora</span><span className="text-foreground">{game.publisher}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Lançamento</span><span className="text-foreground">{new Date(game.releaseDate).toLocaleDateString('pt-BR')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span className="text-foreground">{game.category}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Plataformas</span><span className="text-foreground">{game.platform.join(', ')}</span></div>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-bold text-foreground mb-4">Jogos Relacionados</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {related.map((g, i) => <GameCard key={g.id} game={g} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
