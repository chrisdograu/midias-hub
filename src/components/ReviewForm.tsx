import { useState } from 'react';
import { InteractiveHalfStar } from './HalfStarRating';
import { Review } from '@/hooks/useReviews';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReviewFormProps {
  existingReview?: Review | null;
  onSubmit: (data: { rating: number; comment: string }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ReviewForm({ existingReview, onSubmit, onCancel, isLoading }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    await onSubmit({ rating, comment });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{existingReview ? 'Editar Review' : 'Escrever Review'}</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Sua nota:</p>
          <InteractiveHalfStar value={rating} onChange={setRating} size={32} />
        </div>
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          placeholder="Escreva sua review sobre o jogo... (opcional)"
          rows={4}
          className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 bg-secondary border border-border rounded-lg text-sm font-medium text-foreground hover:bg-secondary/80">
            Cancelar
          </button>
          <button type="submit" disabled={rating === 0 || isLoading}
            className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">
            {existingReview ? 'Atualizar' : 'Publicar'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
