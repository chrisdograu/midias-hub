import { useState, useEffect, useMemo } from 'react';
import { Warehouse, ArrowDownToLine, ArrowUpFromLine, RefreshCw, Search, AlertTriangle, Plus, Loader2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Produto = Tables<'produtos'>;
type Mov = Tables<'movimentacoes_estoque'>;

const movTypeColors: Record<string, string> = { entrada: 'bg-green-500/20 text-green-400', saida: 'bg-red-500/20 text-red-400', ajuste: 'bg-yellow-500/20 text-yellow-400' };
const movTypeIcons: Record<string, typeof ArrowDownToLine> = { entrada: ArrowDownToLine, saida: ArrowUpFromLine, ajuste: RefreshCw };

export default function Estoque() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movs, setMovs] = useState<(Mov & { product_name: string; employee_name: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [fType, setFType] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [fProduct, setFProduct] = useState('');
  const [fQty, setFQty] = useState('');
  const [fNotes, setFNotes] = useState('');
  const [chartDays, setChartDays] = useState(30);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: prods }, { data: rawMovs }] = await Promise.all([
      supabase.from('produtos').select('*').order('title'),
      supabase.from('movimentacoes_estoque').select('*').order('created_at', { ascending: false }).limit(500),
    ]);
    setProdutos(prods || []);

    // Resolve product names
    const prodMap = new Map<string, string>((prods || []).map(p => [p.id, p.title]));
    // Resolve employee names
    const empIds = [...new Set((rawMovs || []).map(m => m.employee_id).filter(Boolean))] as string[];
    const { data: profiles } = empIds.length > 0 ? await supabase.from('profiles').select('id, display_name').in('id', empIds) : { data: [] };
    const empMap = new Map<string, string>((profiles || []).map(p => [p.id, p.display_name || 'Funcionário'] as [string, string]));

    setMovs((rawMovs || []).map(m => ({
      ...m, product_name: prodMap.get(m.product_id) || 'Produto', employee_name: (m.employee_id ? (empMap.get(m.employee_id) || '—') : '—') as string,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreateMov = async () => {
    if (!fProduct || !fQty) { toast({ title: 'Preencha produto e quantidade', variant: 'destructive' }); return; }
    setSaving(true);
    const prod = produtos.find(p => p.id === fProduct);
    if (!prod) { setSaving(false); return; }

    const qty = Number(fQty);
    const before = prod.stock;
    let after = before;
    if (fType === 'entrada') after = before + qty;
    else if (fType === 'saida') after = Math.max(0, before - qty);
    else after = qty; // ajuste sets absolute value

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('movimentacoes_estoque').insert({
      product_id: fProduct, type: fType as any, quantity: qty,
      quantity_before: before, quantity_after: after,
      employee_id: user?.id || null, notes: fNotes || null,
    });
    await supabase.from('produtos').update({ stock: after }).eq('id', fProduct);

    toast({ title: 'Movimentação registrada!' });
    setSaving(false); setDialogOpen(false); setFProduct(''); setFQty(''); setFNotes(''); setFType('entrada');
    fetchAll();
  };

  const alertProducts = produtos.filter(p => p.stock <= p.stock_alert_threshold);

  const chartData = useMemo(() => {
    const days: { date: string; label: string; entrada: number; saida: number }[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      days.push({ date: iso, label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), entrada: 0, saida: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));
    movs.forEach(m => {
      const k = m.created_at.slice(0, 10);
      const i = idx.get(k); if (i === undefined) return;
      if (m.type === 'entrada') days[i].entrada += m.quantity;
      else if (m.type === 'saida') days[i].saida += m.quantity;
    });
    return days;
  }, [movs, chartDays]);

  if (loading) return <div className="p-6 flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Warehouse className="h-6 w-6 text-primary" /> Estoque</h1>
          <p className="text-muted-foreground text-sm">Gestão de movimentações</p>
        </div>
        <Button className="bg-primary text-primary-foreground" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Nova Movimentação</Button>
      </div>

      {alertProducts.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-400">{alertProducts.length} produto(s) com estoque baixo ou zerado</p>
              <p className="text-xs text-muted-foreground">{alertProducts.map(p => p.title).join(', ')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Movimentações
          </CardTitle>
          <div className="flex gap-1">
            {[7, 30, 90].map(d => (
              <Button key={d} size="sm" variant={chartDays === d ? 'default' : 'outline'}
                className="h-7 text-xs px-2" onClick={() => setChartDays(d)}>
                {d}d
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="entrada" name="Entradas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saida" name="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs defaultValue="movimentacoes">
        <TabsList>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
          <TabsTrigger value="atual">Estoque Atual</TabsTrigger>
        </TabsList>

        <TabsContent value="movimentacoes" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Tipo</TableHead><TableHead>Produto</TableHead><TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-center">Antes</TableHead><TableHead className="text-center">Depois</TableHead>
                    <TableHead>Funcionário</TableHead><TableHead>Observação</TableHead><TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movs.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma movimentação</TableCell></TableRow>
                  ) : movs.map(m => {
                    const Icon = movTypeIcons[m.type] || RefreshCw;
                    return (
                      <TableRow key={m.id} className="border-border hover:bg-muted/30">
                        <TableCell><Badge className={movTypeColors[m.type]}><Icon className="h-3 w-3 mr-1" />{m.type.charAt(0).toUpperCase() + m.type.slice(1)}</Badge></TableCell>
                        <TableCell className="text-sm font-medium">{m.product_name}</TableCell>
                        <TableCell className="text-center text-sm font-mono">{m.type === 'saida' ? `-${m.quantity}` : m.type === 'ajuste' ? m.quantity : `+${m.quantity}`}</TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">{m.quantity_before}</TableCell>
                        <TableCell className="text-center text-sm font-medium">{m.quantity_after}</TableCell>
                        <TableCell className="text-sm">{m.employee_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{m.notes || '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(m.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="atual" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="py-3 px-4 mb-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar produto..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </CardContent>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead></TableHead><TableHead>Produto</TableHead><TableHead>Plataforma</TableHead>
                    <TableHead className="text-center">Estoque</TableHead><TableHead className="text-center">Mínimo</TableHead><TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtos.filter(p => p.title.toLowerCase().includes(search.toLowerCase())).map(p => (
                    <TableRow key={p.id} className="border-border hover:bg-muted/30">
                      <TableCell>{p.image_url ? <img src={p.image_url} alt="" className="w-8 h-8 rounded" /> : <div className="w-8 h-8 rounded bg-muted" />}</TableCell>
                      <TableCell className="font-medium text-sm">{p.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{(p.platform || []).join(', ')}</TableCell>
                      <TableCell className="text-center text-sm font-mono font-bold">{p.stock}</TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">{p.stock_alert_threshold}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={p.stock === 0 ? 'bg-red-500/20 text-red-400' : p.stock <= p.stock_alert_threshold ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}>
                          {p.stock === 0 ? 'Sem Estoque' : p.stock <= p.stock_alert_threshold ? 'Baixo' : 'Normal'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Movimentação</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Tipo</Label>
              <Select value={fType} onValueChange={v => setFType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="ajuste">Ajuste (Inventário)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Produto</Label>
              <Select value={fProduct} onValueChange={setFProduct}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{produtos.map(p => <SelectItem key={p.id} value={p.id}>{p.title} (Est: {p.stock})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Quantidade</Label><Input type="number" placeholder="0" value={fQty} onChange={e => setFQty(e.target.value)} /></div>
            <div className="space-y-2"><Label>Observação</Label><Textarea placeholder="Motivo da movimentação" rows={2} value={fNotes} onChange={e => setFNotes(e.target.value)} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-primary text-primary-foreground" onClick={handleCreateMov} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Registrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
