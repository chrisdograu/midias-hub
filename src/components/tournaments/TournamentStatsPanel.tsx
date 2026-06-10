import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Swords, Trophy, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Event = {
  id: string;
  match_id: string | null;
  kind: string;
  payload: any;
  created_at: string;
};

type Stat = { user_id: string; wins: number; losses: number; matches: number };

const ICONS: Record<string, any> = {
  match_start: Swords,
  match_end: Trophy,
  goal: Zap,
  penalty: AlertCircle,
  default: Activity,
};

export default function TournamentStatsPanel({
  tournamentId,
  matches,
  profiles,
}: { tournamentId: string; matches: any[]; profiles: Record<string, any> }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('tournament_match_events' as any)
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (active) { setEvents((data as any) || []); setLoading(false); }
    })();
    const ch = supabase.channel(`tme-${tournamentId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tournament_match_events', filter: `tournament_id=eq.${tournamentId}` },
        (p) => setEvents(prev => [p.new as Event, ...prev].slice(0, 100)))
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [tournamentId]);

  // Aggregate stats from matches
  const statMap = new Map<string, Stat>();
  const bump = (uid: string | null, k: keyof Omit<Stat, 'user_id'>) => {
    if (!uid) return;
    const cur = statMap.get(uid) || { user_id: uid, wins: 0, losses: 0, matches: 0 };
    cur[k] += 1;
    statMap.set(uid, cur);
  };
  matches.forEach((m: any) => {
    if (m.ended_at && m.winner_id) {
      bump(m.player_a, 'matches');
      bump(m.player_b, 'matches');
      bump(m.winner_id, 'wins');
      const loser = m.winner_id === m.player_a ? m.player_b : m.player_a;
      bump(loser, 'losses');
    }
  });
  const ranking = [...statMap.values()].sort((a, b) => b.wins - a.wins || a.losses - b.losses).slice(0, 10);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <section>
        <h3 className="text-xs font-bold tracking-[0.25em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
          <Trophy className="h-3.5 w-3.5" /> Ranking ao vivo
        </h3>
        {ranking.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Sem partidas finalizadas ainda.</p>
        ) : (
          <ol className="space-y-1.5">
            {ranking.map((s, i) => {
              const p = profiles[s.user_id];
              return (
                <li key={s.user_id} className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border/60">
                  <span className={`text-xs font-bold w-6 text-center ${i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>#{i + 1}</span>
                  {p?.avatar_url ? <img src={p.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                    : <div className="w-8 h-8 rounded-full bg-muted" />}
                  <span className="flex-1 text-sm truncate">{p?.display_name || 'Jogador'}</span>
                  <span className="text-xs tabular-nums text-emerald-400">{s.wins}V</span>
                  <span className="text-xs tabular-nums text-red-400">{s.losses}D</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section>
        <h3 className="text-xs font-bold tracking-[0.25em] uppercase text-muted-foreground mb-3 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5" /> Histórico de eventos
        </h3>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Nenhum evento registrado.</p>
        ) : (
          <ul className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
            {events.map(e => {
              const Icon = ICONS[e.kind] || ICONS.default;
              const label = e.payload?.label || e.payload?.text || e.kind.replace(/_/g, ' ');
              return (
                <li key={e.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-card border border-border/60 text-xs">
                  <Icon className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="leading-snug">{label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(e.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
