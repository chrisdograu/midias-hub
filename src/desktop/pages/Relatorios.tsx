import { useState, useEffect } from 'react';
import { BarChart3, Calendar, DollarSign, Package, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

export default function Relatorios() {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes');
  const [kpis, setKpis] = useState({ faturamento: 0, vendas: 0, ticket: 0, clientes: 0 });
  const [topProdutos, setTopProdutos] = useState<{ title: string; vendas: number; faturamento: number }[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: pedidos } = await supabase.from('pedidos').select('id, total, status, user_id').in('status', ['confirmed', 'processing', 'shipped', 'delivered']);
      const validOrders = pedidos || [];
      const fat = validOrders.reduce((s, p) => s + Number(p.total), 0);
      const uniqueClients = new Set(validOrders.map(p => p.user_id).filter(Boolean));

      // Top products by sales
      const orderIds = validOrders.map(o => o.id);
      const { data: items } = orderIds.length > 0
        ? await supabase.from('itens_pedido').select('product_id, quantity, price_at_purchase').in('order_id', orderIds)
        : { data: [] };

      const prodSales = new Map<string, { qty: number; rev: number }>();
      items?.forEach(i => {
        const cur = prodSales.get(i.product_id) || { qty: 0, rev: 0 };
        cur.qty += i.quantity; cur.rev += Number(i.price_at_purchase) * i.quantity;
        prodSales.set(i.product_id, cur);
      });

      const topIds = [...prodSales.entries()].sort((a, b) => b[1].qty - a[1].qty).slice(0, 10).map(e => e[0]);
      const { data: prods } = topIds.length > 0 ? await supabase.from('produtos').select('id, title').in('id', topIds) : { data: [] };
      const prodMap = new Map(prods?.map(p => [p.id, p.title]) || []);

      setTopProdutos(topIds.map(id => ({
        title: prodMap.get(id) || 'Produto',
        vendas: prodSales.get(id)?.qty || 0,
        faturamento: prodSales.get(id)?.rev || 0,
      })));

      setKpis({
        faturamento: fat, vendas: validOrders.length,
        ticket: validOrders.length > 0 ? fat / validOrders.length : 0,
        clientes: uniqueClients.size,
      });
      setLoading(false);
    };
    fetch();
  }, [periodo]);

  if (loading) return <div className="p-6 flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> Relatórios</h1><p className="text-muted-foreground text-sm">Análise de vendas e desempenho</p></div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-40"><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="semana">Última Semana</SelectItem>
            <SelectItem value="mes">Último Mês</SelectItem>
            <SelectItem value="trimestre">Último Trimestre</SelectItem>
            <SelectItem value="ano">Último Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Faturamento Total', value: `R$ ${kpis.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-green-400' },
          { label: 'Total de Vendas', value: kpis.vendas.toString(), icon: Package, color: 'text-primary' },
          { label: 'Ticket Médio', value: `R$ ${kpis.ticket.toFixed(2)}`, icon: Package, color: 'text-accent' },
          { label: 'Clientes Ativos', value: kpis.clientes.toString(), icon: Users, color: 'text-blue-400' },
        ].map(k => (
          <Card key={k.label} className="border-border/50">
            <CardContent className="py-4 px-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted"><k.icon className={`h-5 w-5 ${k.color}`} /></div>
              <div><p className="text-xl font-bold">{k.value}</p><p className="text-xs text-muted-foreground">{k.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="produtos">
        <TabsList><TabsTrigger value="produtos">Top Produtos</TabsTrigger></TabsList>
        <TabsContent value="produtos" className="mt-4">
          <Card className="border-border/50">
            <CardHeader className="pb-2"><CardTitle className="text-base">Mais Vendidos</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="border-border">
                  <TableHead>#</TableHead><TableHead>Produto</TableHead><TableHead className="text-center">Vendas</TableHead><TableHead className="text-right">Faturamento</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {topProdutos.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma venda registrada</TableCell></TableRow>
                  ) : topProdutos.map((p, i) => (
                    <TableRow key={p.title} className="border-border">
                      <TableCell className="text-sm font-bold text-muted-foreground">#{i + 1}</TableCell>
                      <TableCell className="font-medium text-sm">{p.title}</TableCell>
                      <TableCell className="text-center"><Badge variant="outline">{p.vendas}</Badge></TableCell>
                      <TableCell className="text-right text-sm font-semibold text-primary">R$ {p.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
