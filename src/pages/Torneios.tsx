import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Trophy, Loader2, Users, Calendar, Award, Zap, Star, Crown, ShieldCheck, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import TournamentBracket from '@/components/TournamentBracket';
import CreateTournamentDialog from '@/components/tournaments/CreateTournamentDialog';

interface Tournament {
  id: string; title: string; description: string | null; type: string; status: string;
  prize: string | null; max_participants: number; starts_at: string | null; ends_at: string | null;
  xp_signup?: number | null; xp_match_win?: number | null; xp_champion?: number | null;
  verified?: boolean | null; prize_types?: string[] | null;
  product_id?: string | null; stream_url?: string | null;
}
interface GameOpt { id: string; title: string; image_url: string | null }

function fingerprint() {
  try {
    const raw = `${navigator.userAgent}|${screen.width}x${screen.height}|${screen.colorDepth}|${navigator.language}|${new Date().getTimezoneOffset()}`;
    let h = 0; for (let i = 0; i < raw.length; i++) { h = (h << 5) - h + raw.charCodeAt(i); h |= 0; }
    return String(h);
  } catch { return null; }
}

export default function Torneios() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [list, setList] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Tournament | null>(null);
  const [myIds, setMyIds] = useState<Set<string>>(new Set());
  const [gameFilter, setGameFilter] = useState<string>('all');
  const [games, setGames] = useState<GameOpt[]>([]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('tournaments' as any).select('*').order('created_at', { ascending: false });
    const items = ((data as any) || []) as Tournament[];
    setList(items);
    // Build distinct games options from products referenced
    const pids = [...new Set(items.map(t => t.product_id).filter(Boolean) as string[])];
    if (pids.length) {
      const { data: ps } = await supabase.from('produtos').select('id,title,image_url').in('id', pids);
      setGames((ps as any) || []);
    } else setGames([]);
    if (user) {
      const { data: parts } = await supabase.from('tournament_participants' as any).select('tournament_id').eq('user_id', user.id);
      setMyIds(new Set(((parts as any) || []).map((p: any) => p.tournament_id)));
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  // Realtime: refletir inscrições/saídas em tempo real
  useEffect(() => {
    const ch = supabase.channel('tournaments-public')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_participants' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_matches' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const join = async (t: Tournament) => {
    if (!user) { toast.error('Entre para participar'); return; }
    // Camada 1: e-mail confirmado
    if (!user.email_confirmed_at) { toast.error('Confirme seu e-mail antes de se inscrever em torneios'); return; }
    // Camada 3: torneio verificado exige telefone
    if (t.verified) {
      const { data: rpcProf } = await (supabase as any).rpc('get_my_profile');
      const prof = Array.isArray(rpcProf) ? rpcProf[0] : rpcProf;
      if (!prof?.phone) { toast.error('Este torneio exige telefone cadastrado no perfil'); return; }
    }
    const { error } = await supabase.from('tournament_participants' as any).insert({
      tournament_id: t.id, user_id: user.id,
      device_fingerprint: fingerprint(),
    });
    if (error) {
      if (error.message?.includes('banido')) return toast.error('Você foi banido deste torneio pelo moderador');
      return toast.error(error.message);
    }
    toast.success('Inscrito!');
    load();
  };

  const leave = async (t: Tournament) => {
    const { error } = await supabase.from('tournament_participants' as any).delete().eq('tournament_id', t.id).eq('user_id', user!.id);
    if (error) return toast.error(error.message);
    toast.success('Inscrição cancelada');
    load();
  };

  const talkToAdmin = async (t: Tournament) => {
    if (!user) { toast.error('Entre para falar com o admin'); return; }
    const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin').limit(1);
    const adminId = (admins as any)?.[0]?.user_id;
    if (!adminId) { toast.error('Nenhum admin disponível'); return; }
    const { data: existing } = await supabase.from('conversas').select('id')
      .or(`and(participant_1.eq.${user.id},participant_2.eq.${adminId}),and(participant_1.eq.${adminId},participant_2.eq.${user.id})`)
      .limit(1).maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data: created, error } = await supabase.from('conversas').insert({
        participant_1: user.id, participant_2: adminId, status: 'accepted',
      } as any).select('id').single();
      if (error) return toast.error(error.message);
      convId = created.id;
    }
    await supabase.from('mensagens').insert({
      sender_id: user.id, receiver_id: adminId,
      content: `🏆 Sobre o torneio "${t.title}":`,
      tournament_id: t.id, is_admin_chat: true,
    } as any);
    toast.success('Conversa aberta com o admin');
    navigate(`/m/chat/${convId}`);
  };

  const Card = ({ t }: { t: Tournament }) => {
    const inIt = myIds.has(t.id);
    return (
      <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-1.5">
              {t.title}
              {t.verified && <ShieldCheck className="h-4 w-4 text-success" aria-label="Verificado" />}
            </h3>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{t.type}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs px-2 py-1 rounded ${t.status === 'open' ? 'bg-green-500/20 text-green-400' : t.status === 'running' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-muted text-muted-foreground'}`}>
              {t.status === 'open' ? 'Aberto' : t.status === 'running' ? 'Em andamento' : 'Encerrado'}
            </span>
            {t.stream_url && t.status === 'running' && (
              <a href={t.stream_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/90 text-white animate-pulse">
                🔴 AO VIVO
              </a>
            )}
          </div>
        </div>
        {t.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{t.description}</p>}

        {/* XP visível antes de inscrever */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-secondary/40 rounded-lg p-2 text-center">
            <Zap className="h-3.5 w-3.5 text-primary mx-auto mb-0.5" />
            <div className="text-sm font-bold">+{t.xp_signup ?? 30}</div>
            <div className="text-[9px] text-muted-foreground uppercase">Inscrição</div>
          </div>
          <div className="bg-secondary/40 rounded-lg p-2 text-center">
            <Star className="h-3.5 w-3.5 text-accent mx-auto mb-0.5" />
            <div className="text-sm font-bold">+{t.xp_match_win ?? 100}</div>
            <div className="text-[9px] text-muted-foreground uppercase">Por vitória</div>
          </div>
          <div className="bg-secondary/40 rounded-lg p-2 text-center">
            <Crown className="h-3.5 w-3.5 text-yellow-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold">+{t.xp_champion ?? 500}</div>
            <div className="text-[9px] text-muted-foreground uppercase">Campeão</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
          {t.prize_types?.length ? (
            <div className="flex items-center gap-1 col-span-2"><Award className="h-3.5 w-3.5" /> {t.prize_types.join(' + ')}</div>
          ) : t.prize ? <div className="flex items-center gap-1 col-span-2"><Award className="h-3.5 w-3.5" /> {t.prize}</div> : null}
          <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Máx {t.max_participants}</div>
          {t.starts_at && <div className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(t.starts_at).toLocaleDateString('pt-BR')}</div>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="flex-1 min-w-[100px]" onClick={() => navigate(`/torneios/${t.id}`)}>Abrir</Button>
          {inIt && (
            <Button variant="secondary" size="sm" onClick={() => navigate(`/torneios/${t.id}/grupo`)} title="Grupo de participantes">
              <MessageCircle className="h-3.5 w-3.5 mr-1" /> Grupo
            </Button>
          )}
          {t.status === 'open' && (inIt
            ? <Button size="sm" variant="ghost" onClick={() => leave(t)}>Sair</Button>
            : <Button size="sm" onClick={() => join(t)}>Inscrever</Button>)}
          {user && (
            <Button size="sm" variant="ghost" onClick={() => talkToAdmin(t)} title="Falar com o admin">
              <MessageCircle className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const filterByGame = (l: Tournament[]) => gameFilter === 'all' ? l : l.filter(t => t.product_id === gameFilter);
  const tabs = {
    open: filterByGame(list.filter(t => t.status === 'open')),
    running: filterByGame(list.filter(t => t.status === 'running')),
    closed: filterByGame(list.filter(t => t.status === 'closed')),
    mine: filterByGame(list.filter(t => myIds.has(t.id))),
  };

  const grid = (l: Tournament[]) => l.length === 0
    ? <div className="text-center py-16 text-muted-foreground">Nenhum torneio aqui.</div>
    : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{l.map(t => <Card key={t.id} t={t} />)}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <Trophy className="h-7 w-7 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-display font-bold">Torneios</h1>
            <p className="text-muted-foreground text-sm">Compita, suba no ranking e ganhe badges exclusivos</p>
          </div>
        </div>
        {user && <CreateTournamentDialog onCreated={load} />}
      </div>

      {games.length > 0 && (
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-muted-foreground shrink-0">Filtrar por jogo:</span>
          <button onClick={() => setGameFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 ${gameFilter==='all'?'bg-primary text-primary-foreground':'bg-secondary'}`}>
            Todos ({list.length})
          </button>
          {games.map(g => {
            const count = list.filter(t => t.product_id === g.id).length;
            return (
              <button key={g.id} onClick={() => setGameFilter(g.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 inline-flex items-center gap-1.5 ${gameFilter===g.id?'bg-primary text-primary-foreground':'bg-secondary'}`}>
                {g.image_url && <img src={g.image_url} alt="" className="w-4 h-4 rounded object-cover" />}
                {g.title} ({count})
              </button>
            );
          })}
        </div>
      )}
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
