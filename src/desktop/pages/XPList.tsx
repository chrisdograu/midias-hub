import { useEffect, useMemo, useState } from 'react';
import { Zap, Loader2, Plus, Download, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminLog, exportCsv } from '../lib/adminLog';

interface Props { platform: 'mobile' | 'web' }

const MOBILE_ACTIONS = ['forum_post', 'forum_reply', 'tournament_rank_1', 'tournament_rank_2', 'tournament_rank_3', 'tournament_signup'];
const WEB_ACTIONS = ['purchase', 'review'];

export default function XPList({ platform }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ user_id: '', xp: '50', reason: '' });

  const load = async () => {
    setLoading(true);
    const actions = platform === 'mobile' ? MOBILE_ACTIONS : WEB_ACTIONS;
    const { data } = await supabase.from('user_xp_log').select('user_id, action, xp, created_at, reference_type, reference_id')
      .in('action', [...actions, 'admin_grant']).order('created_at', { ascending: false }).limit(500);
    setRows(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, [platform]);

  const filtered = useMemo(() => rows.filter(r => {
    if (search && !r.user_id.includes(search) && !r.action.includes(search)) return false;
    const d = new Date(r.created_at);
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(to + 'T23:59:59')) return false;
    return true;
  }), [rows, search, from, to]);

  const grant = async () => {
    const xp = Number(form.xp);
    if (!form.user_id || !xp) return toast.error('Preencha user e XP');
    if (form.reason.trim().length < 4) return toast.error('Justificativa obrigatória');
    const { error } = await supabase.rpc('award_xp' as any, { _user_id: form.user_id, _action: 'admin_grant', _xp: xp, _ref_type: 'admin', _ref_id: null });
    if (error) return toast.error(error.message);
    await adminLog({ action: 'xp_grant', entity: 'user_xp_log', entity_id: form.user_id, reason: form.reason, payload: { xp, platform } });
    toast.success(`+${xp} XP concedido`); setOpen(false); setForm({ user_id: '', xp: '50', reason: '' }); load();
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Zap} title={`XP ${platform === 'mobile' ? 'Mobile' : 'Web'}`}
        subtitle={`Distribuição e ajuste manual de XP na plataforma ${platform}`}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => exportCsv(`xp_${platform}.csv`, filtered)}><Download className="h-4 w-4 mr-1" />Exportar</Button>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" />Conceder XP</Button>
        </>} />

      <Card className="border-border/50"><CardContent className="p-4 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]"><Label className="text-xs">Buscar</Label>
          <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="user id ou ação..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
        <div><Label className="text-xs">De</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-[150px]" /></div>
        <div><Label className="text-xs">Até</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-[150px]" /></div>
      </CardContent></Card>

      <Card className="border-border/50"><CardContent className="p-0">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Ação</TableHead><TableHead>XP</TableHead><TableHead>Quando</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Sem registros</TableCell></TableRow> :
                filtered.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{r.user_id.slice(0, 8)}</TableCell>
                    <TableCell>{r.action}</TableCell>
                    <TableCell className="font-bold text-primary">+{r.xp}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString('pt-BR')}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Conceder XP manual</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>User ID</Label><Input value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} placeholder="UUID" /></div>
            <div><Label>XP</Label><Input type="number" value={form.xp} onChange={e => setForm({ ...form, xp: e.target.value })} /></div>
            <div><Label>Justificativa</Label><Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
            <Button onClick={grant} className="w-full">Conceder</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
