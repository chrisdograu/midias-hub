import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Star, MessageSquare, Camera, Gamepad2 } from 'lucide-react';

type Item = {
  id: string;
  type: 'game' | 'review' | 'review_completa' | 'screenshot' | 'opinion';
  ref_id: string;
  label?: string;
  image?: string | null;
  href?: string;
};

const ICON: Record<string, any> = {
  game: Gamepad2, review: Star, review_completa: Star,
  opinion: MessageSquare, screenshot: Camera,
};

export default function HighlightsStrip({ userId }: { userId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profile_highlights')
        .select('id, type, ref_id, position')
        .eq('user_id', userId)
        .order('position', { ascending: true })
        .limit(6);
      const rows = ((data as any[]) || []) as Item[];

      // enrich games
      const gameIds = rows.filter(r => r.type === 'game').map(r => r.ref_id);
      if (gameIds.length) {
        const { data: prods } = await supabase.from('produtos').select('id, title, image').in('id', gameIds);
        const m = new Map((prods || []).map((p: any) => [p.id, p]));
        rows.forEach(r => {
          if (r.type === 'game') {
            const p: any = m.get(r.ref_id);
            r.label = p?.title || 'Jogo';
            r.image = p?.image || null;
            r.href = `/jogo/${r.ref_id}`;
          }
        });
      }
      rows.forEach(r => {
        if (!r.href) {
          if (r.type === 'review' || r.type === 'review_completa') r.href = `/perfil/${userId}`;
          else r.href = `/perfil/${userId}`;
        }
        if (!r.label) r.label = r.type;
      });
      if (!cancel) { setItems(rows); setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [userId]);

  if (loading || items.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6">
      <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" /> Destaques
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {items.map(it => {
          const Icon = ICON[it.type] || Sparkles;
          return (
            <Link key={it.id} to={it.href!}
              className="group flex flex-col items-center text-center">
              {it.image ? (
                <img src={it.image} alt={it.label}
                  className="w-full aspect-[3/4] object-cover rounded-lg group-hover:ring-2 ring-primary transition-all" />
              ) : (
                <div className="w-full aspect-[3/4] bg-secondary rounded-lg flex items-center justify-center group-hover:ring-2 ring-primary transition-all">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              )}
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{it.label}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
