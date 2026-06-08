import { useEffect, useMemo, useState } from 'react';
import { Shield, Loader2, Undo2, Download, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDesktopAuth } from '@/hooks/useDesktopAuth';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminLog, exportCsv } from '../lib/adminLog';

export default function LogsAdministrativos() {
  const { position } = useDesktopAuth();
  const isAdminGeral = position === 'admin';
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(1000);
    setRows(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const entities = useMemo(() => Array.from(new Set(rows.map(r => r.entity).filter(Boolean))), [rows]);

  const filtered = useMemo(() => rows.filter(r => {
    if (entity !== 'all' && r.entity !== entity) return false;
    if (statusFilter === 'reverted' && !r.reverted_at) return false;
    if (statusFilter === 'active' && r.reverted_at) return false;
    if (from && new Date(r.created_at) < new Date(from)) return false;
    if (to && new Date(r.created_at) > new Date(to + 'T23:59:59')) return false;
    if (search) {
      const s = search.toLowerCase();
      if (![r.action, r.reason, r.entity_id].some(v => (v || '').toString().toLowerCase().includes(s))) return false;
    }
    return true;
  }), [rows, entity, statusFilter, from, to, search]);

  const revert = async (r: any) => {
    if (!isAdminGeral) return toast.error('Apenas admin geral pode reverter');
    const reason = prompt('Justificativa da reversão:'); if (!reason || reason.trim().length < 4) return;
    const { data: { user } } = await supabase.auth.getUser();

    // Reversões específicas por tipo
    try {
      if (r.action === 'denuncia_resolve' || r.action === 'denuncia_dismiss') {
        await supabase.from('denuncias').update({ status: 'pending', resolved_by: null, resolved_at: null } as any).eq('id', r.entity_id);
      } else if (r.action === 'denuncia_ban' && r.payload?.target_user) {
        await supabase.from('profiles').update({ banned_until: null } as any).eq('id', r.payload.target_user);
      } else if (r.action === 'titulo_revoke' && r.payload) {
        await supabase.from('user_titles').insert(r.payload as any);
      }
    } catch (e: any) { /* ignore — ainda marca como revertido */ }

    const { error } = await supabase.from('admin_logs')
      .update({ reverted_by: user?.id, reverted_at: new Date().toISOString() } as any).eq('id', r.id);
    if (error) return toast.error(error.message);
    await adminLog({ action: 'log_revert', entity: 'admin_log', entity_id: r.id, reason, payload: { original_action: r.action } });
    toast.success('Revertido'); load();
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Shield} title="Logs Administrativos" subtitle="Auditoria completa de ações da equipe"
        actions={<Button variant="outline" size="sm" onClick={() => exportCsv('admin_logs.csv', filtered)}><Download className="h-4 w-4 mr-1" />Exportar</Button>} />

      <Card className="border-border/50"><CardContent className="p-4 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]"><Label className="text-xs">Buscar</Label>
          <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="ação, motivo, id..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
        <div><Label className="text-xs">Entidade</Label>
          <Select value={entity} onValueChange={setEntity}><SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas</SelectItem>{entities.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="active">Ativos</SelectItem><SelectItem value="reverted">Revertidos</SelectItem></SelectContent></Select></div>
        <div><Label className="text-xs">De</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-[150px]" /></div>
        <div><Label className="text-xs">Até</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-[150px]" /></div>
      </CardContent></Card>

      <Card className="border-border/50"><CardContent className="p-0">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Quando</TableHead><TableHead>Ação</TableHead><TableHead>Entidade</TableHead><TableHead>Motivo</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sem logs</TableCell></TableRow> :
                filtered.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm text-muted-foreground">{new Date(l.created_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="font-mono text-xs">{l.action}</TableCell>
                    <TableCell className="text-sm">{l.entity}{l.entity_id ? ` · ${String(l.entity_id).slice(0, 8)}` : ''}</TableCell>
                    <TableCell className="text-sm max-w-[260px] truncate">{l.reason || '—'}</TableCell>
                    <TableCell>{l.reverted_at ? <Badge variant="secondary">Revertido</Badge> : <Badge>Ativo</Badge>}</TableCell>
                    <TableCell className="text-right">
                      {!l.reverted_at && isAdminGeral && (
                        <Button size="sm" variant="outline" onClick={() => revert(l)}><Undo2 className="h-3.5 w-3.5 mr-1" />Reverter</Button>
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
