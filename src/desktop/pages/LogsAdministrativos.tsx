import { useEffect, useState } from 'react';
import { Shield, Loader2, Undo2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDesktopAuth } from '@/hooks/useDesktopAuth';
import { AdminPageHeader } from '../components/AdminPageHeader';

export default function LogsAdministrativos() {
  const { position } = useDesktopAuth();
  const isAdminGeral = position === 'admin_geral';
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(300);
    setRows(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const revert = async (id: string) => {
    if (!isAdminGeral) return toast.error('Apenas admin geral pode reverter');
    if (!confirm('Reverter esta ação? Esta operação fica registrada.')) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('admin_logs')
      .update({ reverted_by: user?.id, reverted_at: new Date().toISOString() } as any).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Marcado como revertido'); load();
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Shield} title="Logs Administrativos" subtitle="Auditoria completa de ações da equipe" />
      <Card className="border-border/50"><CardContent className="p-0">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Quando</TableHead><TableHead>Ação</TableHead><TableHead>Entidade</TableHead><TableHead>Motivo</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sem logs</TableCell></TableRow> :
                rows.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm text-muted-foreground">{new Date(l.created_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="font-mono text-xs">{l.action}</TableCell>
                    <TableCell className="text-sm">{l.entity}{l.entity_id ? ` · ${l.entity_id.slice(0, 8)}` : ''}</TableCell>
                    <TableCell className="text-sm max-w-[260px] truncate">{l.reason || '—'}</TableCell>
                    <TableCell>{l.reverted_at ? <Badge variant="secondary">Revertido</Badge> : <Badge>Ativo</Badge>}</TableCell>
                    <TableCell className="text-right">
                      {!l.reverted_at && isAdminGeral && (
                        <Button size="sm" variant="outline" onClick={() => revert(l.id)}><Undo2 className="h-3.5 w-3.5 mr-1" />Reverter</Button>
                      )}
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
