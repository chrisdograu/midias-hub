import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminPageHeader } from '../components/AdminPageHeader';

export default function Denuncias() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('denuncias').select('*').order('created_at', { ascending: false }).limit(200);
    setRows(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const resolve = async (id: string, status: 'resolved' | 'dismissed') => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('denuncias').update({ status, resolved_by: user?.id, resolved_at: new Date().toISOString() } as any).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Denúncia atualizada'); load();
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={AlertTriangle} title="Denúncias" subtitle="Relatos de usuários sobre conteúdo ou comportamento" />
      <Card className="border-border/50"><CardContent className="p-0">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Motivo</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma denúncia</TableCell></TableRow> :
                rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell><Badge variant="outline">{r.target_type}</Badge></TableCell>
                    <TableCell className="max-w-[300px] truncate">{r.reason}</TableCell>
                    <TableCell><Badge variant={r.status === 'pending' ? 'destructive' : 'secondary'}>{r.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {r.status === 'pending' && <>
                        <Button size="sm" onClick={() => resolve(r.id, 'resolved')}>Resolver</Button>
                        <Button size="sm" variant="outline" onClick={() => resolve(r.id, 'dismissed')}>Descartar</Button>
                      </>}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
