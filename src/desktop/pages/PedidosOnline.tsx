import { useState } from 'react';
import { ClipboardList, Search, Eye, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockPedidosOnline, statusLabels, statusColors } from '../mockData';

const allStatuses = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function PedidosOnline() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = mockPedidosOnline.filter(p => {
    const matchSearch = p.id.toLowerCase().includes(search.toLowerCase()) || p.cliente.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="h-6 w-6 text-primary" /> Pedidos Online</h1>
        <p className="text-muted-foreground text-sm">{mockPedidosOnline.length} pedidos do e-commerce</p>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => {
          const count = mockPedidosOnline.filter(p => p.status === status).length;
          return (
            <Card key={status} className={`border-border/50 cursor-pointer hover:border-primary/30 transition-colors ${statusFilter === status ? 'border-primary/50' : ''}`}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}>
              <CardContent className="py-3 px-4 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <Badge className={`${statusColors[status]} mt-1`}>{statusLabels[status]}</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/50">
        <CardContent className="py-3 px-4 flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por ID ou cliente..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {allStatuses.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'Todos os Status' : statusLabels[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-center">Itens</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-center w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id} className="border-border hover:bg-muted/30">
                  <TableCell className="font-mono text-sm text-primary font-semibold">{p.id}</TableCell>
                  <TableCell className="text-sm">{p.cliente}</TableCell>
                  <TableCell className="text-center"><Badge variant="outline">{p.items}</Badge></TableCell>
                  <TableCell className="text-right text-sm font-semibold">R$ {p.total.toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.payment_method}</TableCell>
                  <TableCell className="text-center"><Badge className={statusColors[p.status]}>{statusLabels[p.status]}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.created_at}</TableCell>
                  <TableCell className="text-center flex gap-1 justify-center">
                    <Dialog>
                      <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button></DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Pedido {p.id}</DialogTitle></DialogHeader>
                        <div className="space-y-3 py-2">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Cliente</p><p className="text-sm font-medium">{p.cliente}</p></div>
                            <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Total</p><p className="text-sm font-bold text-primary">R$ {p.total.toFixed(2)}</p></div>
                            <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Pagamento</p><p className="text-sm">{p.payment_method}</p></div>
                            <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Status</p><Badge className={statusColors[p.status]}>{statusLabels[p.status]}</Badge></div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Atualizar Status</p>
                            <Select defaultValue={p.status}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s =>
                                  <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <Button className="w-full bg-primary text-primary-foreground" size="sm"><RefreshCw className="h-4 w-4 mr-2" />Atualizar</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
