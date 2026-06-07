import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AdminPageHeader } from '../components/AdminPageHeader';

export default function CriarTorneio() {
  const [form, setForm] = useState({
    title: '', description: '', max_participants: 8, prize: '',
    starts_at: '', ends_at: '', type: 'single_elimination',
  });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const save = async () => {
    if (!form.title) return toast.error('Título obrigatório');
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('tournaments').insert({
      ...form, created_by: user!.id, status: 'open', event_state: 'upcoming',
      starts_at: form.starts_at || null, ends_at: form.ends_at || null,
    } as any);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Torneio criado');
    navigate('/desktop/torneios');
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <AdminPageHeader icon={Sparkles} title="Criar Torneio" subtitle="Configure um novo torneio oficial" />
      <Card className="border-border/50"><CardContent className="p-6 space-y-4">
        <div><Label>Título</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div><Label>Descrição</Label><Textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Máx. participantes</Label><Input type="number" value={form.max_participants} onChange={e => setForm({ ...form, max_participants: Number(e.target.value) })} /></div>
          <div><Label>Prêmio</Label><Input value={form.prize} onChange={e => setForm({ ...form, prize: e.target.value })} /></div>
          <div><Label>Início</Label><Input type="datetime-local" value={form.starts_at} onChange={e => setForm({ ...form, starts_at: e.target.value })} /></div>
          <div><Label>Fim</Label><Input type="datetime-local" value={form.ends_at} onChange={e => setForm({ ...form, ends_at: e.target.value })} /></div>
        </div>
        <Button onClick={save} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Criar torneio</Button>
      </CardContent></Card>
    </div>
  );
}
