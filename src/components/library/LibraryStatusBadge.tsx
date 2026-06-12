// Badges visuais consistentes para status / completação / platinação.
// Usado em Biblioteca, FriendProfile, SocialLibrary e Mobile.
import { cn } from '@/lib/utils';

export const STATUS_LABELS: Record<string, string> = {
  quero_jogar: 'Quero jogar',
  jogando: 'Jogando',
  pausado: 'Pausado',
  zerado: 'Completado',
  platinado: 'Platinado',
  rejogando: 'Rejogando',
  abandonado: 'Abandonado',
};

const STATUS_TONES: Record<string, string> = {
  quero_jogar: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  jogando: 'bg-green-500/20 text-green-300 border-green-500/40',
  pausado: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  zerado: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  platinado: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  rejogando: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  abandonado: 'bg-red-500/20 text-red-300 border-red-500/40',
};

export function StatusPill({ status, className }: { status?: string | null; className?: string }) {
  if (!status) return null;
  return (
    <span className={cn(
      'inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border',
      STATUS_TONES[status] || 'bg-secondary text-muted-foreground border-border',
      className,
    )}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

/** Mostra "💎 PLAT" ou "✓ 100%" no canto do card. Platinum tem prioridade. */
export function CompletionBadge({ platinum, completed, verifiedSource, className }: {
  platinum?: boolean | null;
  completed?: boolean | null;
  verifiedSource?: string | null;
  className?: string;
}) {
  if (!platinum && !completed) return null;
  const verified = verifiedSource && verifiedSource !== 'user_declared';
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {platinum && (
        <span title={verified ? 'Platinado (verificado)' : 'Platinado'}
          className="text-[10px] font-bold bg-gradient-to-br from-cyan-400 to-cyan-600 text-white px-1.5 py-0.5 rounded-full shadow-lg">
          💎 PLAT{verified ? ' ✓' : ''}
        </span>
      )}
      {completed && !platinum && (
        <span title={verified ? 'Completado (verificado)' : 'Completado'}
          className="text-[10px] font-bold bg-gradient-to-br from-purple-500 to-purple-700 text-white px-1.5 py-0.5 rounded-full shadow-lg">
          ✓ 100%{verified ? ' ✓' : ''}
        </span>
      )}
    </div>
  );
}
