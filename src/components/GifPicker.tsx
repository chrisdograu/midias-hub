import { useEffect, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';

// Giphy public beta key — funciona para uso leve sem registro.
const GIPHY_KEY = 'dc6zaTOxFJmzC';
// Tenor v1 anonymous key (compatível com a base usada pelo Instagram/iOS).
const TENOR_KEY = 'LIVDSRZULELA';

type Source = 'giphy' | 'tenor';

export function GifPicker({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [src, setSrc] = useState<Source>('giphy');
  const [items, setItems] = useState<{ id: string; url: string; preview: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<{ url: string; preview: string } | null>(null);

  useEffect(() => {
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        if (src === 'giphy') {
          const endpoint = q.trim()
            ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=24&rating=pg-13`
            : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=24&rating=pg-13`;
          const r = await fetch(endpoint);
          const j = await r.json();
          setItems((j.data || []).map((g: any) => ({
            id: g.id,
            url: g.images?.original?.url || g.images?.downsized?.url,
            preview: g.images?.fixed_width_small?.url || g.images?.preview_gif?.url,
          })));
        } else {
          const endpoint = q.trim()
            ? `https://g.tenor.com/v1/search?key=${TENOR_KEY}&q=${encodeURIComponent(q)}&limit=24&contentfilter=medium`
            : `https://g.tenor.com/v1/trending?key=${TENOR_KEY}&limit=24&contentfilter=medium`;
          const r = await fetch(endpoint);
          const j = await r.json();
          setItems((j.results || []).map((g: any) => ({
            id: g.id,
            url: g.media?.[0]?.gif?.url || g.media?.[0]?.mediumgif?.url,
            preview: g.media?.[0]?.tinygif?.url || g.media?.[0]?.nanogif?.url,
          })).filter((x: any) => x.url));
        }
      } catch {
        setItems([]);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(id);
  }, [q, src]);

  const confirm = () => {
    if (!picked) return;
    onSelect(picked.url);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-end" onClick={onClose}>
      <div className="w-full bg-card rounded-t-2xl p-3 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar GIFs..."
              className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <button onClick={onClose} className="p-2 rounded-lg bg-secondary"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex gap-1 p-1 bg-secondary/40 rounded-lg mb-2">
          {(['giphy', 'tenor'] as Source[]).map(s => (
            <button key={s} onClick={() => setSrc(s)}
              className={`flex-1 py-1 rounded-md text-[11px] font-semibold ${src === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              {s === 'giphy' ? 'GIPHY' : 'Tenor'}
            </button>
          ))}
        </div>

        {picked ? (
          <div className="flex-1 overflow-y-auto flex flex-col items-center gap-3 py-3">
            <p className="text-xs text-muted-foreground">Pré-visualização</p>
            <img src={picked.url} alt="" className="max-h-72 rounded-xl object-contain bg-muted" />
            <div className="flex gap-2 w-full">
              <button onClick={() => setPicked(null)} className="flex-1 py-2.5 rounded-lg bg-secondary text-sm font-semibold">Escolher outro</button>
              <button onClick={confirm} className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold">Enviar</button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {items.map(g => (
                  <button key={g.id} onClick={() => setPicked({ url: g.url, preview: g.preview })} className="aspect-square overflow-hidden rounded-md bg-muted hover:ring-2 hover:ring-primary">
                    <img src={g.preview} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
            <p className="text-[10px] text-center text-muted-foreground py-2">
              {src === 'giphy' ? 'Powered by GIPHY' : 'Powered by Tenor (compatível com Instagram)'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
