import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy, Users, Calendar, Radio, ArrowLeft, Loader2, Award, MessageSquare, Sparkles, Crown, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import HypeMeter from '@/components/tournaments/HypeMeter';
import StorylinesPanel from '@/components/tournaments/StorylinesPanel';
import CinematicBracket from '@/components/tournaments/CinematicBracket';
import LiveTournamentChat from '@/components/tournaments/LiveTournamentChat';

export default function TournamentEvent() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [t, setT] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [storylines, setStorylines] = useState<any[]>([]);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    const [tRes, mRes, sRes, hRes, pRes] = await Promise.all([
      supabase.from('tournaments' as any).select('*').eq('id', id).maybeSingle(),
      supabase.from('tournament_matches' as any).select('*').eq('tournament_id', id).order('round'),
      supabase.from('tournament_storylines' as any).select('*').eq('tournament_id', id).order('created_at', { ascending: false }).limit(8),
      supabase.from('tournament_highlights' as any).select('*').eq('tournament_id', id).order('created_at', { ascending: false }),
      supabase.from('tournament_participants' as any).select('user_id').eq('tournament_id', id),
    ]);
    setT(tRes.data);
    setMatches(((mRes.data as any) || []));
    setStorylines((sRes.data as any) || []);
    setHighlights((hRes.data as any) || []);
    const parts = ((pRes.data as any) || []);
    setParticipants(parts);
    const uids = new Set<string>();
    parts.forEach((p: any) => uids.add(p.user_id));
    ((mRes.data as any) || []).forEach((m: any) => { if (m.player_a) uids.add(m.player_a); if (m.player_b) uids.add(m.player_b); });
    if (uids.size) {
      const { data: profs } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', [...uids]);
      setProfiles(Object.fromEntries((profs || []).map(p => [p.id, p])));
    }
    if (user) setJoined(parts.some((p: any) => p.user_id === user.id));
    setLoading(false);
  };

  useEffect(() => { load(); }, [id, user?.id]);

  useEffect(() => {
    if (!id) return;
    const ch = supabase.channel(`tournament-event-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_matches', filter: `tournament_id=eq.${id}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  if (!t) return <div className="text-center py-32 text-muted-foreground">Torneio não encontrado.</div>;

  const join = async () => {
    if (!user) { toast.error('Entre para participar'); return; }
    const { error } = await supabase.from('tournament_participants' as any).insert({ tournament_id: id, user_id: user.id });
    if (error) return toast.error(error.message);
    toast.success('Inscrito!');
    load();
  };

  const isLive = t.event_state === 'live' || t.status === 'running';
  const isFinished = t.event_state === 'finished' || t.status === 'closed';
  const stateLabel: any = { registration: 'Inscrições abertas', confirmation: 'Confirmação', live: 'AO VIVO', finished: 'Finalizado', archived: 'Arquivado' };

  return (
    <div className="min-h-screen bg-background">
      {/* Cinematic header */}
      <div className="relative overflow-hidden border-b border-border/60">
        {t.banner_url ? (
          <div className="absolute inset-0">
            <img src={t.banner_url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/40" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-amber-500/20" />
        )}
        <div className="relative container mx-auto px-4 py-10">
          <button onClick={() => nav('/torneios')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Todos os torneios
          </button>
          <div className="grid md:grid-cols-[1fr_auto] gap-6 items-end">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {isLive && (
                  <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500 text-white text-[10px] font-bold tracking-[0.2em]">
                    <Radio className="h-3 w-3" /> AO VIVO
                  </motion.span>
                )}
                {!isLive && (
                  <span className="px-3 py-1 rounded-full bg-secondary text-xs font-bold tracking-widest uppercase">{stateLabel[t.event_state] || t.status}</span>
                )}
                {t.verified && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold"><ShieldCheck className="h-3 w-3" /> VERIFICADO</span>}
                <span className="text-[10px] tracking-widest uppercase text-muted-foreground">{t.type}</span>
              </div>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-display font-bold mb-3 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                {t.title}
              </motion.h1>
              {t.narrative && <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">{t.narrative}</p>}
              {t.description && !t.narrative && <p className="text-sm text-muted-foreground max-w-2xl">{t.description}</p>}
            </div>
            <div className="md:w-80 space-y-3">
              <HypeMeter value={t.hype_score || 0} max={Math.max(1000, (t.hype_score || 0) + 200)} />
              <div className="grid grid-cols-3 gap-2">
                <Stat icon={<Users className="h-3.5 w-3.5" />} label="Inscritos" value={`${participants.length}/${t.max_participants}`} />
                <Stat icon={<Award className="h-3.5 w-3.5" />} label="Prêmio" value={t.prize_pool_amount ? `R$ ${Number(t.prize_pool_amount).toFixed(0)}` : (t.prize || '—')} />
                <Stat icon={<Trophy className="h-3.5 w-3.5" />} label="XP Campeão" value={`+${t.xp_champion || 500}`} />
              </div>
              {t.event_state === 'registration' && !joined && (
                <Button onClick={join} size="lg" className="w-full bg-gradient-to-r from-primary to-purple-500 hover:opacity-90">
                  <Sparkles className="h-4 w-4 mr-2" /> Inscreva-se agora
                </Button>
              )}
              {joined && (
                <div className="text-center text-sm text-primary font-bold py-2 border border-primary/30 rounded-lg bg-primary/10">
                  ✓ Você está inscrito
                </div>
              )}
              {isFinished && t.forum_thread_id && (
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link to={`/m/forum/post/${t.forum_thread_id}`}>
                    <MessageSquare className="h-4 w-4 mr-2" /> Discussão no fórum
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Storylines */}
      <div className="container mx-auto px-4 py-8 space-y-10">
        <StorylinesPanel items={storylines} />

        {/* Bracket + chat */}
        <Tabs defaultValue="bracket">
          <TabsList>
            <TabsTrigger value="bracket">Chaveamento</TabsTrigger>
            {isLive && <TabsTrigger value="chat">Chat ao vivo</TabsTrigger>}
            <TabsTrigger value="highlights">Highlights</TabsTrigger>
            <TabsTrigger value="participants">Participantes ({participants.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="bracket" className="mt-6">
            {matches.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Chaveamento ainda não foi gerado.</p>
              </div>
            ) : (
              <CinematicBracket matches={matches as any} profiles={profiles} bracketType={t.bracket_type as any} />
            )}
          </TabsContent>

          {isLive && (
            <TabsContent value="chat" className="mt-6 max-w-3xl mx-auto">
              <LiveTournamentChat tournamentId={t.id} />
            </TabsContent>
          )}

          <TabsContent value="highlights" className="mt-6">
            {highlights.length === 0 ? (
              <p className="text-center py-16 text-muted-foreground">Nenhum highlight ainda.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {highlights.map((h: any) => (
                  <div key={h.id} className="bg-card border border-border rounded-xl overflow-hidden">
                    {h.image_url && <img src={h.image_url} alt={h.title} className="w-full aspect-video object-cover" />}
                    <div className="p-3">
                      <h4 className="font-bold text-sm">{h.title}</h4>
                      {h.description && <p className="text-xs text-muted-foreground mt-1">{h.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="participants" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {participants.map((p: any) => {
                const pf = profiles[p.user_id];
                return (
                  <Link key={p.user_id} to={`/perfil/${p.user_id}`} className="bg-card border border-border rounded-xl p-3 text-center hover:border-primary/60 transition-colors">
                    {pf?.avatar_url ? <img src={pf.avatar_url} alt="" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" /> : <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-2" />}
                    <p className="text-xs truncate">{pf?.display_name || 'Jogador'}</p>
                    {t.winner_id === p.user_id && <Crown className="h-3 w-3 mx-auto mt-1 text-yellow-500" />}
                  </Link>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {isFinished && (t.winner_id || t.runner_up_id || t.third_place_id) && (
          <section>
            <h2 className="text-sm font-bold tracking-[0.25em] uppercase text-muted-foreground mb-4">🏆 Pódio</h2>
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { id: t.runner_up_id, rank: 2, color: 'from-zinc-300 to-zinc-500', icon: '🥈' },
                { id: t.winner_id, rank: 1, color: 'from-yellow-300 to-amber-500', icon: '🥇' },
                { id: t.third_place_id, rank: 3, color: 'from-amber-700 to-orange-800', icon: '🥉' },
              ].map(slot => {
                const pf = slot.id ? profiles[slot.id] : null;
                return (
                  <motion.div key={slot.rank} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: slot.rank * 0.1 }}
                    className={`text-center p-4 rounded-xl bg-gradient-to-br ${slot.color} ${slot.rank === 1 ? 'scale-110' : 'opacity-80'}`}>
                    <div className="text-3xl mb-2">{slot.icon}</div>
                    {pf?.avatar_url ? <img src={pf.avatar_url} className="w-14 h-14 rounded-full mx-auto border-2 border-white/40 object-cover" /> : <div className="w-14 h-14 rounded-full bg-black/20 mx-auto" />}
                    <p className="text-xs font-bold text-black/80 mt-2 truncate">{pf?.display_name || 'TBD'}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/60 rounded-lg p-2 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">{icon}<span className="text-[9px] uppercase tracking-widest">{label}</span></div>
      <div className="text-sm font-bold tabular-nums">{value}</div>
    </div>
  );
}
