import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProduto } from '@/hooks/useProdutos';
import { useAvaliacoes } from '@/hooks/useAvaliacoes';
import { useReviews } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { HalfStarDisplay } from '@/components/HalfStarRating';
import ReviewCard from '@/components/ReviewCard';
import ReviewForm from '@/components/ReviewForm';
import { ArrowLeft, PenLine, Loader2, ExternalLink, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function GameReviews() {
  const { id } = useParams();
  const { data: game, isLoading: gameLoading } = useProduto(id);
  const { avgRating, totalReviews } = useAvaliacoes(id);
  const { reviews, myReview, submitReview, deleteReview, toggleLike, isLoading } = useReviews(id);
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);

  if (gameLoading || isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!game) return <div className="container mx-auto px-4 py-16 text-center"><p className="text-muted-foreground">Jogo não encontrado.</p></div>;

  const handleSubmit = async (data: { rating: number; comment: string }) => {
    try {
      await submitReview.mutateAsync(data);
      toast.success(myReview ? 'Review atualizada!' : 'Review publicada!');
      setShowForm(false);
    } catch { toast.error('Erro ao publicar review'); }
  };

  const handleDelete = async () => {
    try {
      await deleteReview.mutateAsync();
      toast.success('Review excluída');
    } catch { toast.error('Erro ao excluir'); }
  };

  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => Math.round(r.rating) === stars).length,
    pct: reviews.length ? (reviews.filter(r => Math.round(r.rating) === stars).length / reviews.length) * 100 : 0,
  }));

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <Link to={`/jogo/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar ao jogo
      </Link>

      {/* Game header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex gap-4 mb-8">
        <img src={game.image} alt={game.title} className="w-24 h-32 object-cover rounded-lg shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground mb-1">{game.title}</h1>
          <p className="text-sm text-muted-foreground mb-2">{game.publisher} • {game.releaseDate ? new Date(game.releaseDate).getFullYear() : ''}</p>
          <div className="flex flex-wrap gap-1 mb-2">
            {game.platform.map(p => <span key={p} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">{p}</span>)}
            <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded">{game.category}</span>
          </div>
          <div className="flex items-center gap-2">
            <HalfStarDisplay rating={avgRating} size={16} />
            <span className="text-sm font-semibold text-foreground">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({totalReviews})</span>
          </div>
          <Link to={`/jogo/${id}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
            <ExternalLink className="h-3 w-3" /> Comprar na loja
          </Link>
        </div>
      </motion.div>

      {/* Rating breakdown */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-price">{avgRating.toFixed(1)}</div>
            <HalfStarDisplay rating={avgRating} size={14} className="justify-center mt-1" />
            <p className="text-xs text-muted-foreground mt-1">{totalReviews} reviews</p>
          </div>
          <div className="flex-1 space-y-1">
            {distribution.map(d => (
              <div key={d.stars} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-4 text-right">{d.stars}</span>
                <Star className="h-3 w-3 text-price fill-price" />
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-price rounded-full transition-all" style={{ width: `${d.pct}%` }} />
                </div>
                <span className="text-muted-foreground w-6">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Write review button */}
      {user && !showForm && (
        <button onClick={() => setShowForm(true)}
          className="w-full py-3 mb-6 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all">
          <PenLine className="h-4 w-4" /> {myReview ? 'Editar minha review' : 'Escrever review'}
        </button>
      )}
      {!user && (
        <Link to="/auth" className="block w-full py-3 mb-6 bg-primary text-primary-foreground font-semibold rounded-lg text-center hover:opacity-90">
          Faça login para escrever uma review
        </Link>
      )}

      {/* Review form */}
      {showForm && (
        <div className="mb-6">
          <ReviewForm existingReview={myReview} onSubmit={handleSubmit} onCancel={() => setShowForm(false)} isLoading={submitReview.isPending} />
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma review ainda. Seja o primeiro!</p>
        ) : (
          reviews.map(review => (
            <ReviewCard key={review.id} review={review}
              onLike={(id) => toggleLike.mutate(id)}
              onDelete={review.user_id === user?.id ? handleDelete : undefined} />
          ))
        )}
      </div>
    </div>
  );
}
