import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Package } from 'lucide-react';

interface Bundle { id: string; title: string; description: string | null; price: number; image_url: string | null; }
interface Item { bundle_id: string; product_id: string; }

interface Props { productId: string; }

export default function ProductBundles({ productId }: Props) {
  const [bundles, setBundles] = useState<{ b: Bundle; products: { id: string; title: string; price: number; image_url: string | null }[] }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: items } = await supabase.from('bundle_items' as any).select('bundle_id, product_id');
      if (!items) return;
      const myBundleIds = (items as unknown as Item[]).filter(i => i.product_id === productId).map(i => i.bundle_id);
      if (myBundleIds.length === 0) { setBundles([]); return; }
      const { data: bds } = await supabase.from('bundles' as any).select('id, title, description, price, image_url').in('id', myBundleIds).eq('is_active', true);
      if (!bds || bds.length === 0) { setBundles([]); return; }
      const allProductIds = (items as unknown as Item[]).filter(i => myBundleIds.includes(i.bundle_id)).map(i => i.product_id);
      const { data: prods } = await supabase.from('produtos').select('id, title, price, image_url').in('id', allProductIds);
      const prodMap = new Map((prods || []).map(p => [p.id, p]));
      const built = (bds as unknown as Bundle[]).map(b => ({
        b,
        products: (items as unknown as Item[]).filter(i => i.bundle_id === b.id).map(i => prodMap.get(i.product_id)).filter(Boolean) as any[],
      }));
      setBundles(built);
    })();
  }, [productId]);

  if (bundles.length === 0) return null;

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Disponível em Pacotes</h2>
      </div>
      <div className="space-y-3">
        {bundles.map(({ b, products }) => {
          const fullPrice = products.reduce((s, p) => s + Number(p.price), 0);
          const savings = Math.max(0, fullPrice - Number(b.price));
          const pct = fullPrice > 0 ? Math.round((savings / fullPrice) * 100) : 0;
          return (
            <Link key={b.id} to={`/jogo/${products[0]?.id || ''}`} className="block bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{b.title}</h3>
                  {b.description && <p className="text-sm text-muted-foreground line-clamp-2">{b.description}</p>}
                </div>
                {pct > 0 && <span className="bg-price text-price-foreground text-xs font-bold px-2 py-1 rounded shrink-0">−{pct}%</span>}
              </div>
              <div className="flex items-center gap-2 mb-3 overflow-x-auto">
                {products.slice(0, 6).map(p => (
                  <div key={p.id} className="shrink-0 w-16 text-center">
                    <img src={p.image_url || ''} alt={p.title} className="w-16 h-20 object-cover rounded" />
                    <p className="text-[10px] text-muted-foreground truncate mt-1">{p.title}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-baseline gap-2 pt-2 border-t border-border">
                {savings > 0 && <span className="text-xs text-muted-foreground line-through">R$ {fullPrice.toFixed(2)}</span>}
                <span className="text-price font-bold text-lg">R$ {Number(b.price).toFixed(2)}</span>
                {savings > 0 && <span className="text-xs text-success">economiza R$ {savings.toFixed(2)}</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
