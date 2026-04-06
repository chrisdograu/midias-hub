import { useState } from 'react';
import { Warehouse, ArrowDownToLine, ArrowUpFromLine, RefreshCw, Search, AlertTriangle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { mockProdutos, mockMovimentacoes } from '../mockData';

const movTypeColors: Record<string, string> = {
  entrada: 'bg-green-500/20 text-green-400',
  saida: 'bg-red-500/20 text-red-400',
  ajuste: 'bg-yellow-500/20 text-yellow-400',
};
const movTypeIcons: Record<string, typeof ArrowDownToLine> = {
  entrada: ArrowDownToLine,
  saida: ArrowUpFromLine,
  ajuste: RefreshCw,
};

export default function Estoque() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const alertProducts = mockProdutos.filter(p => p.stock <= p.stock_alert_threshold);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Warehouse className="h-6 w-6 text-primary" /> Estoque</h1>
          <p className="text-muted-foreground text-sm">Gestão de movimentações</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Nova Movimentação</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Movimentação</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Tipo</Label>
                <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="ajuste">Ajuste (Inventário)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Produto</Label>
                <Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{mockProdutos.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Quantidade</Label><Input type="number" placeholder="0" /></div>
              <div className="space-y-2"><Label>Observação</Label><Textarea placeholder="Motivo da movimentação" rows={2} /></div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-primary text-primary-foreground" onClick={() => setDialogOpen(false)}>Registrar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alert Banner */}
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
                    <TableHead>Tipo</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-center">Antes</TableHead>
                    <TableHead className="text-center">Depois</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMovimentacoes.map(m => {
                    const Icon = movTypeIcons[m.type];
                    return (
                      <TableRow key={m.id} className="border-border hover:bg-muted/30">
                        <TableCell>
                          <Badge className={movTypeColors[m.type]}>
                            <Icon className="h-3 w-3 mr-1" />
                            {m.type.charAt(0).toUpperCase() + m.type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{m.product}</TableCell>
                        <TableCell className="text-center text-sm font-mono">{m.type === 'saida' ? `-${m.quantity}` : m.type === 'ajuste' ? m.quantity : `+${m.quantity}`}</TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">{m.quantity_before}</TableCell>
                        <TableCell className="text-center text-sm font-medium">{m.quantity_after}</TableCell>
                        <TableCell className="text-sm">{m.employee}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{m.notes}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.created_at}</TableCell>
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
                <Input placeholder="Buscar produto..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </CardContent>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead></TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead className="text-center">Estoque</TableHead>
                    <TableHead className="text-center">Mínimo</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProdutos.filter(p => p.title.toLowerCase().includes(search.toLowerCase())).map(p => (
                    <TableRow key={p.id} className="border-border hover:bg-muted/30">
                      <TableCell><img src={p.image_url} alt="" className="w-8 h-8 rounded" /></TableCell>
                      <TableCell className="font-medium text-sm">{p.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{p.platform}</TableCell>
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
    </div>
  );
}
