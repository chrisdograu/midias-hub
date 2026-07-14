import { useState } from 'react';
import { Bell, Loader2, Megaphone, Eye, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminLog } from '../lib/adminLog';

export default function NotificacoesEspeciais() {
  const [form, setForm] = useState({ title: '', body: '', kind: 'especial', banner_url: '', cta_label: '', cta_url: '', audience: 'all' });
  const [sending, setSending] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[] | null>(null);

  const audienceQuery = async (): Promise<string[]> => {
    if (form.audience === 'all') {
      const { data } = await supabase.from('profiles').select('id');
      return (data || []).map(p => p.id);
    }
    if (form.audience === 'buyers') {
      const { data } = await supabase.from('pedidos').select('user_id').eq('status', 'confirmed');
      return Array.from(new Set((data || []).map((p: any) => p.user_id))).filter(Boolean);
    }
    if (form.audience === 'sellers') {
      const { data } = await supabase.from('seller_profiles').select('user_id');
      return (data || []).map((p: any) => p.user_id);
    }
    if (form.audience === 'active7d') {
      const since = new Date(); since.setDate(since.getDate() - 7);
      const { data } = await supabase.from('user_xp_log').select('user_id').gte('created_at', since.toISOString());
      return Array.from(new Set((data || []).map((p: any) => p.user_id))).filter(Boolean);
    }
    return [];
  };

  const preview = async () => {
    if (!form.title) return toast.error('Título obrigatório');
    setPreviewing(true);
    const ids = await audienceQuery();
    setPreviewing(false);
    setPreviewCount(ids.length);
    setPendingIds(ids);
    if (ids.length === 0) { toast.error('Nenhum destinatário nessa audiência.'); return; }
    setConfirmOpen(true);
  };

  const confirmSend = async () => {
    const userIds = pendingIds || [];
    if (userIds.length === 0) return;
    setConfirmOpen(false);
    setSending(true);
    const rows = userIds.map(uid => ({
      user_id: uid, type: 'nova_mensagem' as any, kind: form.kind as any,
      title: form.title, body: form.body || null,
      banner_url: form.banner_url || null, cta_label: form.cta_label || null, cta_url: form.cta_url || null,
    }));
    const { error } = await supabase.from('notifications').insert(rows as any);
    setSending(false);
    if (error) return toast.error(error.message);
    await adminLog({ action: 'notif_broadcast', entity: 'notification', payload: { count: rows.length, audience: form.audience, kind: form.kind, title: form.title } });
    toast.success(`Enviadas ${rows.length} notificações`);
    setForm({ title: '', body: '', kind: 'especial', banner_url: '', cta_label: '', cta_url: '', audience: 'all' });
    setPreviewCount(null); setPendingIds(null);
  };

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <AdminPageHeader icon={Megaphone} title="Notificações Especiais" subtitle="Comum, destacada ou especial com banner e CTA" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50"><CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo</Label>
              <Select value={form.kind} onValueChange={v => setForm({ ...form, kind: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="comum">Comum</SelectItem>
                  <SelectItem value="destacada">Destacada</SelectItem>
                  <SelectItem value="especial">Especial (banner + CTA)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Público</Label>
              <Select value={form.audience} onValueChange={v => setForm({ ...form, audience: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="buyers">Compradores</SelectItem>
                  <SelectItem value="sellers">Vendedores</SelectItem>
                  <SelectItem value="active7d">Ativos (7 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Título</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Mensagem</Label><Textarea rows={3} value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} /></div>
          {form.kind === 'especial' && <>
            <div><Label>Banner (URL)</Label><Input value={form.banner_url} onChange={e => setForm({ ...form, banner_url: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>CTA texto</Label><Input value={form.cta_label} onChange={e => setForm({ ...form, cta_label: e.target.value })} /></div>
              <div><Label>CTA URL</Label><Input value={form.cta_url} onChange={e => setForm({ ...form, cta_url: e.target.value })} /></div>
            </div>
          </>}
          <Button onClick={send} disabled={sending}>{sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}<Bell className="h-4 w-4 mr-1" /> Enviar e registrar</Button>
        </CardContent></Card>

        <Card className="border-border/50"><CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground"><Eye className="h-4 w-4" />Preview</div>
          <div className="border border-border rounded-lg p-4 bg-card space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={form.kind === 'especial' ? 'default' : 'secondary'}>{form.kind}</Badge>
              <span className="font-semibold">{form.title || 'Título da notificação'}</span>
            </div>
            {form.body && <p className="text-sm text-muted-foreground">{form.body}</p>}
            {form.kind === 'especial' && form.banner_url && (
              <img src={form.banner_url} alt="banner" className="w-full rounded mt-2 max-h-40 object-cover" />
            )}
            {form.kind === 'especial' && form.cta_label && (
              <Button size="sm" className="mt-2">{form.cta_label}</Button>
            )}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}
