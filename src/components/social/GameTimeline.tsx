import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Clock, Star, Trophy, Library, MessageSquare, Camera, Award, Pencil, Check, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { TimelineSkeleton } from '@/components/skeletons';

type Event = {
  id: string;
  product_id: string;
  kind: string;
  payload: any;
  created_at: string;
  user_note?: string | null;
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
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const isOwner = user?.id === userId;

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      let q = supabase
        .from('game_timeline_events')
        .select('id, product_id, kind, payload, created_at, user_note')
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

  const startEdit = (ev: Event) => {
    setEditingId(ev.id);
    setDraft(ev.user_note || '');
  };

  const saveNote = async (id: string) => {
    const value = draft.trim();
    await supabase
      .from('game_timeline_events')
      .update({ user_note: value || null })
      .eq('id', id);
    setEvents(prev => prev.map(e => e.id === id ? { ...e, user_note: value || null } : e));
    setEditingId(null);
  };

  if (loading) return <TimelineSkeleton count={4} />;
  if (!events.length) {
    return <p className="text-sm text-muted-foreground py-4">Sem eventos na timeline ainda.</p>;
  }

  return (
    <ol className="relative border-l border-border ml-3 space-y-4 py-2">
      {events.map(ev => {
        const Icon = ICON[ev.kind] || Clock;
        const label = (LABEL[ev.kind] || (() => ev.kind))(ev.payload);
        const editing = editingId === ev.id;
        return (
          <li key={ev.id} className="ml-4">
            <span className="absolute -left-2 flex items-center justify-center w-4 h-4 rounded-full bg-primary/20 ring-4 ring-background">
              <Icon className="h-2.5 w-2.5 text-primary" />
            </span>
            <div className="bg-card border border-border rounded-lg px-3 py-2">
              <div className="flex items-center gap-3">
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
                {isOwner && !editing && (
                  <button
                    onClick={() => startEdit(ev)}
                    className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                    title={ev.user_note ? 'Editar memória' : 'Adicionar memória'}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {editing ? (
                <div className="mt-2 flex items-start gap-2">
                  <textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    maxLength={500}
                    rows={2}
                    autoFocus
                    placeholder="Como foi esse dia? Deixe uma memória..."
                    className="flex-1 text-xs bg-background border border-border rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex flex-col gap-1">
                    <button onClick={() => saveNote(ev.id)} className="p-1.5 rounded bg-primary/20 text-primary hover:bg-primary/30">
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded bg-secondary text-muted-foreground hover:bg-secondary/80">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : ev.user_note ? (
                <div className="mt-2 pl-2 border-l-2 border-accent/40 flex items-start gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-accent font-bold shrink-0 mt-0.5">📝 memória</span>
                  <p className="text-xs text-foreground/90 italic">{ev.user_note}</p>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
