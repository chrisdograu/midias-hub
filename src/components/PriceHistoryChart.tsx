import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingDown, History } from 'lucide-react';

interface Point { date: string; price: number; }

export default function PriceHistoryChart({ productId, currentPrice }: { productId: string; currentPrice: number }) {
  const [data, setData] = useState<Point[]>([]);
  const [minPrice, setMinPrice] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: rows } = await supabase
        .from('price_history' as any)
        .select('price, recorded_at')
        .eq('product_id', productId)
        .order('recorded_at', { ascending: true })
        .limit(50);
      const pts: Point[] = ((rows as any) || []).map((r: any) => ({
        date: new Date(r.recorded_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        price: Number(r.price),
      }));
      setData(pts);
      if (pts.length) setMinPrice(Math.min(...pts.map(p => p.price), currentPrice));
      else setMinPrice(currentPrice);
    })();
  }, [productId, currentPrice]);

  const isLowest = minPrice !== null && currentPrice <= minPrice;

  return (
    <div className="bg-card border border-border rounded-xl p-6 mt-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Histórico de Preços</h2>
        </div>
        {isLowest && (
          <span className="inline-flex items-center gap-1 bg-success/15 text-success text-xs font-bold px-2.5 py-1 rounded-full border border-success/30">
            <TrendingDown className="h-3.5 w-3.5" /> Menor preço histórico
          </span>
        )}
      </div>
      {data.length < 2 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Ainda não há histórico suficiente para exibir um gráfico. Acompanhe este jogo — registramos cada mudança de preço.
          {minPrice !== null && <span className="block mt-2">Menor preço registrado: <strong className="text-price">R$ {minPrice.toFixed(2)}</strong></span>}
        </p>
      ) : (
        <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                  formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Preço']}
                />
                <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {minPrice !== null && (
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Menor preço registrado: <strong className="text-price">R$ {minPrice.toFixed(2)}</strong>
              {' · '}
              Preço atual: <strong className={isLowest ? 'text-success' : 'text-foreground'}>R$ {currentPrice.toFixed(2)}</strong>
            </p>
          )}
        </>
      )}
    </div>
  );
}
