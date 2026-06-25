import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Search, Download, Ban, ShieldAlert, CheckCircle2, XCircle, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminLog, exportCsv } from '../lib/adminLog';

type Action = 'resolve' | 'dismiss' | 'warn' | 'ban' | 'mark_spoiler';

export default function Denuncias() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('all');
  const [type, setType] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<{ row: any; action: Action } | null>(null);
  const [reason, setReason] = useState('');
  const [days, setDays] = useState('7');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('denuncias').select('*').order('created_at', { ascending: false }).limit(500);
    setRows(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter(r =>
    (status === 'all' || r.status === status) &&
    (type === 'all' || r.target_type === type) &&
    (!search || (r.reason || '').toLowerCase().includes(search.toLowerCase()) || (r.description || '').toLowerCase().includes(search.toLowerCase()))
  ), [rows, status, type, search]);

  const apply = async () => {
    if (!dialog) return;
    if (reason.trim().length < 4) return toast.error('Justificativa obrigatória');
    const { row, action } = dialog;
    const { data: { user } } = await supabase.auth.getUser();

    if (action === 'resolve' || action === 'dismiss') {
      const newStatus = action === 'resolve' ? 'resolved' : 'dismissed';
      const { error } = await supabase.from('denuncias').update({
        status: newStatus, resolved_by: user?.id, resolved_at: new Date().toISOString(),
      } as any).eq('id', row.id);
      if (error) return toast.error(error.message);
      await adminLog({ action: `denuncia_${action}`, entity: 'denuncia', entity_id: row.id, reason, payload: { target_type: row.target_type, target_id: row.target_id } });
    }

    if (action === 'mark_spoiler') {
      const map: Record<string, string> = { forum_post: 'forum_posts', review: 'avaliacoes' };
      const table = map[row.target_type];
      if (!table) return toast.error('Marcar spoiler só suportado em post de fórum ou review');
      const { error } = await supabase.from(table as any).update({ is_spoiler: true } as any).eq('id', row.target_id);
      if (error) return toast.error(error.message);
      await supabase.from('denuncias').update({
        status: 'resolved', resolved_by: user?.id, resolved_at: new Date().toISOString(),
      } as any).eq('id', row.id);
      await adminLog({ action: 'denuncia_mark_spoiler', entity: 'denuncia', entity_id: row.id, reason, payload: { target_type: row.target_type, target_id: row.target_id } });
    }

    if (action === 'warn' || action === 'ban') {
      // Target user lookup: for target_type='usuario' use target_id; for content types try reporter? we use target_id assumed user when usuario
      let targetUser: string | null = row.target_type === 'usuario' ? row.target_id : null;
      if (!targetUser) {
        // try to resolve owner from review/forum_post/forum_reply/mensagem/anuncio
        const map: Record<string, { table: string; col: string }> = {
          review: { table: 'avaliacoes', col: 'user_id' },
          forum_post: { table: 'forum_posts', col: 'user_id' },
          forum_reply: { table: 'forum_replies', col: 'user_id' },
          mensagem: { table: 'mensagens', col: 'sender_id' },
          anuncio: { table: 'anuncios', col: 'seller_id' },
        };
        const cfg = map[row.target_type];
        if (cfg) {
          const { data } = await supabase.from(cfg.table as any).select(cfg.col).eq('id', row.target_id).maybeSingle();
          targetUser = (data as any)?.[cfg.col] ?? null;
        }
      }
      if (!targetUser) return toast.error('Não foi possível identificar o usuário alvo');

      await supabase.from('moderation_history').insert({
        target_user_id: targetUser, moderator_id: user?.id, action,
        duration_days: action === 'ban' ? Number(days) || 7 : null,
        reason, reference_type: 'denuncia', reference_id: row.id,
      } as any);

      if (action === 'ban') {
        const until = new Date(); until.setDate(until.getDate() + (Number(days) || 7));
        await supabase.from('profiles').update({ banned_until: until.toISOString() } as any).eq('id', targetUser);
      }

      await supabase.from('denuncias').update({ status: 'resolved', resolved_by: user?.id, resolved_at: new Date().toISOString() } as any).eq('id', row.id);
      await adminLog({ action: `denuncia_${action}`, entity: 'denuncia', entity_id: row.id, reason, payload: { target_user: targetUser, duration_days: action === 'ban' ? Number(days) : null } });
    }

    toast.success('Ação aplicada e registrada');
    setDialog(null); setReason(''); setDays('7');
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={AlertTriangle} title="Denúncias" subtitle="Moderação com ações registradas em log"
        actions={<Button variant="outline" size="sm" onClick={() => exportCsv('denuncias.csv', filtered)}><Download className="h-4 w-4 mr-1" />Exportar</Button>} />

      <Card className="border-border/50"><CardContent className="p-4 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs">Buscar</Label>
          <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Motivo ou descrição..." value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="resolved">Resolvidas</SelectItem>
              <SelectItem value="dismissed">Descartadas</SelectItem>
            </SelectContent></Select>
        </div>
        <div>
          <Label className="text-xs">Tipo</Label>
          <Select value={type} onValueChange={setType}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {['usuario','review','forum_post','forum_reply','mensagem','conversa','anuncio'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent></Select>
        </div>
      </CardContent></Card>

      <Card className="border-border/50"><CardContent className="p-0">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Motivo</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma denúncia</TableCell></TableRow> :
                filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell><Badge variant="outline">{r.target_type}</Badge></TableCell>
                    <TableCell className="max-w-[320px] truncate">{r.reason}</TableCell>
                    <TableCell><Badge variant={r.status === 'pending' ? 'destructive' : 'secondary'}>{r.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {r.status === 'pending' && <>
                        <Button size="sm" variant="outline" onClick={() => { setDialog({ row: r, action: 'resolve' }); }}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Resolver</Button>
                        <Button size="sm" variant="outline" onClick={() => { setDialog({ row: r, action: 'dismiss' }); }}><XCircle className="h-3.5 w-3.5 mr-1" />Descartar</Button>
                        {(r.target_type === 'forum_post' || r.target_type === 'review') && (
                          <Button size="sm" variant="outline" onClick={() => { setDialog({ row: r, action: 'mark_spoiler' }); }}><EyeOff className="h-3.5 w-3.5 mr-1" />Marcar spoiler</Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => { setDialog({ row: r, action: 'warn' }); }}><ShieldAlert className="h-3.5 w-3.5 mr-1" />Advertir</Button>
                        <Button size="sm" variant="destructive" onClick={() => { setDialog({ row: r, action: 'ban' }); }}><Ban className="h-3.5 w-3.5 mr-1" />Banir</Button>
                      </>}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ação: {dialog?.action}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Esta ação fica registrada em admin_logs e moderation_history.</p>
          <div><Label>Justificativa</Label><Textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} /></div>
          {dialog?.action === 'ban' && <div><Label>Dias de banimento</Label><Input type="number" min={1} value={days} onChange={e => setDays(e.target.value)} /></div>}
          <Button onClick={apply}>Aplicar</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
