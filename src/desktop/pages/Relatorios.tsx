import { useState, useEffect } from 'react';
import { BarChart3, Calendar, DollarSign, Package, Users, Loader2, TrendingUp, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Cell, PieChart, Pie, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

const PERIODO_DAYS: Record<string, number> = { semana: 7, mes: 30, trimestre: 90, ano: 365 };

export default function Relatorios() {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes');
  const [kpis, setKpis] = useState({ faturamento: 0, vendas: 0, ticket: 0, clientes: 0 });
  const [topProdutos, setTopProdutos] = useState<{ title: string; vendas: number; faturamento: number }[]>([]);
  const [serieFaturamento, setSerieFaturamento] = useState<{ data: string; valor: number; pedidos: number }[]>([]);
  const [statusDist, setStatusDist] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const days = PERIODO_DAYS[periodo] || 30;
      const since = new Date(Date.now() - days * 86400000).toISOString();

      const { data: pedidos } = await supabase
        .from('pedidos')
        .select('id, total, status, user_id, created_at')
        .gte('created_at', since);

      const all = pedidos || [];
      const valid = all.filter(p => ['confirmed', 'processing', 'shipped', 'delivered'].includes(p.status));
      const fat = valid.reduce((s, p) => s + Number(p.total), 0);
      const uniqueClients = new Set(valid.map(p => p.user_id).filter(Boolean));

      // Status distribution
      const statusMap = new Map<string, number>();
      all.forEach(p => statusMap.set(p.status, (statusMap.get(p.status) || 0) + 1));
      const statusLabel: Record<string, string> = {
        pending: 'Pendente', confirmed: 'Confirmado', processing: 'Processando',
        shipped: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado',
      };
      setStatusDist([...statusMap.entries()].map(([k, v]) => ({ name: statusLabel[k] || k, value: v })));

      // Time series (faturamento por dia)
      const buckets = new Map<string, { valor: number; pedidos: number }>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        buckets.set(key, { valor: 0, pedidos: 0 });
      }
      valid.forEach(p => {
        const key = (p.created_at as string).slice(0, 10);
        const cur = buckets.get(key);
        if (cur) { cur.valor += Number(p.total); cur.pedidos += 1; }
      });
      setSerieFaturamento([...buckets.entries()].map(([k, v]) => ({
        data: k.slice(5).replace('-', '/'),
        valor: Number(v.valor.toFixed(2)),
        pedidos: v.pedidos,
      })));

      // Top products
      const orderIds = valid.map(o => o.id);
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
      const prodMap = new Map<string, string>((prods || []).map(p => [p.id, p.title] as [string, string]));

      setTopProdutos(topIds.map(id => ({
        title: (prodMap.get(id) || 'Produto') as string,
        vendas: prodSales.get(id)?.qty || 0,
        faturamento: prodSales.get(id)?.rev || 0,
      })));

      setKpis({
        faturamento: fat, vendas: valid.length,
        ticket: valid.length > 0 ? fat / valid.length : 0,
        clientes: uniqueClients.size,
      });
      setLoading(false);
    };
    fetch();
  }, [periodo]);

  if (loading) return <div className="p-6 flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', 'hsl(var(--muted-foreground))'];

  const chartConfig = {
    valor: { label: 'Faturamento', color: 'hsl(var(--primary))' },
    pedidos: { label: 'Pedidos', color: 'hsl(var(--accent))' },
    vendas: { label: 'Vendas', color: 'hsl(var(--primary))' },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> Relatórios</h1><p className="text-muted-foreground text-sm">Análise de vendas e desempenho</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            if (serieFaturamento.length === 0) { toast.error('Sem dados para exportar'); return; }
            const headers = 'Data,Faturamento,Pedidos\n';
            const rows = serieFaturamento.map(r => `${r.data},${r.valor.toFixed(2)},${r.pedidos}`).join('\n');
            const top = '\n\nTop Produtos\nProduto,Vendas,Faturamento\n' + topProdutos.map(p => `"${p.title}",${p.vendas},${p.faturamento.toFixed(2)}`).join('\n');
            const csv = headers + rows + top;
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `relatorio-${periodo}-${new Date().toISOString().slice(0,10)}.csv`;
            a.click(); URL.revokeObjectURL(url);
            toast.success('Relatório CSV exportado!');
          }}>
            <Download className="h-4 w-4 mr-2" />Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            if (serieFaturamento.length === 0 && topProdutos.length === 0) { toast.error('Sem dados para exportar'); return; }
            try {
              const doc = new jsPDF({ unit: 'pt', format: 'a4' });
              const pageWidth = doc.internal.pageSize.getWidth();
              const periodoLabel: Record<string, string> = { semana: 'Última Semana', mes: 'Último Mês', trimestre: 'Último Trimestre', ano: 'Último Ano' };
              const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

              // Cabeçalho
              doc.setFillColor(20, 184, 166);
              doc.rect(0, 0, pageWidth, 60, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(20);
              doc.setFont('helvetica', 'bold');
              doc.text('MIDIAS — Relatório de Vendas', 40, 30);
              doc.setFontSize(10);
              doc.setFont('helvetica', 'normal');
              doc.text(`Período: ${periodoLabel[periodo] || periodo}  ·  Gerado em ${dataAtual}`, 40, 48);

              // KPIs
              doc.setTextColor(30, 30, 30);
              doc.setFontSize(13);
              doc.setFont('helvetica', 'bold');
              doc.text('Indicadores Principais', 40, 90);
              autoTable(doc, {
                startY: 100,
                head: [['Indicador', 'Valor']],
                body: [
                  ['Faturamento Total', `R$ ${kpis.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
                  ['Total de Vendas', kpis.vendas.toString()],
                  ['Ticket Médio', `R$ ${kpis.ticket.toFixed(2)}`],
                  ['Clientes Ativos', kpis.clientes.toString()],
                ],
                theme: 'striped',
                headStyles: { fillColor: [168, 85, 247], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 6 },
                margin: { left: 40, right: 40 },
              });

              // Top produtos
              if (topProdutos.length > 0) {
                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                const lastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
                doc.text('Top Produtos Mais Vendidos', 40, lastY + 30);
                autoTable(doc, {
                  startY: lastY + 40,
                  head: [['#', 'Produto', 'Vendas', 'Faturamento']],
                  body: topProdutos.map((p, i) => [
                    `${i + 1}`,
                    p.title,
                    `${p.vendas}`,
                    `R$ ${p.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  ]),
                  theme: 'striped',
                  headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
                  styles: { fontSize: 9, cellPadding: 5 },
                  columnStyles: { 0: { cellWidth: 30 }, 2: { halign: 'center', cellWidth: 60 }, 3: { halign: 'right', cellWidth: 110 } },
                  margin: { left: 40, right: 40 },
                });
              }

              // Detalhamento por dia
              if (serieFaturamento.length > 0) {
                const lastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
                if (lastY > 700) doc.addPage();
                const startY = lastY > 700 ? 60 : lastY + 30;
                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.text('Faturamento Diário', 40, startY);
                autoTable(doc, {
                  startY: startY + 10,
                  head: [['Data', 'Faturamento', 'Pedidos']],
                  body: serieFaturamento.filter(r => r.valor > 0 || r.pedidos > 0).map(r => [
                    r.data,
                    `R$ ${r.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    `${r.pedidos}`,
                  ]),
                  theme: 'striped',
                  headStyles: { fillColor: [168, 85, 247], textColor: 255, fontStyle: 'bold' },
                  styles: { fontSize: 9, cellPadding: 5 },
                  columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' } },
                  margin: { left: 40, right: 40 },
                });
              }

              // Rodapé em todas as páginas
              const pageCount = doc.getNumberOfPages();
              for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(120, 120, 120);
                doc.text(`MIDIAS Backoffice  ·  Página ${i} de ${pageCount}`, 40, doc.internal.pageSize.getHeight() - 20);
              }

              doc.save(`relatorio-${periodo}-${new Date().toISOString().slice(0,10)}.pdf`);
              toast.success('Relatório PDF exportado!');
            } catch (e) {
              const msg = e instanceof Error ? e.message : 'Erro desconhecido';
              toast.error('Erro ao gerar PDF: ' + msg);
            }
          }}>
            <FileText className="h-4 w-4 mr-2" />Exportar PDF
          </Button>
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

      {/* Faturamento ao longo do tempo */}
      <Card className="border-border/50">
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Faturamento no Período</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={serieFaturamento}>
              <defs>
                <linearGradient id="fillValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="data" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="valor" stroke="hsl(var(--primary))" fill="url(#fillValor)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top produtos em barras */}
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base">Top 10 Produtos (Unidades)</CardTitle></CardHeader>
          <CardContent>
            {topProdutos.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">Sem vendas no período</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <BarChart data={topProdutos} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis type="category" dataKey="title" stroke="hsl(var(--muted-foreground))" fontSize={10} width={120} tickFormatter={(v) => v.length > 18 ? v.slice(0, 18) + '…' : v} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Distribuição de status */}
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-base">Status dos Pedidos</CardTitle></CardHeader>
          <CardContent>
            {statusDist.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">Sem dados</p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <PieChart>
                  <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => `${e.name}: ${e.value}`} labelLine={false} fontSize={11}>
                    {statusDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="produtos">
        <TabsList><TabsTrigger value="produtos">Detalhamento Top Produtos</TabsTrigger></TabsList>
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
