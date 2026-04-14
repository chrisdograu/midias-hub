import { useState, useEffect } from 'react';
import { ClipboardList, Search, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { statusLabels, statusColors } from '../mockData';

const allStatuses = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

interface Pedido {
  id: string; user_id: string | null; total: number; status: string; payment_method: string | null;
  created_at: string; items_count: number; cliente_name: string;
}

export default function PedidosOnline() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailPedido, setDetailPedido] = useState<Pedido | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const { toast } = useToast();

  const fetchPedidos = async () => {
    setLoading(true);
    const { data: orders } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    if (!orders) { setLoading(false); return; }

    const userIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))] as string[];
    const { data: profiles } = userIds.length > 0
      ? await supabase.from('profiles').select('id, display_name').in('id', userIds)
      : { data: [] };
    const profileMap = new Map<string, string>(profiles?.map(p => [p.id, p.display_name]) || []);

    // Get item counts
    const { data: items } = await supabase.from('itens_pedido').select('order_id');
    const itemCount = new Map<string, number>();
    items?.forEach(i => itemCount.set(i.order_id, (itemCount.get(i.order_id) || 0) + 1));

    setPedidos(orders.map(o => ({
      id: o.id, user_id: o.user_id, total: Number(o.total), status: o.status,
      payment_method: o.payment_method, created_at: o.created_at,
      items_count: itemCount.get(o.id) || 0,
      cliente_name: o.user_id ? (profileMap.get(o.user_id) || 'Cliente') : 'Anônimo',
    })));
    setLoading(false);
  };

  useEffect(() => { fetchPedidos(); }, []);

  const updateStatus = async () => {
    if (!detailPedido || !newStatus) return;
    await supabase.from('pedidos').update({ status: newStatus as any }).eq('id', detailPedido.id);
    toast({ title: 'Status atualizado!' });
    setDetailPedido(null); fetchPedidos();
  };

  const filtered = pedidos.filter(p => {
    const matchSearch = p.id.toLowerCase().includes(search.toLowerCase()) || p.cliente_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = allStatuses.slice(1).map(s => ({ status: s, count: pedidos.filter(p => p.status === s).length }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="h-6 w-6 text-primary" /> Pedidos Online</h1>
        <p className="text-muted-foreground text-sm">{pedidos.length} pedidos</p>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {statusCounts.map(({ status, count }) => (
          <Card key={status} className={`border-border/50 cursor-pointer hover:border-primary/30 transition-colors ${statusFilter === status ? 'border-primary/50' : ''}`}
            onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}>
            <CardContent className="py-3 px-4 text-center">
              <p className="text-2xl font-bold">{count}</p>
              <Badge className={`${statusColors[status]} mt-1`}>{statusLabels[status]}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardContent className="py-3 px-4 flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por ID ou cliente..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>{allStatuses.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'Todos os Status' : statusLabels[s]}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Pedido</TableHead><TableHead>Cliente</TableHead><TableHead className="text-center">Itens</TableHead>
                  <TableHead className="text-right">Total</TableHead><TableHead>Pagamento</TableHead>
                  <TableHead className="text-center">Status</TableHead><TableHead>Data</TableHead><TableHead className="text-center w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum pedido encontrado</TableCell></TableRow>
                ) : filtered.map(p => (
                  <TableRow key={p.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-mono text-sm text-primary font-semibold">{p.id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-sm">{p.cliente_name}</TableCell>
                    <TableCell className="text-center"><Badge variant="outline">{p.items_count}</Badge></TableCell>
                    <TableCell className="text-right text-sm font-semibold">R$ {p.total.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.payment_method || '—'}</TableCell>
                    <TableCell className="text-center"><Badge className={statusColors[p.status]}>{statusLabels[p.status] || p.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setDetailPedido(p); setNewStatus(p.status); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detailPedido} onOpenChange={o => { if (!o) setDetailPedido(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Pedido {detailPedido?.id.slice(0, 8)}...</DialogTitle></DialogHeader>
          {detailPedido && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Cliente</p><p className="text-sm font-medium">{detailPedido.cliente_name}</p></div>
                <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Total</p><p className="text-sm font-bold text-primary">R$ {detailPedido.total.toFixed(2)}</p></div>
                <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Pagamento</p><p className="text-sm">{detailPedido.payment_method || '—'}</p></div>
                <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Status</p><Badge className={statusColors[detailPedido.status]}>{statusLabels[detailPedido.status]}</Badge></div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Atualizar Status</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s =>
                      <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button className="w-full bg-primary text-primary-foreground" size="sm" onClick={updateStatus}><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
