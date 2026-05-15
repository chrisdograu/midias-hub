import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Plus, Loader2, Users, Shuffle, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

interface T { id: string; title: string; description: string | null; type: string; status: string; prize: string | null; max_participants: number; starts_at: string | null; ends_at: string | null; }

const empty = { id: '', title: '', description: '', type: 'semanal', status: 'open', prize: '', max_participants: 16, starts_at: '', ends_at: '' };

export default function TorneiosAdmin() {
  const [list, setList] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [bracketFor, setBracketFor] = useState<T | null>(null);
  const [participants, setParticipants] = useState<{ user_id: string; display_name: string | null }[]>([]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('tournaments' as any).select('*').order('created_at', { ascending: false });
    setList((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title) return toast.error('Título obrigatório');
    const payload = {
      title: form.title, description: form.description || null, type: form.type, status: form.status,
      prize: form.prize || null, max_participants: Number(form.max_participants) || 16,
      starts_at: form.starts_at || null, ends_at: form.ends_at || null,
    };
    const op = editing
      ? supabase.from('tournaments' as any).update(payload).eq('id', editing)
      : supabase.from('tournaments' as any).insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success('Salvo!');
    setDialog(false); setForm(empty); setEditing(null); load();
  };

  const remove = async (t: T) => {
    if (!confirm(`Excluir "${t.title}"?`)) return;
    const { error } = await supabase.from('tournaments' as any).delete().eq('id', t.id);
    if (error) return toast.error(error.message);
    toast.success('Removido'); load();
  };

  const openBracket = async (t: T) => {
    setBracketFor(t);
    const { data } = await supabase.from('tournament_participants' as any).select('user_id, profiles!inner(display_name)').eq('tournament_id', t.id);
    setParticipants(((data as any) || []).map((p: any) => ({ user_id: p.user_id, display_name: p.profiles?.display_name })));
  };

  const generateBracket = async () => {
    if (!bracketFor) return;
    const { data: existing } = await supabase.from('tournament_matches' as any).select('id').eq('tournament_id', bracketFor.id);
    if ((existing as any)?.length) {
      if (!confirm('Já existem chaves geradas. Substituir?')) return;
      await supabase.from('tournament_matches' as any).delete().eq('tournament_id', bracketFor.id);
    }
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const pairs: any[] = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      pairs.push({
        tournament_id: bracketFor.id, round: 1, position: pairs.length,
        player_a: shuffled[i]?.user_id || null,
        player_b: shuffled[i + 1]?.user_id || null,
        status: 'pending',
      });
    }
    if (pairs.length === 0) return toast.error('Sem participantes');
    const { error } = await supabase.from('tournament_matches' as any).insert(pairs);
    if (error) return toast.error(error.message);
    await supabase.from('tournaments' as any).update({ status: 'running' }).eq('id', bracketFor.id);
    toast.success('Chaves geradas!');
    setBracketFor(null); load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Trophy className="h-6 w-6 text-primary" /> Torneios</h1>
          <p className="text-sm text-muted-foreground">Gerencie torneios semanais e mensais.</p>
        </div>
        <Button onClick={() => { setForm(empty); setEditing(null); setDialog(true); }}><Plus className="h-4 w-4 mr-1" /> Novo Torneio</Button>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(t => (
            <div key={t.id} className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{t.title}</h3>
                  <p className="text-xs text-muted-foreground uppercase">{t.type} · {t.status}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setForm({ ...t, description: t.description || '', prize: t.prize || '', starts_at: t.starts_at || '', ends_at: t.ends_at || '' }); setEditing(t.id); setDialog(true); }}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              {t.description && <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>}
              <div className="text-xs text-muted-foreground">Prêmio: {t.prize || '—'}</div>
              <Button size="sm" variant="outline" className="w-full" onClick={() => openBracket(t)}><Users className="h-3.5 w-3.5 mr-1" /> Participantes & Chaves</Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} Torneio</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="semanal">Semanal</SelectItem><SelectItem value="mensal">Mensal</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="open">Aberto</SelectItem><SelectItem value="running">Em andamento</SelectItem><SelectItem value="closed">Encerrado</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Prêmio</Label><Input value={form.prize} onChange={e => setForm({ ...form, prize: e.target.value })} placeholder="ex: R$100 + Badge" /></div>
              <div><Label>Máx. participantes</Label><Input type="number" value={form.max_participants} onChange={e => setForm({ ...form, max_participants: e.target.value })} /></div>
              <div><Label>Início</Label><Input type="datetime-local" value={form.starts_at?.slice(0, 16) || ''} onChange={e => setForm({ ...form, starts_at: e.target.value })} /></div>
              <div><Label>Fim</Label><Input type="datetime-local" value={form.ends_at?.slice(0, 16) || ''} onChange={e => setForm({ ...form, ends_at: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!bracketFor} onOpenChange={() => setBracketFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{bracketFor?.title} — Participantes</DialogTitle></DialogHeader>
          {participants.length === 0 ? <p className="text-muted-foreground py-4 text-sm">Nenhum participante inscrito.</p> : (
            <ul className="max-h-64 overflow-y-auto space-y-1 text-sm">
              {participants.map(p => <li key={p.user_id} className="px-3 py-2 rounded bg-secondary/30">{p.display_name || p.user_id}</li>)}
            </ul>
          )}
          <DialogFooter>
            <Button onClick={generateBracket} disabled={participants.length < 2}><Shuffle className="h-4 w-4 mr-1" /> Gerar/Sortear chaves</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
