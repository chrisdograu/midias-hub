import { useEffect, useState } from 'react';
import { Trophy, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AdminPageHeader } from '../components/AdminPageHeader';

export default function TorneiosEventos() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('tournaments')
        .select('id,title,event_state,starts_at,ends_at,winner_id,hype_score')
        .in('event_state', ['finished', 'archived'])
        .order('ends_at', { ascending: false });
      setRows(data || []); setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Trophy} title="Eventos (Histórico)" subtitle="Torneios finalizados e arquivados" />
      <Card className="border-border/50"><CardContent className="p-0">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Torneio</TableHead><TableHead>Estado</TableHead><TableHead>Hype</TableHead><TableHead>Encerrou em</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum evento encerrado</TableCell></TableRow> :
                rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell><Badge variant="secondary">{r.event_state}</Badge></TableCell>
                    <TableCell>{r.hype_score ?? 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.ends_at ? new Date(r.ends_at).toLocaleString('pt-BR') : '—'}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
