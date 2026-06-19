import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Satellite, Loader2 } from 'lucide-react';
import { useRadarDelta } from '@/hooks/useRadarDelta';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  limit?: number;
  compact?: boolean;
}

export default function OrbitRadar({ limit = 4, compact = false }: Props) {
  const { user } = useAuth();
  const { data, isLoading } = useRadarDelta(limit);
  const items = useMemo(() => (data ?? []).slice(0, limit), [data, limit]);
  const storageKey = `radar-seen-${user?.id ?? 'guest'}`;
  const [seen, setSeen] = useState<Set<string>>(new Set());

  useEffect(() => {
    try { setSeen(new Set(JSON.parse(localStorage.getItem(storageKey) || '[]'))); } catch { /* noop */ }
  }, [storageKey]);

  const markSeen = (id: string) => {
    setSeen(prev => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem(storageKey, JSON.stringify([...next])); } catch { /* noop */ }
      return next;
    });
  };

  const stamp = useMemo(() => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), [data]);

  return (
    <section className={compact ? '' : 'container mx-auto px-4 pt-6'}>
      <header className="flex items-center justify-between mb-3">
        <h2 className="font-display text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
          <Satellite className="h-4 w-4 text-primary" /> Na sua órbita hoje
        </h2>
        <span className="text-[10px] sm:text-[11px] text-muted-foreground">
          🛰️ Última varredura: {stamp}
        </span>
      </header>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="shrink-0 w-56 h-32 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border/60 bg-card/50 p-4 text-sm text-muted-foreground italic">
          🛰️ Você está em dia. Sem novos sinais nas últimas 72h.
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-thin -mx-4 px-4 pb-2 snap-x">
          {items.map(item => {
            const isSeen = seen.has(item.product_id);
            return (
              <Link
                key={item.product_id}
                to={`/jogo/${item.product_id}`}
                onClick={() => markSeen(item.product_id)}
                className={`shrink-0 w-56 sm:w-64 snap-start rounded-xl overflow-hidden border transition-all bg-card group ${
                  isSeen
                    ? 'border-border/40 opacity-80'
                    : 'border-primary/40 hover:border-primary/70 hover:-translate-y-0.5'
                }`}
              >
                <div className="relative aspect-[16/9] bg-muted">
                  {item.image_url && (
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <span
                    className={`absolute top-2 right-2 h-3 w-3 rounded-full border transition-all ${
                      isSeen
                        ? 'border-muted-foreground/60 bg-transparent'
                        : 'border-primary bg-primary shadow-[0_0_10px_hsl(var(--primary))]'
                    }`}
                    aria-label={isSeen ? 'já visualizado' : 'sinal novo'}
                  />
                  <div className="absolute bottom-2 left-2 right-2">
                    <h3 className="text-sm font-bold text-white line-clamp-1">{item.title}</h3>
                  </div>
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    <span className="text-primary font-semibold">▲ {item.score}</span> · {item.evidence}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
