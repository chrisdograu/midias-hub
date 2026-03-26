import { useState } from 'react';
import { Heart, MessageCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { HalfStarDisplay } from './HalfStarRating';
import { Review, useReviewComments } from '@/hooks/useReviews';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ReviewCardProps {
  review: Review;
  onLike: (id: string) => void;
  onDelete?: () => void;
}

export default function ReviewCard({ review, onLike, onDelete }: ReviewCardProps) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const { comments, addComment, deleteComment } = useReviewComments(showComments ? review.id : undefined);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    if (!user) { toast.error('Faça login para comentar'); return; }
    try {
      await addComment.mutateAsync(commentText);
      setCommentText('');
    } catch { toast.error('Erro ao comentar'); }
  };

  const displayName = (review as any).profile?.display_name || (review as any).profiles?.display_name || 'Usuário';
  const initial = displayName[0]?.toUpperCase() || 'U';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">{initial}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{displayName}</p>
            <div className="flex items-center gap-2">
              <HalfStarDisplay rating={review.rating} size={14} />
              <span className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
        {onDelete && user?.id === review.user_id && (
          <button onClick={onDelete} className="text-muted-foreground hover:text-destructive transition-colors p-1">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Comment text */}
      {review.comment && (
        <p className="text-sm text-foreground/90 leading-relaxed">{review.comment}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1">
        <button onClick={() => { if (!user) { toast.error('Faça login'); return; } onLike(review.id); }}
          className={`flex items-center gap-1.5 text-xs transition-colors ${review.user_liked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}>
          <Heart className={`h-4 w-4 ${review.user_liked ? 'fill-current' : ''}`} />
          {review.likes_count > 0 && review.likes_count}
        </button>
        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <MessageCircle className="h-4 w-4" />
          {review.comments_count > 0 && review.comments_count}
          {showComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="border-t border-border pt-3 space-y-2">
              {comments.map((c: any) => (
                <div key={c.id} className="flex items-start gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {((c as any).profiles?.display_name || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground text-xs">{(c as any).profiles?.display_name || 'Usuário'}</span>
                    <p className="text-muted-foreground text-xs">{c.content}</p>
                  </div>
                  {user?.id === c.user_id && (
                    <button onClick={() => deleteComment.mutate(c.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {user && (
                <div className="flex gap-2 pt-1">
                  <input value={commentText} onChange={e => setCommentText(e.target.value)}
                    placeholder="Adicionar comentário..."
                    onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                    className="flex-1 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  <button onClick={handleAddComment} disabled={addComment.isPending}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50">
                    Enviar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
