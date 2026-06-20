import { useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Eye } from 'lucide-react';

interface Props {
  isSpoiler?: boolean;
  achievementLockId?: string | null;
  children: ReactNode;
  className?: string;
}

/**
 * Fase 3 — Antispoiler Filter.
 * Renderiza children borrado + overlay se for spoiler OU se houver achievement_lock
 * e o usuário atual não possuir essa conquista.
 */
export default function SpoilerGuard({ isSpoiler, achievementLockId, children, className = '' }: Props) {
  const { user } = useAuth();
  const [revealed, setRevealed] = useState(false);

  const { data: hasAchievement } = useQuery({
    queryKey: ['user-has-achievement', user?.id, achievementLockId],
    queryFn: async () => {
      if (!user || !achievementLockId) return true;
      const { data } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', achievementLockId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!achievementLockId,
    staleTime: 60_000,
  });

  const gated = (isSpoiler || (achievementLockId && hasAchievement === false)) && !revealed;

  if (!gated) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border border-amber-500/40 bg-amber-500/5 ${className}`}>
      <div className="pointer-events-none select-none" style={{ filter: 'blur(14px)' }}>
        {children}
      </div>
      <button
        type="button"
        onClick={() => setRevealed(true)}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/40 backdrop-blur-sm hover:bg-background/30 transition-colors"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/60 text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Alerta de spoiler</span>
        </div>
        <span className="text-xs text-foreground/90 flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" /> Toque para revelar
        </span>
        {achievementLockId && hasAchievement === false && (
          <span className="text-[10px] text-muted-foreground">Conteúdo liberado para quem desbloqueou uma conquista específica</span>
        )}
      </button>
    </div>
  );
}
