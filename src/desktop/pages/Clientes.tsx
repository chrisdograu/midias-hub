import { useState } from 'react';
import { Users, Search, Eye, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { mockClientes } from '../mockData';

export default function Clientes() {
  const [search, setSearch] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<typeof mockClientes[0] | null>(null);

  const filtered = mockClientes.filter(c =>
    c.display_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.cpf.includes(search)
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> Clientes</h1>
        <p className="text-muted-foreground text-sm">{mockClientes.length} clientes cadastrados</p>
      </div>

      <Card className="border-border/50">
        <CardContent className="py-3 px-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome, email ou CPF..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Cliente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead className="text-center">Compras</TableHead>
                <TableHead className="text-right">Total Gasto</TableHead>
                <TableHead>Desde</TableHead>
                <TableHead className="text-center w-16">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="border-border hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">
                          {c.display_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{c.display_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.email}</TableCell>
                  <TableCell className="text-sm">{c.phone}</TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">{c.cpf}</TableCell>
                  <TableCell className="text-center"><Badge variant="outline">{c.total_compras}</Badge></TableCell>
                  <TableCell className="text-right text-sm font-medium text-primary">R$ {c.total_gasto.toFixed(2)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-center">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedCliente(c)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Detalhes do Cliente</DialogTitle></DialogHeader>
                        {selectedCliente && (
                          <div className="space-y-4 py-2">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-14 w-14">
                                <AvatarFallback className="bg-accent/10 text-accent text-lg font-bold">
                                  {selectedCliente.display_name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-lg">{selectedCliente.display_name}</h3>
                                <p className="text-sm text-muted-foreground">{selectedCliente.email}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">CPF</p>
                                <p className="font-mono text-sm">{selectedCliente.cpf}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Telefone</p>
                                <p className="text-sm">{selectedCliente.phone}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Total de Compras</p>
                                <p className="text-lg font-bold text-primary flex items-center gap-1"><ShoppingBag className="h-4 w-4" />{selectedCliente.total_compras}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground">Total Gasto</p>
                                <p className="text-lg font-bold text-accent">R$ {selectedCliente.total_gasto.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        )}
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
