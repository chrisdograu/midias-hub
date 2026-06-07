import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Fav = { content_type: string; content_id: string; created_at: string; preview?: any };

export default function SocialFavorites() {
  const { user } = useAuth();
  const [items, setItems] = useState<Fav[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('social_favorites')
        .select('content_type, content_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      const list = (data || []) as Fav[];
      // hydrate by type
      const byType: Record<string, string[]> = {};
      list.forEach(f => { (byType[f.content_type] ||= []).push(f.content_id); });
      const hydrated: Record<string, any> = {};
      if (byType.review) {
        const { data: r } = await supabase.from('avaliacoes').select('id, rating, comment, product_id, produtos!inner(title, image_url)').in('id', byType.review);
        (r || []).forEach((x: any) => { hydrated[`review:${x.id}`] = x; });
      }
      if (byType.opinion) {
        const { data: r } = await supabase.from('game_opinions').select('id, text, product_id, produtos!inner(title, image_url)').in('id', byType.opinion);
        (r || []).forEach((x: any) => { hydrated[`opinion:${x.id}`] = x; });
      }
      if (byType.screenshot) {
        const { data: r } = await supabase.from('game_screenshots').select('id, caption, product_id, image_urls, produtos!inner(title, image_url)').in('id', byType.screenshot);
        (r || []).forEach((x: any) => { hydrated[`screenshot:${x.id}`] = x; });
      }
      list.forEach(f => { f.preview = hydrated[`${f.content_type}:${f.content_id}`]; });
      setItems(list);
      setLoading(false);
    })();
  }, [user?.id]);

  const remove = async (f: Fav) => {
    if (!user) return;
    await supabase.from('social_favorites').delete().match({ user_id: user.id, content_type: f.content_type, content_id: f.content_id });
    setItems(prev => prev.filter(x => !(x.content_type === f.content_type && x.content_id === f.content_id)));
    toast.success('Removido dos favoritos');
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }
  if (!items.length) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
        Nada favoritado ainda. Toque no coração de uma review, opinião ou screenshot.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map(f => {
        const p = f.preview;
        if (!p) return null;
        return (
          <li key={`${f.content_type}-${f.content_id}`} className="bg-card border border-border rounded-xl p-4 flex gap-3">
            {p.produtos?.image_url && (
              <Link to={`/jogo/${p.product_id}`} className="shrink-0">
                <img src={p.produtos.image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
              </Link>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">{f.content_type}</span>
                <Link to={`/jogo/${p.product_id}`} className="text-sm font-semibold hover:text-primary truncate">
                  {p.produtos?.title}
                </Link>
                {f.content_type === 'review' && p.rating != null && (
                  <span className="inline-flex items-center gap-0.5 text-amber-500 text-xs">
                    <Star className="h-3 w-3 fill-current" />{Number(p.rating).toFixed(1)}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{p.comment || p.text || p.caption || ''}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => remove(f)} aria-label="Remover">
              <Heart className="h-4 w-4 fill-current text-primary" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
