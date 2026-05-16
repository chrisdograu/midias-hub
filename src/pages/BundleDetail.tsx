import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/hooks/useCart';
import { Package, Loader2, ShoppingCart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSubmitGuard } from '@/hooks/useSubmitGuard';
import { toast } from 'sonner';

interface BundleData {
  id: string; title: string; description: string | null; price: number; image_url: string | null;
  items: { product_id: string; title: string; image_url: string | null; price: number; category: string | null }[];
}

export default function BundleDetail() {
  const { id } = useParams<{ id: string }>();
  const [bundle, setBundle] = useState<BundleData | null>(null);
  const [loading, setLoading] = useState(true);
  const cart = useCart();
  const { submitting, guard } = useSubmitGuard();

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('bundles' as any)
        .select('id, title, description, price, image_url, bundle_items(product_id, produtos(title, image_url, price, category))')
        .eq('id', id)
        .maybeSingle();
      if (data) {
        const b: any = data;
        setBundle({
          id: b.id, title: b.title, description: b.description, price: Number(b.price), image_url: b.image_url,
          items: (b.bundle_items || []).map((bi: any) => ({
            product_id: bi.product_id,
            title: bi.produtos?.title || '',
            image_url: bi.produtos?.image_url || null,
            price: Number(bi.produtos?.price || 0),
            category: bi.produtos?.category || null,
          })),
        });
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!bundle) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Bundle não encontrado.</div>;

  const total = bundle.items.reduce((s, i) => s + i.price, 0);
  const saving = total > 0 ? Math.round((1 - bundle.price / total) * 100) : 0;

  const addAll = guard(async () => {
    for (const it of bundle.items) {
      cart.addItem({
        id: it.product_id, title: it.title, price: bundle.price / bundle.items.length,
        image: it.image_url || '', category: it.category || '', platform: [], rating: 0,
        originalPrice: it.price, discount: 0, description: '',
      } as any);
    }
    toast.success(`Bundle "${bundle.title}" adicionado ao carrinho`);
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-video bg-secondary rounded-lg overflow-hidden">
          {bundle.image_url ? (
            <img src={bundle.image_url} alt={bundle.title} className="w-full h-full object-cover" />
          ) : (
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
              {bundle.items.slice(0, 4).map((it, i) => (
                it.image_url ? <img key={i} src={it.image_url} alt="" className="w-full h-full object-cover" /> : <div key={i} className="bg-muted" />
              ))}
            </div>
          )}
        </div>
        <div>
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-primary to-accent text-primary-foreground px-2 py-1 rounded mb-3">
            <Package className="h-3 w-3" /> BUNDLE
          </span>
          <h1 className="text-3xl font-display font-bold mb-2">{bundle.title}</h1>
          {bundle.description && <p className="text-muted-foreground mb-4">{bundle.description}</p>}
          <div className="bg-card border border-border rounded-lg p-4 mb-4">
            <div className="flex items-baseline gap-3 mb-1">
              {saving > 0 && <span className="text-lg text-muted-foreground line-through">R$ {total.toFixed(2)}</span>}
              <span className="text-3xl font-bold text-primary">R$ {bundle.price.toFixed(2)}</span>
              {saving > 0 && <span className="text-sm font-bold bg-green-500 text-white px-2 py-0.5 rounded">-{saving}%</span>}
            </div>
            <p className="text-xs text-muted-foreground">Economize R$ {(total - bundle.price).toFixed(2)} comprando o pacote</p>
          </div>
          <Button size="lg" className="w-full" disabled={submitting} onClick={addAll}>
            <ShoppingCart className="h-5 w-5 mr-2" /> Adicionar bundle ao carrinho
          </Button>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Jogos incluídos neste bundle</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bundle.items.map(it => (
            <Link key={it.product_id} to={`/jogo/${it.product_id}`} className="bg-card border border-border hover:border-primary/60 rounded-lg overflow-hidden flex transition-colors">
              <div className="w-24 h-24 bg-secondary shrink-0">
                {it.image_url && <img src={it.image_url} alt={it.title} className="w-full h-full object-cover" />}
              </div>
              <div className="p-3 flex-1 min-w-0">
                <h3 className="font-semibold text-sm line-clamp-2">{it.title}</h3>
                <p className="text-xs text-muted-foreground">{it.category || ''}</p>
                <p className="text-xs text-primary mt-1">R$ {it.price.toFixed(2)} avulso</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
