import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Crown, Radio } from 'lucide-react';

interface Match {
  id: string; round: number; player_a: string | null; player_b: string | null;
  winner_id: string | null; score_a: number; score_b: number;
  is_live: boolean; bracket_side?: string; round_label?: string | null;
  tournament_id: string;
}
interface Profile { id: string; display_name: string | null; avatar_url: string | null }

interface Props {
  matches: Match[];
  profiles: Record<string, Profile>;
  bracketType?: 'single' | 'double';
}

function PlayerSlot({ id, profiles, score, isWinner, isLive }: { id: string | null; profiles: Record<string, Profile>; score: number; isWinner: boolean; isLive: boolean }) {
  const p = id ? profiles[id] : null;
  return (
    <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-md transition-colors ${
      isWinner ? 'bg-primary/20 text-primary font-bold' : 'bg-secondary/40 text-foreground/80'
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        {p?.avatar_url ? (
          <img src={p.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
        )}
        <span className="text-xs truncate">{p?.display_name || (id ? 'Jogador' : 'TBD')}</span>
        {isLive && <Radio className="h-3 w-3 text-red-500 animate-pulse shrink-0" />}
      </div>
      <span className="text-sm font-bold tabular-nums">{score}</span>
    </div>
  );
}

export default function CinematicBracket({ matches, profiles, bracketType = 'single' }: Props) {
  const nav = useNavigate();
  const upper = matches.filter(m => m.bracket_side === 'upper');
  const lower = matches.filter(m => m.bracket_side === 'lower');
  const useDouble = bracketType === 'double' && lower.length > 0;

  const renderColumn = (list: Match[], title: string) => {
    const rounds = Array.from(new Set(list.map(m => m.round))).sort((a, b) => a - b);
    return (
      <div>
        <h3 className="text-xs font-bold tracking-[0.25em] uppercase text-muted-foreground mb-4">{title}</h3>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {rounds.map(r => {
            const ms = list.filter(m => m.round === r);
            return (
              <div key={r} className="flex flex-col gap-4 min-w-[220px]">
                <div className="text-[10px] tracking-widest uppercase text-muted-foreground/70 text-center">
                  {ms[0]?.round_label || `Rodada ${r}`}
                </div>
                {ms.map((m, i) => (
                  <motion.button
                    key={m.id}
                    onClick={() => nav(`/torneios/${m.tournament_id}/partida/${m.id}`)}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`relative bg-card/60 backdrop-blur-sm border rounded-xl p-2 space-y-1 text-left hover:border-primary/60 transition-all hover:scale-[1.02] ${
                      m.is_live ? 'border-red-500/60 shadow-[0_0_24px_-6px] shadow-red-500/40' : 'border-border/60'
                    }`}
                  >
                    {m.is_live && (
                      <div className="absolute -top-2 left-3 px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold tracking-widest flex items-center gap-1">
                        <Radio className="h-2.5 w-2.5 animate-pulse" /> AO VIVO
                      </div>
                    )}
                    <PlayerSlot id={m.player_a} profiles={profiles} score={m.score_a} isWinner={m.winner_id === m.player_a} isLive={m.is_live} />
                    <PlayerSlot id={m.player_b} profiles={profiles} score={m.score_b} isWinner={m.winner_id === m.player_b} isLive={m.is_live} />
                    {m.winner_id && (
                      <div className="flex items-center gap-1 text-[10px] text-primary/80 px-2 pt-0.5">
                        <Crown className="h-3 w-3" /> Finalizado
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {renderColumn(upper, useDouble ? 'CHAVE SUPERIOR' : 'CHAVEAMENTO')}
      {useDouble && renderColumn(lower, 'CHAVE INFERIOR (REPESCAGEM)')}
    </div>
  );
}
