import { useState, useEffect } from 'react';
import { Megaphone, Eye, Ban, Search, Filter, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { anuncioStatusLabels, anuncioStatusColors } from '../mockData';

interface Anuncio {
  id: string; title: string; game_title: string; platform: string; price: number;
  ad_type: string; status: string; created_at: string; seller_name: string; fotos: number;
}

export default function AnunciosAdmin() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnuncios = async () => {
    setLoading(true);
    const { data } = await supabase.from('anuncios').select('*').order('created_at', { ascending: false });
    if (!data) { setLoading(false); return; }

    const sellerIds = [...new Set(data.map(a => a.seller_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', sellerIds);
    const profileMap = new Map<string, string>(profiles?.map(p => [p.id, p.display_name || 'Vendedor']) || []);

    // Count photos
    const { data: fotos } = await supabase.from('fotos_anuncio').select('anuncio_id');
    const fotoCount = new Map<string, number>();
    fotos?.forEach(f => fotoCount.set(f.anuncio_id, (fotoCount.get(f.anuncio_id) || 0) + 1));

    setAnuncios(data.map(a => ({
      id: a.id, title: a.title, game_title: a.game_title, platform: a.platform,
      price: Number(a.price), ad_type: a.ad_type, status: a.status, created_at: a.created_at,
      seller_name: profileMap.get(a.seller_id) || 'Vendedor',
      fotos: fotoCount.get(a.id) || 0,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchAnuncios(); }, []);

  const handleRemove = async (id: string) => {
    await supabase.from('anuncios').update({ status: 'removed' }).eq('id', id);
    toast({ title: 'Anúncio removido' }); fetchAnuncios();
  };

  const filtered = anuncios.filter(a => {
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.seller_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    active: anuncios.filter(a => a.status === 'active').length,
    flagged: anuncios.filter(a => a.status === 'flagged').length,
    removed: anuncios.filter(a => a.status === 'removed').length,
    sold: anuncios.filter(a => a.status === 'sold' || a.status === 'traded').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="h-6 w-6 text-primary" /> Anúncios do Marketplace</h1>
        <p className="text-muted-foreground text-sm">Gestão dos anúncios criados por usuários</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Ativos', value: counts.active, color: 'text-green-400' },
          { label: 'Sinalizados', value: counts.flagged, color: 'text-yellow-400' },
          { label: 'Removidos', value: counts.removed, color: 'text-red-400' },
          { label: 'Vendidos/Trocados', value: counts.sold, color: 'text-blue-400' },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="py-4 px-4"><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="flagged">Sinalizados</SelectItem>
            <SelectItem value="removed">Removidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Anúncio</TableHead><TableHead>Vendedor</TableHead><TableHead>Tipo</TableHead>
                  <TableHead>Plataforma</TableHead><TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-center">Status</TableHead><TableHead>Data</TableHead><TableHead className="text-center w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum anúncio</TableCell></TableRow>
                ) : filtered.map(a => (
                  <TableRow key={a.id} className="border-border hover:bg-muted/30">
                    <TableCell><p className="text-sm font-medium truncate max-w-[220px]">{a.title}</p><p className="text-xs text-muted-foreground">{a.game_title}</p></TableCell>
                    <TableCell className="text-sm">{a.seller_name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{a.ad_type === 'venda' ? 'Venda' : 'Troca'}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.platform}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{a.price > 0 ? `R$ ${a.price.toFixed(2)}` : '—'}</TableCell>
                    <TableCell className="text-center"><Badge className={anuncioStatusColors[a.status] || ''}>{anuncioStatusLabels[a.status] || a.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(a.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-center">
                      {a.status === 'active' && (
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive" onClick={() => handleRemove(a.id)}><Ban className="h-3 w-3 mr-1" />Remover</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
