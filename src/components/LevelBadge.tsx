import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export function xpToLevel(xp: number) {
  const level = Math.max(1, Math.floor(Math.sqrt(Math.max(xp, 0) / 100)) + 1);
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const nextLevelXp = Math.pow(level, 2) * 100;
  const progress = Math.min(100, Math.round(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100));
  return { level, progress, currentLevelXp, nextLevelXp };
}

interface Props {
  userId: string | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showXp?: boolean;
  className?: string;
}

export default function LevelBadge({ userId, size = 'sm', showXp = false, className }: Props) {
  const [xp, setXp] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('user_xp_totals' as any)
        .select('total_xp')
        .eq('user_id', userId)
        .maybeSingle();
      if (mounted) setXp(((data as any)?.total_xp as number) ?? 0);
    })();
    return () => { mounted = false; };
  }, [userId]);

  if (xp === null) return null;
  const { level, progress } = xpToLevel(xp);
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-bold bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 text-primary',
        sizeClasses,
        className
      )}
      title={`Nível ${level} • ${xp} XP • ${progress}% para o próximo nível`}
    >
      <span>⭐</span>
      <span>Nv {level}</span>
      {showXp && <span className="text-muted-foreground font-normal">· {xp} XP</span>}
    </span>
  );
}
