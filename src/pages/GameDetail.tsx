import { useParams, Link } from 'react-router-dom';
import { useProduto, useProdutos } from '@/hooks/useProdutos';
import { useCart } from '@/hooks/useCart';
import { useFavoritos } from '@/hooks/useFavoritos';
import { useAvaliacoes } from '@/hooks/useAvaliacoes';
import { useAuth } from '@/hooks/useAuth';
import { ShoppingCart, ArrowLeft, Shield, Zap, Clock, Heart, Loader2, AlertTriangle } from 'lucide-react';
import { HalfStarDisplay, InteractiveHalfStar } from '@/components/HalfStarRating';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import GameCard from '@/components/GameCard';

export default function GameDetail() {
  const { id } = useParams();
  const { data: game, isLoading } = useProduto(id);
  const { data: allGames = [] } = useProdutos();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { isFavorito, toggleFavorito } = useFavoritos();
  const { avgRating, totalReviews, userRating, submitRating } = useAvaliacoes(id);
  

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!game) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-xl text-muted-foreground">Jogo não encontrado.</p>
        <Link to="/catalogo" className="text-primary hover:underline mt-4 inline-block">Voltar ao catálogo</Link>
      </div>
    );
  }

  const related = allGames.filter(g => g.id !== game.id && g.category === game.category).slice(0, 4);
  const outOfStock = game.stock <= 0;

  const handleAdd = () => {
    if (outOfStock) { toast.error('Produto fora de estoque'); return; }
    addItem(game);
    toast.success(`${game.title} adicionado ao carrinho!`);
  };
  const handleFav = () => {
    if (!user) { toast.error('Faça login para favoritar'); return; }
    toggleFavorito(game.id);
  };
  const handleRate = async (rating: number) => {
    if (!user) { toast.error('Faça login para avaliar'); return; }
    try {
      await submitRating.mutateAsync(rating);
      toast.success('Avaliação registrada!');
    } catch { toast.error('Erro ao avaliar'); }
  };

  const installments = Math.min(12, Math.max(2, Math.ceil(game.price / 10)));
  const installmentValue = (game.price / installments).toFixed(2);

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/catalogo" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
      </Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2">
          <div className="relative rounded-xl overflow-hidden aspect-video">
            <img src={game.image} alt={game.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
            <button onClick={handleFav} className="absolute top-4 right-4 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors">
              <Heart className={`h-5 w-5 ${isFavorito(game.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
            </button>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {game.platform.map(p => <span key={p} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">{p}</span>)}
              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">{game.category}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">{game.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{game.publisher}</p>
          </div>

          {/* Rating display */}
          <div className="flex items-center gap-2">
            <HalfStarDisplay rating={avgRating} size={16} />
            <span className="text-sm text-muted-foreground">{avgRating.toFixed(1)} ({totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'})</span>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            {outOfStock && (
              <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Fora de estoque</span>
              </div>
            )}
            {game.discount > 0 && (
              <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground text-sm font-bold px-2 py-1 rounded">-{game.discount}%</span>
                <span className="text-muted-foreground line-through text-sm">R$ {game.originalPrice.toFixed(2)}</span>
              </div>
            )}
            <div className="text-3xl font-bold text-price">R$ {game.price.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">ou {installments}x de R$ {installmentValue} sem juros</p>
            {!outOfStock && <p className="text-xs text-success">{game.stock} unidades em estoque</p>}
            <button onClick={handleAdd} disabled={outOfStock}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all glow-primary disabled:opacity-50 disabled:cursor-not-allowed">
              <ShoppingCart className="h-5 w-5" /> {outOfStock ? 'Indisponível' : 'Adicionar ao Carrinho'}
            </button>
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Zap className="h-3.5 w-3.5 text-primary" /> Entrega instantânea por e-mail</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Shield className="h-3.5 w-3.5 text-success" /> Garantia de 30 dias</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5 text-warning" /> Suporte 24/7</div>
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
            {game.tags.map(tag => <span key={tag} className="text-xs bg-secondary text-secondary-foreground px-3 py-1.5 rounded-full">{tag}</span>)}
          </div>
        </div>
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground">Detalhes</h2>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Publicadora</span><span className="text-foreground">{game.publisher}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Lançamento</span><span className="text-foreground">{game.releaseDate ? new Date(game.releaseDate).toLocaleDateString('pt-BR') : '-'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span className="text-foreground">{game.category}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Plataformas</span><span className="text-foreground">{game.platform.join(', ')}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Estoque</span><span className={outOfStock ? 'text-destructive' : 'text-foreground'}>{outOfStock ? 'Esgotado' : `${game.stock} un.`}</span></div>
          </div>
        </div>
      </div>

      {/* Star Rating */}
      <div className="mt-12">
        <h2 className="text-lg font-bold text-foreground mb-4">Avaliação</h2>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <div className="text-4xl font-bold text-price">{avgRating.toFixed(1)}</div>
              <HalfStarDisplay rating={avgRating} size={16} className="justify-center mt-1" />
              <p className="text-xs text-muted-foreground mt-1">{totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'}</p>
            </div>
            {user && (
              <div className="border-l border-border pl-6">
                <p className="text-sm text-muted-foreground mb-2">{userRating ? 'Sua avaliação:' : 'Avalie este jogo:'}</p>
                <InteractiveHalfStar value={userRating || 0} onChange={handleRate} />
              </div>
            )}
            {!user && (
              <p className="text-sm text-muted-foreground">
                <Link to="/auth" className="text-primary hover:underline">Faça login</Link> para avaliar
              </p>
            )}
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
