import { useState } from 'react';
import { Bell, Loader2, Megaphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminPageHeader } from '../components/AdminPageHeader';

export default function NotificacoesEspeciais() {
  const [form, setForm] = useState({ title: '', body: '', kind: 'especial', banner_url: '', cta_label: '', cta_url: '', audience: 'all' });
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!form.title) return toast.error('Título obrigatório');
    setSending(true);
    let userIds: string[] = [];
    if (form.audience === 'all') {
      const { data } = await supabase.from('profiles').select('id');
      userIds = (data || []).map(p => p.id);
    }
    if (userIds.length === 0) { setSending(false); return toast.error('Nenhum destinatário'); }
    const rows = userIds.map(uid => ({
      user_id: uid, type: 'nova_mensagem' as any, kind: form.kind as any,
      title: form.title, body: form.body || null,
      banner_url: form.banner_url || null, cta_label: form.cta_label || null, cta_url: form.cta_url || null,
    }));
    const { error } = await supabase.from('notifications').insert(rows as any);
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success(`Enviadas ${rows.length} notificações`);
    setForm({ title: '', body: '', kind: 'especial', banner_url: '', cta_label: '', cta_url: '', audience: 'all' });
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <AdminPageHeader icon={Megaphone} title="Notificações Especiais" subtitle="Comum, destacada ou especial com banner e CTA" />
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
              <SelectContent><SelectItem value="all">Todos os usuários</SelectItem></SelectContent>
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
        <Button onClick={send} disabled={sending}>{sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}<Bell className="h-4 w-4 mr-1" /> Enviar</Button>
      </CardContent></Card>
    </div>
  );
}
