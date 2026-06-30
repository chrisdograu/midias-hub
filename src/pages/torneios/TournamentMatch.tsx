import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Radio, Loader2, Trophy, Sparkles, Target, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import LiveTournamentChat from '@/components/tournaments/LiveTournamentChat';

export default function TournamentMatch() {
  const { id, matchId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [t, setT] = useState<any>(null);
  const [m, setM] = useState<any>(null);
  const [pa, setPa] = useState<any>(null);
  const [pb, setPb] = useState<any>(null);
  const [predA, setPredA] = useState(0);
  const [predB, setPredB] = useState(0);
  const [myPred, setMyPred] = useState<string | null>(null);
  const [mvpA, setMvpA] = useState(0);
  const [mvpB, setMvpB] = useState(0);
  const [myMvp, setMyMvp] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [h2h, setH2h] = useState<{ a: number; b: number; total: number; last?: any } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!matchId || !id) return;
    const { data: match } = await supabase.from('tournament_matches' as any).select('*').eq('id', matchId).maybeSingle();
    setM(match);
    const { data: tour } = await supabase.from('tournaments' as any).select('*').eq('id', id).maybeSingle();
    setT(tour);
    if (match) {
      const mm = match as any;
      const uids = [mm.player_a, mm.player_b].filter(Boolean);
      if (uids.length) {
        const { data: profs } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', uids);
        const map = Object.fromEntries((profs || []).map(p => [p.id, p]));
        setPa(map[mm.player_a]); setPb(map[mm.player_b]);
      }
      const [pRes, vRes, eRes] = await Promise.all([
        supabase.from('tournament_predictions' as any).select('predicted_winner_id, user_id').eq('match_id', matchId),
        supabase.from('tournament_mvp_votes' as any).select('voted_for_id, voter_id').eq('match_id', matchId),
        supabase.from('tournament_match_events' as any).select('*').eq('match_id', matchId).order('created_at', { ascending: false }).limit(20),
      ]);
      const preds = (pRes.data as any) || [];
      setPredA(preds.filter((p: any) => p.predicted_winner_id === mm.player_a).length);
      setPredB(preds.filter((p: any) => p.predicted_winner_id === mm.player_b).length);
      if (user) {
        const mine = preds.find((p: any) => p.user_id === user.id);
        setMyPred(mine?.predicted_winner_id || null);
      }
      const votes = (vRes.data as any) || [];
      setMvpA(votes.filter((v: any) => v.voted_for_id === mm.player_a).length);
      setMvpB(votes.filter((v: any) => v.voted_for_id === mm.player_b).length);
      if (user) {
        const mineV = votes.find((v: any) => v.voter_id === user.id);
        setMyMvp(mineV?.voted_for_id || null);
      }
      setEvents((eRes.data as any) || []);

      // H2H: histórico entre os dois jogadores em qualquer torneio
      if (mm.player_a && mm.player_b) {
        const { data: history } = await supabase.from('tournament_matches' as any)
          .select('id, winner_id, score_a, score_b, ended_at, player_a, player_b, tournament_id')
          .or(`and(player_a.eq.${mm.player_a},player_b.eq.${mm.player_b}),and(player_a.eq.${mm.player_b},player_b.eq.${mm.player_a})`)
          .neq('id', matchId).not('ended_at', 'is', null).order('ended_at', { ascending: false });
        const list = (history as any) || [];
        setH2h({
          a: list.filter((x: any) => x.winner_id === mm.player_a).length,
          b: list.filter((x: any) => x.winner_id === mm.player_b).length,
          total: list.length,
          last: list[0],
        });
      }
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [matchId, user?.id]);

  useEffect(() => {
    if (!matchId) return;
    const ch = supabase.channel(`match-${matchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_matches', filter: `id=eq.${matchId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_predictions', filter: `match_id=eq.${matchId}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_mvp_votes', filter: `match_id=eq.${matchId}` }, () => load())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tournament_match_events', filter: `match_id=eq.${matchId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [matchId]);

  const predict = async (winnerId: string) => {
    if (!user) { toast.error('Entre para prever'); return; }
    if (m?.winner_id) return;
    await supabase.from('tournament_predictions' as any).upsert({
      tournament_id: id, match_id: matchId, user_id: user.id, predicted_winner_id: winnerId,
    } as any, { onConflict: 'match_id,user_id' });
    setMyPred(winnerId);
    load();
  };

  const voteMvp = async (forId: string) => {
    if (!user) { toast.error('Entre para votar'); return; }
    if (!m?.winner_id) { toast.error('Aguarde a partida acabar'); return; }
    await supabase.from('tournament_mvp_votes' as any).upsert({
      tournament_id: id, match_id: matchId, voter_id: user.id, voted_for_id: forId,
    } as any, { onConflict: 'match_id,voter_id' });
    setMyMvp(forId);
    load();
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!m || !t) return <div className="text-center py-32 text-muted-foreground">Partida não encontrada.</div>;

  const totalPred = predA + predB || 1;
  const totalMvp = mvpA + mvpB || 1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-6">
        <button onClick={() => nav(`/torneios/${id}`)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar para o torneio
        </button>

        {/* ESPORTS HUD */}
        <div className="relative bg-gradient-to-b from-card/80 to-background border border-border/60 rounded-2xl overflow-hidden backdrop-blur-md">
          {m.is_live && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
              <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-[10px] font-bold tracking-[0.25em]">
                <Radio className="h-3 w-3" /> AO VIVO
              </motion.span>
            </div>
          )}
          <div className="text-center pt-4 pb-2 text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            {m.round_label || `Rodada ${m.round}`} · {t.title}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center px-6 py-8">
            <PlayerCard profile={pa} score={m.score_a} isWinner={m.winner_id === m.player_a} side="left" />
            <div className="text-center">
              <div className="text-6xl md:text-7xl font-bold font-display tabular-nums text-foreground/30">VS</div>
              {m.ended_at && <div className="text-[10px] tracking-widest text-muted-foreground mt-2">FINALIZADA</div>}
            </div>
            <PlayerCard profile={pb} score={m.score_b} isWinner={m.winner_id === m.player_b} side="right" />
          </div>

          {/* Momentum bar */}
          {m.is_live && (
            <div className="px-6 pb-4">
              <div className="text-[9px] tracking-widest uppercase text-muted-foreground text-center mb-1">Momentum</div>
              <div className="relative h-3 bg-secondary/40 rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-primary/40 to-primary/10" />
                <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-purple-500/40 to-purple-500/10" />
                <motion.div
                  initial={false}
                  animate={{ left: `${50 + (m.momentum / 2)}%` }}
                  transition={{ type: 'spring' }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-5 bg-foreground rounded-full shadow-[0_0_8px] shadow-foreground"
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 mt-6">
          <div className="space-y-6">
            {/* Predictions */}
            <Section title="Previsões dos espectadores" icon={<Target className="h-4 w-4" />}>
              <div className="space-y-2">
                <PredBar name={pa?.display_name || 'A'} count={predA} pct={(predA / totalPred) * 100} mine={myPred === m.player_a} onClick={() => predict(m.player_a)} disabled={!!m.winner_id} side="left" />
                <PredBar name={pb?.display_name || 'B'} count={predB} pct={(predB / totalPred) * 100} mine={myPred === m.player_b} onClick={() => predict(m.player_b)} disabled={!!m.winner_id} side="right" />
              </div>
            </Section>

            {/* MVP voting */}
            {m.winner_id && (
              <Section title="Vote no MVP" icon={<Crown className="h-4 w-4" />}>
                <div className="grid grid-cols-2 gap-3">
                  <MvpCard profile={pa} count={mvpA} pct={(mvpA / totalMvp) * 100} mine={myMvp === m.player_a} onClick={() => voteMvp(m.player_a)} />
                  <MvpCard profile={pb} count={mvpB} pct={(mvpB / totalMvp) * 100} mine={myMvp === m.player_b} onClick={() => voteMvp(m.player_b)} />
                </div>
              </Section>
            )}

            {/* Timeline */}
            {events.length > 0 && (
              <Section title="Timeline" icon={<Sparkles className="h-4 w-4" />}>
                <ol className="space-y-2">
                  {events.map((e: any) => (
                    <li key={e.id} className="flex gap-3 items-start text-sm">
                      <span className="text-[10px] text-muted-foreground tabular-nums mt-0.5 shrink-0">{new Date(e.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-foreground/90">{e.payload?.text || e.kind}</span>
                    </li>
                  ))}
                </ol>
              </Section>
            )}
          </div>

          <div>
            <LiveTournamentChat tournamentId={id!} matchId={matchId} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: any) {
  return (
    <section className="bg-card/40 backdrop-blur-sm border border-border/60 rounded-xl p-4">
      <h3 className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground mb-3">{icon}{title}</h3>
      {children}
    </section>
  );
}

function PlayerCard({ profile, score, isWinner, side }: any) {
  return (
    <motion.div initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }}
      className={`text-center ${isWinner ? 'scale-105' : ''}`}>
      <div className="relative inline-block">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className={`w-20 h-20 md:w-28 md:h-28 rounded-full object-cover border-4 ${isWinner ? 'border-yellow-500 shadow-[0_0_30px] shadow-yellow-500/40' : 'border-border'}`} />
        ) : (
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-muted border-4 border-border" />
        )}
        {isWinner && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1.5">
            <Crown className="h-4 w-4 text-black" />
          </motion.div>
        )}
      </div>
      <h2 className="font-bold text-lg md:text-xl mt-3 truncate">{profile?.display_name || 'TBD'}</h2>
      <div className={`text-5xl md:text-6xl font-bold tabular-nums mt-2 ${isWinner ? 'text-yellow-500' : 'text-foreground/70'}`}>{score}</div>
    </motion.div>
  );
}

function PredBar({ name, count, pct, mine, onClick, disabled, side }: any) {
  return (
    <button onClick={onClick} disabled={disabled} className={`relative w-full bg-secondary/40 rounded-lg overflow-hidden h-10 ${disabled ? 'cursor-default' : 'hover:bg-secondary/60'} transition-colors`}>
      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }}
        className={`absolute inset-y-0 ${side === 'left' ? 'left-0 bg-gradient-to-r from-primary/60 to-primary/30' : 'right-0 bg-gradient-to-l from-purple-500/60 to-purple-500/30'}`} />
      <div className="relative flex items-center justify-between px-4 h-full">
        <span className={`text-sm font-bold ${mine ? 'text-primary' : ''}`}>{name} {mine && '✓'}</span>
        <span className="text-xs tabular-nums">{count} voto(s) · {Math.round(pct)}%</span>
      </div>
    </button>
  );
}

function MvpCard({ profile, count, pct, mine, onClick }: any) {
  return (
    <button onClick={onClick} className={`p-3 rounded-xl border-2 transition-all text-center ${mine ? 'border-yellow-500 bg-yellow-500/10' : 'border-border hover:border-primary/50'}`}>
      {profile?.avatar_url ? <img src={profile.avatar_url} className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" /> : <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-2" />}
      <p className="text-xs font-bold truncate">{profile?.display_name || 'TBD'}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{count} voto(s) · {Math.round(pct)}%</p>
    </button>
  );
}
