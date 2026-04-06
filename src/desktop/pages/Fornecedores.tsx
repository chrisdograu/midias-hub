import { useState } from 'react';
import { Truck, Plus, Search, Edit, MoreHorizontal, Trash2, Eye, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { mockFornecedores } from '../mockData';

export default function Fornecedores() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = mockFornecedores.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.cnpj.includes(search)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Truck className="h-6 w-6 text-primary" /> Fornecedores</h1>
          <p className="text-muted-foreground text-sm">{mockFornecedores.length} fornecedores</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" />Novo Fornecedor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Cadastrar Fornecedor</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Nome da Empresa</Label><Input placeholder="Nome" /></div>
              <div className="space-y-2"><Label>CNPJ</Label><Input placeholder="00.000.000/0001-00" /></div>
              <div className="space-y-2"><Label>Nome do Contato</Label><Input placeholder="Pessoa de contato" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="contato@empresa.com" /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input placeholder="(11) 3333-0000" /></div>
              </div>
              <div className="space-y-2"><Label>Observações</Label><Textarea placeholder="Notas sobre o fornecedor" rows={2} /></div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button className="bg-primary text-primary-foreground" onClick={() => setDialogOpen(false)}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50">
        <CardContent className="py-3 px-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar fornecedor..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Produtos</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center w-16">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f) => (
                <TableRow key={f.id} className="border-border hover:bg-muted/30">
                  <TableCell className="font-medium text-sm">{f.name}</TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">{f.cnpj}</TableCell>
                  <TableCell className="text-sm">{f.contact_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{f.email}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="gap-1"><Package className="h-3 w-3" />{f.produtos_count}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={f.is_active ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}>
                      {f.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />Visualizar</DropdownMenuItem>
                        <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
