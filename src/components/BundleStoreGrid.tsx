import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Package } from 'lucide-react';

interface Bundle {
  id: string; title: string; price: number; image_url: string | null;
  items: { product_id: string; title: string; image_url: string | null; price: number }[];
  total_original: number;
}

export default function BundleStoreGrid({ limit = 8 }: { limit?: number }) {
  const [bundles, setBundles] = useState<Bundle[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('bundles' as any)
        .select('id, title, price, image_url, bundle_items(product_id, produtos(title, image_url, price))')
        .eq('is_active', true)
        .limit(limit);
      const list: Bundle[] = ((data as any) || []).map((b: any) => {
        const items = (b.bundle_items || []).map((bi: any) => ({
          product_id: bi.product_id,
          title: bi.produtos?.title || '',
          image_url: bi.produtos?.image_url || null,
          price: Number(bi.produtos?.price || 0),
        }));
        return {
          id: b.id, title: b.title, price: Number(b.price), image_url: b.image_url,
          items, total_original: items.reduce((s: number, i: any) => s + i.price, 0),
        };
      });
      setBundles(list);
    })();
  }, [limit]);

  if (!bundles.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {bundles.map(b => {
        const saving = b.total_original > 0 ? Math.round((1 - b.price / b.total_original) * 100) : 0;
        return (
          <Link
            key={b.id}
            to={`/bundle/${b.id}`}
            className="group bg-card border border-border hover:border-primary/60 rounded-lg overflow-hidden flex flex-col transition-colors"
          >
            <div className="relative aspect-video bg-secondary overflow-hidden">
              {b.image_url ? (
                <img src={b.image_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              ) : (
                <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                  {b.items.slice(0, 4).map((it, i) => (
                    it.image_url ? <img key={i} src={it.image_url} alt="" className="w-full h-full object-cover" /> : <div key={i} className="bg-muted" />
                  ))}
                </div>
              )}
              <span className="absolute top-2 left-2 text-xs font-bold bg-gradient-to-r from-primary to-accent text-primary-foreground px-2 py-0.5 rounded flex items-center gap-1">
                <Package className="h-3 w-3" /> BUNDLE
              </span>
              {saving > 0 && (
                <span className="absolute top-2 right-2 text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded">
                  -{saving}%
                </span>
              )}
            </div>
            <div className="p-3 flex-1 flex flex-col">
              <h3 className="font-semibold text-sm line-clamp-1">{b.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                {b.items.length} {b.items.length === 1 ? 'jogo incluso' : 'jogos inclusos'}
              </p>
              <div className="mt-auto flex items-baseline gap-2">
                {b.total_original > b.price && (
                  <span className="text-xs text-muted-foreground line-through">R$ {b.total_original.toFixed(2)}</span>
                )}
                <span className="text-base font-bold text-primary">R$ {b.price.toFixed(2)}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
