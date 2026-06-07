import { useEffect, useState } from 'react';
import { Library, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AdminPageHeader } from '../components/AdminPageHeader';

export default function TrocasArquivadas() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('trade_proposals')
        .select('*').in('status', ['accepted', 'rejected', 'cancelled'])
        .order('updated_at', { ascending: false });
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Library} title="Trocas Arquivadas" subtitle="Histórico de propostas finalizadas" />
      <Card className="border-border/50"><CardContent className="p-0">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Status</TableHead><TableHead>Item oferecido</TableHead><TableHead>Atualizado</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sem trocas arquivadas</TableCell></TableRow> :
                rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}</TableCell>
                    <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                    <TableCell className="truncate max-w-[260px]">{r.offered_item}</TableCell>
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
