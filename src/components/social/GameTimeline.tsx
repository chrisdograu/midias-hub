import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Clock, Star, Trophy, Library, MessageSquare, Camera, Award } from 'lucide-react';

type Event = {
  id: string;
  product_id: string;
  kind: string;
  payload: any;
  created_at: string;
  product?: { title: string; image_url: string | null } | null;
};

const ICON: Record<string, any> = {
  status_change: Library,
  review: Star,
  review_completa: Star,
  opinion: MessageSquare,
  screenshot: Camera,
  achievement: Trophy,
  platinum: Award,
};

const LABEL: Record<string, (p: any) => string> = {
  status_change: p => `mudou status para ${p?.status || '—'}`,
  review: p => `avaliou (${p?.rating ?? '—'}/5)`,
  review_completa: () => 'publicou uma review completa',
  opinion: () => 'compartilhou uma opinião',
  screenshot: () => 'postou screenshots',
  achievement: p => `desbloqueou: ${p?.name || 'conquista'}`,
  platinum: () => 'platinou o jogo',
};

export default function GameTimeline({ userId, productId }: { userId: string; productId?: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      let q = supabase
        .from('game_timeline_events')
        .select('id, product_id, kind, payload, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (productId) q = q.eq('product_id', productId);
      const { data } = await q;
      const list = (data || []) as Event[];
      const pids = [...new Set(list.map(e => e.product_id))];
      if (pids.length) {
        const { data: prods } = await supabase.from('produtos').select('id, title, image_url').in('id', pids);
        const map = new Map((prods || []).map(p => [p.id, p]));
        list.forEach(e => { e.product = (map.get(e.product_id) as any) || null; });
      }
      if (!cancel) { setEvents(list); setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [userId, productId]);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }
  if (!events.length) {
    return <p className="text-sm text-muted-foreground py-4">Sem eventos na timeline ainda.</p>;
  }

  return (
    <ol className="relative border-l border-border ml-3 space-y-4 py-2">
      {events.map(ev => {
        const Icon = ICON[ev.kind] || Clock;
        const label = (LABEL[ev.kind] || (() => ev.kind))(ev.payload);
        return (
          <li key={ev.id} className="ml-4">
            <span className="absolute -left-2 flex items-center justify-center w-4 h-4 rounded-full bg-primary/20 ring-4 ring-background">
              <Icon className="h-2.5 w-2.5 text-primary" />
            </span>
            <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-3 py-2">
              {ev.product?.image_url && (
                <img src={ev.product.image_url} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">
                  {ev.product ? (
                    <Link to={`/jogo/${ev.product_id}`} className="font-medium hover:text-primary">{ev.product.title}</Link>
                  ) : 'Jogo'}{' '}
                  <span className="text-muted-foreground">— {label}</span>
                </p>
                <p className="text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
