import { useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Eye, Trophy, ShieldAlert } from 'lucide-react';

interface Props {
  /** Spoiler manual: qualquer leitor precisa clicar para revelar. */
  isSpoiler?: boolean;
  /** Spoiler vinculado a uma conquista (por nome). Quem possuir vê direto com badge. */
  achievementName?: string | null;
  /** Produto da conquista — usado para casar com user_achievements. */
  productId?: string | null;
  /** Compat antigo (UUID) — não usar mais. */
  achievementLockId?: string | null;
  children: ReactNode;
  className?: string;
}

/**
 * Fase 1 — Filtro de spoilers do fórum/reviews.
 * Três comportamentos:
 *  1. Spoiler manual (isSpoiler): blur + overlay âmbar "Toque para revelar".
 *  2. Spoiler de conquista (achievementName) e viewer NÃO possui:
 *     blur intenso + overlay vermelho com nome da conquista e CTA reforçado.
 *  3. Spoiler de conquista e viewer possui: conteúdo aberto, com badge dourado
 *     "🏆 Liberado por <conquista>" — nenhum bloqueio.
 */
export default function SpoilerGuard({
  isSpoiler,
  achievementName,
  productId,
  achievementLockId,
  children,
  className = '',
}: Props) {
  const { user } = useAuth();
  const [revealed, setRevealed] = useState(false);

  const hasAchByName = useQuery({
    queryKey: ['ach-by-name', user?.id, productId, achievementName],
    queryFn: async () => {
      if (!user || !achievementName || !productId) return false;
      const { data } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('achievement_name', achievementName)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!achievementName && !!productId,
    staleTime: 60_000,
  });

  const hasAchById = useQuery({
    queryKey: ['ach-by-id', user?.id, achievementLockId],
    queryFn: async () => {
      if (!user || !achievementLockId) return false;
      const { data } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', achievementLockId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!achievementLockId && !achievementName,
    staleTime: 60_000,
  });

  const isAchievementLocked = !!achievementName || !!achievementLockId;
  const hasAchievement = achievementName ? hasAchByName.data : hasAchById.data;

  // Caso 3: tem a conquista → libera com badge
  if (isAchievementLocked && hasAchievement) {
    return (
      <div className={className}>
        <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40 text-yellow-300 text-[10px] font-bold uppercase tracking-wider">
          <Trophy className="h-3 w-3" />
          Liberado por: {achievementName || 'Conquista'}
        </div>
        {children}
      </div>
    );
  }

  const gated = (isSpoiler || isAchievementLocked) && !revealed;
  if (!gated) return <div className={className}>{children}</div>;

  // Caso 2: spoiler de conquista (viewer não tem) — vermelho/intenso
  if (isAchievementLocked) {
    return (
      <div className={`relative overflow-hidden rounded-lg border-2 border-destructive/60 bg-destructive/10 ${className}`}>
        <div className="pointer-events-none select-none" style={{ filter: 'blur(22px) saturate(0.6)' }}>
          {children}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); setRevealed(true); }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 backdrop-blur-md hover:bg-background/50 transition-colors p-4 text-center"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/30 border border-destructive/70 text-destructive-foreground shadow-lg shadow-destructive/30">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-xs font-black uppercase tracking-widest">Spoiler crítico de conquista</span>
          </div>
          {achievementName && (
            <span className="text-xs text-foreground/90 font-semibold">
              🏆 Vinculado a: <span className="text-destructive-foreground">{achievementName}</span>
            </span>
          )}
          <span className="text-[11px] text-muted-foreground max-w-xs">
            Você ainda não desbloqueou essa conquista. Pode atrapalhar sua experiência.
          </span>
          <span className="mt-1 text-xs text-foreground/90 flex items-center gap-1.5 font-semibold">
            <Eye className="h-3.5 w-3.5" /> Revelar mesmo assim
          </span>
        </button>
      </div>
    );
  }

  // Caso 1: spoiler manual — âmbar padrão
  return (
    <div className={`relative overflow-hidden rounded-lg border border-amber-500/40 bg-amber-500/5 ${className}`}>
      <div className="pointer-events-none select-none" style={{ filter: 'blur(14px)' }}>
        {children}
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setRevealed(true); }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/40 backdrop-blur-sm hover:bg-background/30 transition-colors"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/60 text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Alerta de spoiler</span>
        </div>
        <span className="text-xs text-foreground/90 flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" /> Toque para revelar
        </span>
      </button>
    </div>
  );
}
