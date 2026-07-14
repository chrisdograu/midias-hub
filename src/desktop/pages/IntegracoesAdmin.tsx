import { useEffect, useState } from 'react';
import { Plug, Loader2, Plus, Send, Trash2, Download, Search, Pencil, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminLog, exportCsv } from '../lib/adminLog';
import { useAdminTable, useFilteredSorted } from '../hooks/useAdminTable';
import EntityTimelineDrawer from '../components/EntityTimelineDrawer';

const EVENT_OPTIONS = [
  'order.created', 'order.confirmed', 'user.registered',
  'review.created', 'denuncia.created', 'tournament.finished', 'custom',
];

export default function IntegracoesAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; edit?: any }>({ open: false });
  const [form, setForm] = useState({ name: '', url: '', event: 'order.created', secret: '', active: true });
  const [timeline, setTimeline] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const { state, setSearch, setPage, setExtra } = useAdminTable('integracoes');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('integration_webhooks').select('*').order('created_at', { ascending: false });
    setRows(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter(r => state.extras.active === 'true' ? r.active : state.extras.active === 'false' ? !r.active : true);
  const { items, total, totalPages, page } = useFilteredSorted(filtered, state, ['name', 'url', 'event']);

  const openCreate = () => { setForm({ name: '', url: '', event: 'order.created', secret: '', active: true }); setDialog({ open: true }); };
  const openEdit = (r: any) => { setForm({ name: r.name, url: r.url, event: r.event, secret: r.secret || '', active: r.active }); setDialog({ open: true, edit: r }); };

  const save = async () => {
    if (!form.name.trim() || !form.url.trim()) { toast.error('Preencha nome e URL'); return; }
    try { new URL(form.url); } catch { toast.error('URL inválida'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (dialog.edit) {
      const { error } = await supabase.from('integration_webhooks').update(form).eq('id', dialog.edit.id);
      if (error) return toast.error(error.message);
      await adminLog({ action: 'webhook_update', entity: 'integration_webhook', entity_id: dialog.edit.id, payload: form });
    } else {
      const { data, error } = await supabase.from('integration_webhooks').insert({ ...form, created_by: user?.id } as any).select('id').single();
      if (error) return toast.error(error.message);
      await adminLog({ action: 'webhook_create', entity: 'integration_webhook', entity_id: data.id, payload: form });
    }
    setDialog({ open: false }); load(); toast.success('Salvo');
  };

  const remove = async (r: any) => {
    if (!confirm(`Excluir webhook "${r.name}"?`)) return;
    const { error } = await supabase.from('integration_webhooks').delete().eq('id', r.id);
    if (error) return toast.error(error.message);
    await adminLog({ action: 'webhook_delete', entity: 'integration_webhook', entity_id: r.id, payload: { name: r.name } });
    load();
  };

  const test = async (r: any) => {
    toast.info('Enviando ping…');
    let status = 'failed';
    try {
      const res = await fetch(r.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(r.secret ? { 'X-Webhook-Secret': r.secret } : {}) },
        body: JSON.stringify({ event: 'ping', test: true, at: new Date().toISOString() }),
      });
      status = res.ok ? `ok ${res.status}` : `http ${res.status}`;
    } catch (e: any) { status = `error: ${String(e?.message || e).slice(0, 80)}`; }
    await supabase.from('integration_webhooks').update({ last_test_status: status, last_test_at: new Date().toISOString() } as any).eq('id', r.id);
    await adminLog({ action: 'webhook_test', entity: 'integration_webhook', entity_id: r.id, payload: { status } });
    toast.success(`Resultado: ${status}`); load();
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Plug} title="Integrações" subtitle="Webhooks e chaves externas"
        actions={<>
          <Button variant="outline" size="sm" onClick={() => exportCsv('webhooks.csv', items)}><Download className="h-4 w-4 mr-1" />Exportar</Button>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Novo webhook</Button>
        </>} />

      <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-3 text-sm text-yellow-200">
        <b>Em construção:</b> os webhooks cadastrados aqui podem ser testados manualmente (botão "Testar"), mas ainda não são disparados automaticamente em eventos do sistema (novo pedido, novo usuário, denúncia etc.). O disparo automático depende de uma edge function dedicada, ainda não implementada.
      </div>

      <Card className="border-border/50"><CardContent className="p-4 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs">Buscar</Label>
          <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="nome, url ou evento" value={state.search} onChange={e => setSearch(e.target.value)} /></div>
        </div>
        <div>
          <Label className="text-xs">Status</Label>
          <select value={state.extras.active ?? 'all'} onChange={e => setExtra('active', e.target.value === 'all' ? '' : e.target.value)}
            className="bg-background border border-border rounded-md px-2 py-1.5 text-sm h-9">
            <option value="all">Todos</option><option value="true">Ativos</option><option value="false">Inativos</option>
          </select>
        </div>
      </CardContent></Card>

      <Card className="border-border/50"><CardContent className="p-0">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> :
          items.length === 0 ? <p className="py-12 text-center text-muted-foreground">Nenhum webhook cadastrado</p> : (
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nome</TableHead><TableHead>Evento</TableHead><TableHead>URL</TableHead>
              <TableHead>Status</TableHead><TableHead>Último teste</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell><Badge variant="outline" className="font-mono text-[10px]">{r.event}</Badge></TableCell>
                  <TableCell className="font-mono text-xs max-w-[280px] truncate">{r.url}</TableCell>
                  <TableCell>{r.active ? <Badge>Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</TableCell>
                  <TableCell className="text-xs">
                    {r.last_test_status ? <span className={r.last_test_status.startsWith('ok') ? 'text-green-500' : 'text-destructive'}>{r.last_test_status}</span> : '—'}
                    {r.last_test_at && <div className="text-[10px] text-muted-foreground">{new Date(r.last_test_at).toLocaleString('pt-BR')}</div>}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="outline" onClick={() => test(r)}><Send className="h-3.5 w-3.5 mr-1" />Testar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setTimeline({ open: true, id: r.id })}><Activity className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(r)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} registros</span>
        <div className="flex gap-2 items-center">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
          <span>Página {page} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Próxima</Button>
        </div>
      </div>

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ open: o })}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialog.edit ? 'Editar webhook' : 'Novo webhook'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>URL</Label><Input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://..." /></div>
            <div><Label>Evento</Label>
              <select value={form.event} onChange={e => setForm({ ...form, event: e.target.value })} className="w-full bg-background border border-border rounded-md p-2 text-sm">
                {EVENT_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div><Label>Secret (opcional, enviado no header X-Webhook-Secret)</Label><Input value={form.secret} onChange={e => setForm({ ...form, secret: e.target.value })} /></div>
            <div className="flex items-center justify-between bg-secondary/40 rounded-lg p-3">
              <Label>Ativo</Label>
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
            <Button className="w-full" onClick={save}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <EntityTimelineDrawer open={timeline.open} onOpenChange={(o) => setTimeline({ open: o, id: o ? timeline.id : null })}
        entity="integration_webhook" entityId={timeline.id} title="Timeline do webhook" />
    </div>
  );
}
