import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trophy, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubmitGuard } from '@/hooks/useSubmitGuard';
import { toast } from 'sonner';

export default function CreateTournamentDialog({ onCreated }: { onCreated?: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('eliminação simples');
  const [maxParticipants, setMaxParticipants] = useState(8);
  const [startsAt, setStartsAt] = useState('');
  const [verified, setVerified] = useState(false);
  const [adaptadoPcd, setAdaptadoPcd] = useState(false);
  const [prize, setPrize] = useState('');
  const { submitting, guard } = useSubmitGuard();

  // XP escalado por tamanho (aproximação simples — backend trigger pode sobrescrever)
  const xp = {
    signup: Math.max(20, Math.round(maxParticipants * 5)),
    win: Math.max(50, Math.round(maxParticipants * 15)),
    champion: Math.max(200, Math.round(maxParticipants * 80)),
  };

  const submit = guard(async () => {
    if (!user) { toast.error('Entre para criar torneios'); return; }
    if (!title.trim()) { toast.error('Dê um título'); return; }
    const { data, error } = await supabase.from('tournaments').insert({
      title: title.trim(),
      description: description.trim() || null,
      type,
      max_participants: maxParticipants,
      status: 'open',
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      verified,
      adaptado_pcd: adaptadoPcd,
      prize: prize.trim() || null,
      created_by: user.id,
      xp_signup: xp.signup,
      xp_match_win: xp.win,
      xp_champion: xp.champion,
    } as any).select('id').single();
    if (error) { toast.error(error.message); return; }
    // Auto-inscreve criador
    await supabase.from('tournament_participants').insert({
      tournament_id: data.id, user_id: user.id,
    } as any);
    toast.success('Torneio criado! Você é o moderador.');
    setOpen(false);
    setTitle(''); setDescription(''); setPrize(''); setStartsAt('');
    onCreated?.();
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Criar torneio
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" /> Novo torneio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Copa de Verão FIFA" />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Regras, formato, premiação..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Formato</Label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-background border border-border rounded-md p-2 text-sm">
                <option value="eliminação simples">Eliminação simples</option>
                <option value="eliminação dupla">Eliminação dupla</option>
                <option value="grupos">Fase de grupos</option>
                <option value="liga">Liga (pontos corridos)</option>
              </select>
            </div>
            <div>
              <Label>Participantes</Label>
              <select value={maxParticipants} onChange={e => setMaxParticipants(Number(e.target.value))} className="w-full bg-background border border-border rounded-md p-2 text-sm">
                {[4, 8, 16, 32, 64].map(n => <option key={n} value={n}>{n} jogadores</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início</Label>
              <Input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
            </div>
            <div>
              <Label>Prêmio (texto)</Label>
              <Input value={prize} onChange={e => setPrize(e.target.value)} placeholder="Steam Gift Card R$50" />
            </div>
          </div>
          <div className="flex items-center justify-between bg-secondary/40 rounded-lg p-3">
            <div>
              <Label className="text-sm">Torneio verificado</Label>
              <p className="text-xs text-muted-foreground">Exige telefone cadastrado para inscrição</p>
            </div>
            <Switch checked={verified} onCheckedChange={setVerified} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-primary/10 border border-primary/30 rounded p-2">
              <div className="text-[10px] text-muted-foreground uppercase">Inscrição</div>
              <div className="text-sm font-bold text-primary">+{xp.signup} XP</div>
            </div>
            <div className="bg-accent/10 border border-accent/30 rounded p-2">
              <div className="text-[10px] text-muted-foreground uppercase">Vitória</div>
              <div className="text-sm font-bold text-accent">+{xp.win} XP</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
              <div className="text-[10px] text-muted-foreground uppercase">Campeão</div>
              <div className="text-sm font-bold text-yellow-500">+{xp.champion} XP</div>
            </div>
          </div>
          <Button onClick={submit} disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trophy className="h-4 w-4 mr-2" />}
            Criar e me inscrever
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
