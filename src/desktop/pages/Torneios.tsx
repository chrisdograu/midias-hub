import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy, Plus, Loader2, Users, Shuffle, Trash2, Edit, Gift, AlertTriangle, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface T {
  id: string; title: string; description: string | null; type: string; status: string;
  prize: string | null; max_participants: number; starts_at: string | null; ends_at: string | null;
  xp_signup?: number | null; xp_match_win?: number | null; xp_champion?: number | null;
  verified?: boolean | null; prize_types?: string[] | null; prize_xp_bonus?: number | null;
  rewards_distributed?: boolean | null;
}

const PRIZE_OPTIONS = [
  { id: 'game', label: '🎮 Jogo grátis' },
  { id: 'coupon', label: '🎟️ Cupom de desconto' },
  { id: 'badge', label: '🏅 Badge exclusivo' },
  { id: 'title', label: '👑 Título de conquista' },
  { id: 'xp_bonus', label: '⚡ XP bônus' },
];

const empty = {
  id: '', title: '', description: '', type: 'semanal', status: 'open',
  max_participants: 16, starts_at: '', ends_at: '',
  verified: false, prize_types: [] as string[], prize_xp_bonus: 0, prize_title: '',
};

function calcXp(n: number) {
  if (n <= 8) return { s: 30, w: 100, c: 500 };
  if (n <= 16) return { s: 40, w: 130, c: 650 };
  if (n <= 32) return { s: 55, w: 170, c: 850 };
  if (n <= 64) return { s: 70, w: 220, c: 1100 };
  return { s: 90, w: 280, c: 1400 };
}

export default function TorneiosAdmin() {
  const [list, setList] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [bracketFor, setBracketFor] = useState<T | null>(null);
  const [participants, setParticipants] = useState<{ user_id: string; display_name: string | null; final_rank: number | null }[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<T | null>(null);
  const [confirmDistribute, setConfirmDistribute] = useState<T | null>(null);
  const [confirmRegen, setConfirmRegen] = useState<(() => void) | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('tournaments' as any).select('*').order('created_at', { ascending: false });
    setList((data as any) || []);
    const { data: dups } = await supabase.from('tournament_duplicate_alerts' as any).select('*').eq('resolved', false).order('created_at', { ascending: false });
    setAlerts((dups as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const xpPreview = useMemo(() => calcXp(Number(form.max_participants) || 16), [form.max_participants]);

  const save = async () => {
    if (!form.title) return toast.error('Título obrigatório');
    const payload = {
      title: form.title, description: form.description || null, type: form.type, status: form.status,
      max_participants: Number(form.max_participants) || 16,
      starts_at: form.starts_at || null, ends_at: form.ends_at || null,
      verified: !!form.verified,
      prize_types: form.prize_types?.length ? form.prize_types : null,
      prize_xp_bonus: Number(form.prize_xp_bonus) || 0,
      prize_title: form.prize_title || null,
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
    const { data } = await supabase.from('tournament_participants' as any).select('user_id, final_rank, profiles!inner(display_name)').eq('tournament_id', t.id);
    setParticipants(((data as any) || []).map((p: any) => ({ user_id: p.user_id, display_name: p.profiles?.display_name, final_rank: p.final_rank })));
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

  const setRank = async (userId: string, rank: number | null) => {
    if (!bracketFor) return;
    await supabase.from('tournament_participants' as any).update({ final_rank: rank }).eq('tournament_id', bracketFor.id).eq('user_id', userId);
    openBracket(bracketFor);
  };

  const distribute = async (t: T) => {
    if (!confirm(`Distribuir recompensas para "${t.title}"? Esta ação é definitiva.`)) return;
    const { error } = await supabase.rpc('award_tournament_rewards' as any, { _tournament_id: t.id });
    if (error) return toast.error(error.message);
    toast.success('Recompensas distribuídas!');
    load();
  };

  const talkToParticipant = async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: existing } = await supabase.from('conversas').select('id')
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${userId}),and(participant_1.eq.${userId},participant_2.eq.${user.id})`)
      .limit(1).maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data: c } = await supabase.from('conversas').insert({
        participant_1: user.id, participant_2: userId, status: 'accepted',
      } as any).select('id').single();
      convId = c?.id;
    }
    if (convId && bracketFor) {
      await supabase.from('mensagens').insert({
        sender_id: user.id, receiver_id: userId,
        content: `[Admin · Torneio "${bracketFor.title}"]`,
        tournament_id: bracketFor.id, is_admin_chat: true,
      } as any);
    }
    toast.success('Conversa aberta');
  };

  const renderCard = (t: T) => (
    <div key={t.id} className="bg-card border border-border rounded-lg p-4 space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-1.5">{t.title}{t.verified && <span title="Verificado" className="text-success text-xs">✓</span>}</h3>
          <p className="text-xs text-muted-foreground uppercase">{t.type} · {t.status}</p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => { setForm({ ...t, description: t.description || '', starts_at: t.starts_at || '', ends_at: t.ends_at || '', prize_types: t.prize_types || [], prize_xp_bonus: t.prize_xp_bonus || 0, verified: !!t.verified, prize_title: (t as any).prize_title || '' }); setEditing(t.id); setDialog(true); }}><Edit className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => remove(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        XP: <b>{t.xp_signup ?? 0}</b>/<b>{t.xp_match_win ?? 0}</b>/<b>{t.xp_champion ?? 0}</b>
        {t.prize_types?.length ? <span> · 🎁 {t.prize_types.length} tipo(s)</span> : null}
      </div>
      <Button size="sm" variant="outline" className="w-full" onClick={() => openBracket(t)}><Users className="h-3.5 w-3.5 mr-1" /> Participantes & Chaves</Button>
      {t.status === 'closed' && !t.rewards_distributed && (
        <Button size="sm" className="w-full" onClick={() => distribute(t)}><Gift className="h-3.5 w-3.5 mr-1" /> Distribuir recompensas</Button>
      )}
      {t.rewards_distributed && <p className="text-[10px] text-success text-center">✓ Recompensas distribuídas</p>}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Trophy className="h-6 w-6 text-primary" /> Torneios</h1>
          <p className="text-sm text-muted-foreground">Gerencie torneios, recompensas e detecção de duplicatas.</p>
        </div>
        <Button onClick={() => { setForm(empty); setEditing(null); setDialog(true); }}><Plus className="h-4 w-4 mr-1" /> Novo Torneio</Button>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">Todos ({list.length})</TabsTrigger>
            <TabsTrigger value="closed">Encerrados ({list.filter(t => t.status === 'closed').length})</TabsTrigger>
            <TabsTrigger value="alerts">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />Alertas ({alerts.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{list.map(renderCard)}</div>
          </TabsContent>
          <TabsContent value="closed" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{list.filter(t => t.status === 'closed').map(renderCard)}</div>
          </TabsContent>
          <TabsContent value="alerts" className="mt-4">
            {alerts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-12">Nenhum alerta de duplicata.</p> : (
              <div className="space-y-2">
                {alerts.map(a => (
                  <div key={a.id} className="bg-card border border-yellow-500/40 rounded-lg p-4">
                    <p className="text-sm font-semibold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" /> {a.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">Torneio: {a.tournament_id} · Usuários: {(a.user_ids || []).join(', ')}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Form de torneio */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <div><Label>Máx. participantes</Label><Input type="number" value={form.max_participants} onChange={e => setForm({ ...form, max_participants: e.target.value })} /></div>
              <div><Label>Início</Label><Input type="datetime-local" value={form.starts_at?.slice(0, 16) || ''} onChange={e => setForm({ ...form, starts_at: e.target.value })} /></div>
              <div><Label>Fim</Label><Input type="datetime-local" value={form.ends_at?.slice(0, 16) || ''} onChange={e => setForm({ ...form, ends_at: e.target.value })} /></div>
            </div>

            {/* Preview de XP calculado */}
            <div className="bg-secondary/40 rounded-lg p-3 grid grid-cols-3 gap-3 text-center">
              <div><div className="text-[10px] text-muted-foreground uppercase">Inscrição</div><div className="font-bold text-primary">+{xpPreview.s} XP</div></div>
              <div><div className="text-[10px] text-muted-foreground uppercase">Por vitória</div><div className="font-bold text-accent">+{xpPreview.w} XP</div></div>
              <div><div className="text-[10px] text-muted-foreground uppercase">Campeão</div><div className="font-bold text-yellow-500">+{xpPreview.c} XP</div></div>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <Label className="cursor-pointer">Torneio verificado</Label>
                <p className="text-[11px] text-muted-foreground">Exige telefone confirmado para inscrição</p>
              </div>
              <Switch checked={!!form.verified} onCheckedChange={v => setForm({ ...form, verified: v })} />
            </div>

            <div>
              <Label>Tipos de prêmio (sem dinheiro real)</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {PRIZE_OPTIONS.map(opt => {
                  const checked = (form.prize_types || []).includes(opt.id);
                  return (
                    <button type="button" key={opt.id}
                      onClick={() => setForm({ ...form, prize_types: checked ? form.prize_types.filter((p: string) => p !== opt.id) : [...(form.prize_types || []), opt.id] })}
                      className={`text-left text-sm px-3 py-2 rounded-lg border ${checked ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground'}`}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {form.prize_types?.includes('xp_bonus') && (
              <div><Label>XP bônus adicional</Label><Input type="number" value={form.prize_xp_bonus} onChange={e => setForm({ ...form, prize_xp_bonus: e.target.value })} /></div>
            )}
            {form.prize_types?.includes('title') && (
              <div><Label>Nome do título de conquista</Label><Input value={form.prize_title} onChange={e => setForm({ ...form, prize_title: e.target.value })} placeholder="ex: Campeão — Inverno 2026" /></div>
            )}
          </div>
          <DialogFooter><Button onClick={save}>Salvar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Participantes */}
      <Dialog open={!!bracketFor} onOpenChange={() => setBracketFor(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{bracketFor?.title} — Participantes</DialogTitle></DialogHeader>
          {participants.length === 0 ? <p className="text-muted-foreground py-4 text-sm">Nenhum participante inscrito.</p> : (
            <ul className="max-h-72 overflow-y-auto space-y-1 text-sm">
              {participants.map(p => (
                <li key={p.user_id} className="px-3 py-2 rounded bg-secondary/30 flex items-center gap-2">
                  <span className="flex-1">{p.display_name || p.user_id.slice(0, 8)}</span>
                  <Select value={String(p.final_rank ?? '')} onValueChange={v => setRank(p.user_id, v ? Number(v) : null)}>
                    <SelectTrigger className="w-28 h-8 text-xs"><SelectValue placeholder="Posição" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">—</SelectItem>
                      <SelectItem value="1">🥇 1º</SelectItem>
                      <SelectItem value="2">🥈 2º</SelectItem>
                      <SelectItem value="3">🥉 3º</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" onClick={() => talkToParticipant(p.user_id)} title="Falar com participante">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </li>
              ))}
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
