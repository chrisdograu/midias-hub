import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, AlertTriangle, Users, ClipboardList, TrendingUp, ArrowUpRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { statusLabels, statusColors } from '../mockData';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalProdutos: 0, totalClientes: 0, pedidosPendentes: 0, estoqueBaixo: 0, faturamentoTotal: 0, totalPedidos: 0 });
  const [alertProducts, setAlertProducts] = useState<{ id: string; title: string; stock: number; stock_alert_threshold: number; image_url: string | null; platform: string[] | null }[]>([]);
  const [recentOrders, setRecentOrders] = useState<{ id: string; cliente: string; total: number; status: string; items: number }[]>([]);
  const [serie14d, setSerie14d] = useState<{ data: string; valor: number }[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [{ data: prods }, { count: clientCount }, { data: pedidos }, { data: items }] = await Promise.all([
        supabase.from('produtos').select('id, title, stock, stock_alert_threshold, image_url, platform'),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
        supabase.from('pedidos').select('id, user_id, total, status, created_at').order('created_at', { ascending: false }).limit(200),
        supabase.from('itens_pedido').select('order_id'),
      ]);

      const alerts = (prods || []).filter(p => p.stock <= p.stock_alert_threshold);
      setAlertProducts(alerts);

      const pending = (pedidos || []).filter(p => p.status === 'pending').length;
      const validPaid = (pedidos || []).filter(p => ['confirmed', 'processing', 'shipped', 'delivered'].includes(p.status));
      const faturamento = validPaid.reduce((s, p) => s + Number(p.total), 0);

      // Série dos últimos 14 dias
      const since14 = new Date(Date.now() - 14 * 86400000).toISOString();
      const buckets = new Map<string, number>();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        buckets.set(d.toISOString().slice(0, 10), 0);
      }
      validPaid.forEach(p => {
        if (p.created_at >= since14) {
          const key = (p.created_at as string).slice(0, 10);
          if (buckets.has(key)) buckets.set(key, (buckets.get(key) || 0) + Number(p.total));
        }
      });
      setSerie14d([...buckets.entries()].map(([k, v]) => ({ data: k.slice(5).replace('-', '/'), valor: Number(v.toFixed(2)) })));

      // Get recent order client names
      const userIds = [...new Set((pedidos || []).slice(0, 5).map(p => p.user_id).filter(Boolean))] as string[];
      const { data: profiles } = userIds.length > 0 ? await supabase.from('profiles').select('id, display_name').in('id', userIds) : { data: [] };
      const profileMap = new Map<string, string>((profiles || []).map(p => [p.id, p.display_name || 'Cliente'] as [string, string]));

      const itemCount = new Map<string, number>();
      items?.forEach(i => itemCount.set(i.order_id, (itemCount.get(i.order_id) || 0) + 1));

      setRecentOrders((pedidos || []).slice(0, 5).map(p => ({
        id: p.id, cliente: p.user_id ? (profileMap.get(p.user_id) || 'Cliente') as string : 'Anônimo',
        total: Number(p.total), status: p.status, items: itemCount.get(p.id) || 0,
      })));

      setStats({
        totalProdutos: (prods || []).length, totalClientes: clientCount || 0,
        pedidosPendentes: pending, estoqueBaixo: alerts.length,
        faturamentoTotal: faturamento, totalPedidos: (pedidos || []).length,
      });
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="p-6 flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const kpis = [
    { label: 'Faturamento', value: `R$ ${stats.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-green-400' },
    { label: 'Total Pedidos', value: stats.totalPedidos.toString(), icon: ShoppingCart, color: 'text-primary' },
    { label: 'Pendentes', value: stats.pedidosPendentes.toString(), icon: ClipboardList, color: 'text-yellow-400' },
    { label: 'Estoque Baixo', value: stats.estoqueBaixo.toString(), icon: AlertTriangle, color: 'text-red-400' },
    { label: 'Produtos', value: stats.totalProdutos.toString(), icon: TrendingUp, color: 'text-accent' },
    { label: 'Clientes', value: stats.totalClientes.toString(), icon: Users, color: 'text-blue-400' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-muted-foreground text-sm">Visão geral do sistema</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map(stat => (
          <Card key={stat.label} className="border-border/50">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-400" /> Alertas de Estoque</CardTitle></CardHeader>
          <CardContent>
            {alertProducts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum alerta</p> : (
              <div className="space-y-2">
                {alertProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      {p.image_url ? <img src={p.image_url} alt={p.title} className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-muted" />}
                      <div><p className="text-sm font-medium">{p.title}</p><p className="text-xs text-muted-foreground">{(p.platform || []).join(', ')}</p></div>
                    </div>
                    <Badge variant="outline" className={p.stock === 0 ? 'border-red-500/50 text-red-400' : 'border-yellow-500/50 text-yellow-400'}>
                      {p.stock === 0 ? 'Sem estoque' : `${p.stock} un.`}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Pedidos Recentes</CardTitle></CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhum pedido</p> : (
              <div className="space-y-2">
                {recentOrders.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div><p className="text-sm font-medium">{p.id.slice(0, 8)}...</p><p className="text-xs text-muted-foreground">{p.cliente} · {p.items} {p.items === 1 ? 'item' : 'itens'}</p></div>
                    <div className="text-right flex items-center gap-3">
                      <Badge className={statusColors[p.status]}>{statusLabels[p.status] || p.status}</Badge>
                      <span className="text-sm font-semibold">R$ {p.total.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
