import { Megaphone, Eye, Ban, Search, Filter, Image } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockAnuncios, anuncioStatusLabels, anuncioStatusColors } from '../mockData';
import { useState } from 'react';

export default function AnunciosAdmin() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = mockAnuncios.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.seller.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    active: mockAnuncios.filter(a => a.status === 'active').length,
    flagged: mockAnuncios.filter(a => a.status === 'flagged').length,
    removed: mockAnuncios.filter(a => a.status === 'removed').length,
    sold: mockAnuncios.filter(a => a.status === 'sold' || a.status === 'traded').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" /> Anúncios do Marketplace
        </h1>
        <p className="text-muted-foreground text-sm">Gestão dos anúncios criados por usuários no app mobile</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Ativos', value: counts.active, color: 'text-green-400' },
          { label: 'Sinalizados', value: counts.flagged, color: 'text-yellow-400' },
          { label: 'Removidos', value: counts.removed, color: 'text-red-400' },
          { label: 'Vendidos/Trocados', value: counts.sold, color: 'text-blue-400' },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="py-4 px-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por título ou vendedor..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="flagged">Sinalizados</SelectItem>
            <SelectItem value="removed">Removidos</SelectItem>
            <SelectItem value="sold">Vendidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Anúncio</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-center">Fotos</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-center w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(a => (
                <TableRow key={a.id} className="border-border hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium truncate max-w-[220px]">{a.title}</p>
                      <p className="text-xs text-muted-foreground">{a.game_title}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{a.seller}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {a.ad_type === 'venda' ? 'Venda' : 'Troca'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.platform}</TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {a.price > 0 ? `R$ ${a.price.toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Image className="h-3 w-3" />{a.fotos}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={anuncioStatusColors[a.status] || ''}>
                      {anuncioStatusLabels[a.status] || a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.created_at}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-1 justify-center">
                      <Button variant="ghost" size="sm" className="text-xs h-7"><Eye className="h-3 w-3 mr-1" />Ver</Button>
                      {a.status === 'active' && (
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive"><Ban className="h-3 w-3 mr-1" />Remover</Button>
                      )}
                    </div>
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