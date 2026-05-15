import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Trophy, Loader2, Users, Calendar, Award } from 'lucide-react';
import { toast } from 'sonner';
import TournamentBracket from '@/components/TournamentBracket';

interface Tournament {
  id: string; title: string; description: string | null; type: string; status: string;
  prize: string | null; max_participants: number; starts_at: string | null; ends_at: string | null;
}

export default function Torneios() {
  const { user } = useAuth();
  const [tabs, setTabs] = useState<{ open: Tournament[]; running: Tournament[]; closed: Tournament[]; mine: Tournament[] }>({ open: [], running: [], closed: [], mine: [] });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Tournament | null>(null);
  const [myIds, setMyIds] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('tournaments' as any).select('*').order('created_at', { ascending: false });
    const list = ((data as any) || []) as Tournament[];
    let mine = new Set<string>();
    if (user) {
      const { data: parts } = await supabase.from('tournament_participants' as any).select('tournament_id').eq('user_id', user.id);
      mine = new Set(((parts as any) || []).map((p: any) => p.tournament_id));
    }
    setMyIds(mine);
    setTabs({
      open: list.filter(t => t.status === 'open'),
      running: list.filter(t => t.status === 'running'),
      closed: list.filter(t => t.status === 'closed'),
      mine: list.filter(t => mine.has(t.id)),
    });
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const join = async (t: Tournament) => {
    if (!user) return toast.error('Entre para participar');
    const { error } = await supabase.from('tournament_participants' as any).insert({ tournament_id: t.id, user_id: user.id });
    if (error) return toast.error(error.message);
    toast.success('Inscrito!');
    load();
  };
  const leave = async (t: Tournament) => {
    const { error } = await supabase.from('tournament_participants' as any).delete().eq('tournament_id', t.id).eq('user_id', user!.id);
    if (error) return toast.error(error.message);
    toast.success('Inscrição cancelada');
    load();
  };

  const Card = ({ t }: { t: Tournament }) => {
    const inIt = myIds.has(t.id);
    return (
      <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg">{t.title}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{t.type}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${t.status === 'open' ? 'bg-green-500/20 text-green-400' : t.status === 'running' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-muted text-muted-foreground'}`}>
            {t.status === 'open' ? 'Aberto' : t.status === 'running' ? 'Em andamento' : 'Encerrado'}
          </span>
        </div>
        {t.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{t.description}</p>}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
          {t.prize && <div className="flex items-center gap-1"><Award className="h-3.5 w-3.5" /> {t.prize}</div>}
          <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Máx {t.max_participants}</div>
          {t.starts_at && <div className="flex items-center gap-1 col-span-2"><Calendar className="h-3.5 w-3.5" /> {new Date(t.starts_at).toLocaleDateString('pt-BR')}</div>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelected(t)}>Ver chaveamento</Button>
          {t.status === 'open' && (inIt
            ? <Button size="sm" variant="secondary" onClick={() => leave(t)}>Sair</Button>
            : <Button size="sm" onClick={() => join(t)}>Inscrever</Button>)}
        </div>
      </div>
    );
  };

  const grid = (list: Tournament[]) => list.length === 0
    ? <div className="text-center py-16 text-muted-foreground">Nenhum torneio aqui.</div>
    : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{list.map(t => <Card key={t.id} t={t} />)}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-7 w-7 text-yellow-500" />
        <div>
          <h1 className="text-3xl font-display font-bold">Torneios</h1>
          <p className="text-muted-foreground text-sm">Compita, suba no ranking e ganhe badges exclusivos</p>
        </div>
      </div>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
        <Tabs defaultValue="open">
          <TabsList>
            <TabsTrigger value="open">Abertos ({tabs.open.length})</TabsTrigger>
            <TabsTrigger value="running">Em andamento ({tabs.running.length})</TabsTrigger>
            <TabsTrigger value="closed">Encerrados ({tabs.closed.length})</TabsTrigger>
            <TabsTrigger value="mine">Meus ({tabs.mine.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="open" className="mt-6">{grid(tabs.open)}</TabsContent>
          <TabsContent value="running" className="mt-6">{grid(tabs.running)}</TabsContent>
          <TabsContent value="closed" className="mt-6">{grid(tabs.closed)}</TabsContent>
          <TabsContent value="mine" className="mt-6">{grid(tabs.mine)}</TabsContent>
        </Tabs>
      )}
      {selected && <TournamentBracket tournament={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
