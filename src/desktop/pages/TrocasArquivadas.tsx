import { useEffect, useMemo, useState } from 'react';
import { Library, Loader2, Search, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { exportCsv } from '../lib/adminLog';

export default function TrocasArquivadas() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('trade_proposals')
        .select('*').in('status', ['accepted', 'rejected', 'cancelled'])
        .order('updated_at', { ascending: false }).limit(1000);
      setRows(data || []); setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => rows.filter(r => {
    if (status !== 'all' && r.status !== status) return false;
    if (search && !(r.offered_item || '').toLowerCase().includes(search.toLowerCase()) && !(r.proposer_id || '').includes(search)) return false;
    const d = new Date(r.updated_at || r.created_at);
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(to + 'T23:59:59')) return false;
    return true;
  }), [rows, status, search, from, to]);

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Library} title="Trocas Arquivadas" subtitle="Histórico de propostas finalizadas"
        actions={<Button variant="outline" size="sm" onClick={() => exportCsv('trocas.csv', filtered)}><Download className="h-4 w-4 mr-1" />Exportar</Button>} />

      <Card className="border-border/50"><CardContent className="p-4 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]"><Label className="text-xs">Buscar</Label>
          <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Item ou user id..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
        <div><Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="accepted">Aceitas</SelectItem>
              <SelectItem value="rejected">Recusadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent></Select></div>
        <div><Label className="text-xs">De</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-[150px]" /></div>
        <div><Label className="text-xs">Até</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-[150px]" /></div>
      </CardContent></Card>

      <Card className="border-border/50"><CardContent className="p-0">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Status</TableHead><TableHead>Item oferecido</TableHead><TableHead>Proponente</TableHead><TableHead>Atualizado</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sem trocas arquivadas</TableCell></TableRow> :
                filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}</TableCell>
                    <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                    <TableCell className="truncate max-w-[260px]">{r.offered_item}</TableCell>
                    <TableCell className="font-mono text-xs">{r.proposer_id?.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(r.updated_at || r.created_at).toLocaleString('pt-BR')}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
