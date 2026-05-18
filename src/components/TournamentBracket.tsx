import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Radio } from 'lucide-react';

interface Match {
  id: string; round: number; position: number;
  player_a: string | null; player_b: string | null;
  score_a: number | null; score_b: number | null;
  winner: string | null; status: string;
}

interface Profile { id: string; display_name: string | null; avatar_url: string | null; }

export default function TournamentBracket({ tournament, onClose }: { tournament: { id: string; title: string }; onClose: () => void }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data: ms } = await supabase.from('tournament_matches' as any).select('*').eq('tournament_id', tournament.id).order('round').order('position');
    const list = ((ms as any) || []) as Match[];
    setMatches(list);
    const ids = [...new Set(list.flatMap(m => [m.player_a, m.player_b]).filter(Boolean) as string[])];
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', ids);
      const map: Record<string, Profile> = {};
      (profs || []).forEach(p => { map[p.id] = p as any; });
      setProfiles(prev => ({ ...prev, ...map }));
    }
    setLoading(false);
  }, [tournament.id]);

  useEffect(() => {
    reload();
    const ch = supabase.channel(`bracket-${tournament.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_matches', filter: `tournament_id=eq.${tournament.id}` }, reload)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_participants', filter: `tournament_id=eq.${tournament.id}` }, reload)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [tournament.id, reload]);

  const rounds = [...new Set(matches.map(m => m.round))].sort();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {tournament.title} — Chaveamento
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-success bg-success/10 border border-success/30 rounded-full px-2 py-0.5">
              <Radio className="h-2.5 w-2.5 animate-pulse" /> AO VIVO
            </span>
          </DialogTitle>
        </DialogHeader>
        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div> :
          matches.length === 0 ? <p className="text-muted-foreground text-center py-12">Chaves ainda não geradas.</p> : (
            <div className="flex gap-6 overflow-x-auto pb-4">
              {rounds.map(r => (
                <div key={r} className="space-y-3 min-w-[220px]">
                  <h3 className="text-sm font-semibold text-center text-muted-foreground">Rodada {r}</h3>
                  {matches.filter(m => m.round === r).map(m => {
                    const a = m.player_a ? profiles[m.player_a] : null;
                    const b = m.player_b ? profiles[m.player_b] : null;
                    const cell = (p: Profile | null, score: number | null, isWinner: boolean) => (
                      <div className={`flex items-center justify-between px-3 py-2 rounded ${isWinner ? 'bg-primary/15 border-l-2 border-primary' : 'bg-secondary/30'}`}>
                        <span className="text-sm truncate">{p?.display_name || '—'}</span>
                        <span className="text-xs font-mono text-muted-foreground">{score ?? '-'}</span>
                      </div>
                    );
                    return (
                      <div key={m.id} className="border border-border rounded-lg overflow-hidden bg-card">
                        {cell(a, m.score_a, m.winner === m.player_a && !!m.player_a)}
                        <div className="border-t border-border" />
                        {cell(b, m.score_b, m.winner === m.player_b && !!m.player_b)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
      </DialogContent>
    </Dialog>
  );
}
