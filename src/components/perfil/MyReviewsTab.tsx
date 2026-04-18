import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Star, Trash2, MessageSquareOff } from 'lucide-react';
import { toast } from 'sonner';

interface MyReview {
  id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  product_title: string;
  product_image: string | null;
}

export default function MyReviewsTab() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('avaliacoes')
      .select('id, product_id, rating, comment, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!data || data.length === 0) { setReviews([]); setLoading(false); return; }

    const prodIds = [...new Set(data.map(r => r.product_id))];
    const { data: prods } = await supabase
      .from('produtos')
      .select('id, title, image_url')
      .in('id', prodIds);
    const map = new Map(prods?.map(p => [p.id, p]) || []);

    setReviews(data.map(r => ({
      ...r,
      product_title: map.get(r.product_id)?.title || 'Produto',
      product_image: map.get(r.product_id)?.image_url || null,
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta avaliação?')) return;
    const { error } = await supabase.from('avaliacoes').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir'); return; }
    toast.success('Avaliação excluída');
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessageSquareOff className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Você ainda não fez nenhuma avaliação</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map(r => (
        <div key={r.id} className="flex gap-3 p-3 rounded-lg border border-border bg-secondary/40">
          <img src={r.product_image || '/placeholder.svg'} alt="" className="w-12 h-12 rounded object-cover" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{r.product_title}</p>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
              ))}
              <span className="text-xs text-muted-foreground ml-1">{Number(r.rating).toFixed(1)}</span>
            </div>
            {r.comment && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.comment}</p>}
            <p className="text-[10px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
          </div>
          <button onClick={() => handleDelete(r.id)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg h-fit transition-colors" title="Excluir">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
