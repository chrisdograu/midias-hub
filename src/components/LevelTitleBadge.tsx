import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { xpToLevel } from './LevelBadge';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface Props {
  userId: string | null | undefined;
  className?: string;
  variant?: 'inline' | 'card';
}

/**
 * Hierarchical display: "Nv X · Título Ativo".
 * Reads profiles.active_title_id → user_titles.name and XP via user_xp_totals.
 */
export default function LevelTitleBadge({ userId, className, variant = 'inline' }: Props) {
  const [xp, setXp] = useState<number | null>(null);
  const [titleName, setTitleName] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      const [{ data: xpRow }, { data: prof }] = await Promise.all([
        supabase.from('user_xp_totals' as any).select('total_xp').eq('user_id', userId).maybeSingle(),
        supabase.from('profiles').select('active_title_id').eq('id', userId).maybeSingle(),
      ]);
      if (!alive) return;
      setXp(((xpRow as any)?.total_xp as number) ?? 0);
      const tid = (prof as any)?.active_title_id;
      if (tid) {
        const { data: t } = await supabase.from('user_titles' as any).select('name').eq('id', tid).maybeSingle();
        if (alive) setTitleName((t as any)?.name || null);
      } else {
        setTitleName(null);
      }
    })();
    return () => { alive = false; };
  }, [userId]);

  if (xp === null) return null;
  const { level } = xpToLevel(xp);

  if (variant === 'card') {
    return (
      <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 border border-primary/30 backdrop-blur', className)}>
        <span className="font-bold text-primary text-sm">Nv {level}</span>
        {titleName && (
          <>
            <span className="text-muted-foreground/60">·</span>
            <span className="inline-flex items-center gap-1 text-sm font-medium gradient-text">
              <Sparkles className="h-3 w-3" />
              {titleName}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', className)}>
      <span className="font-bold text-primary">Nv {level}</span>
      {titleName && (
        <>
          <span className="text-muted-foreground/50">·</span>
          <span className="gradient-text font-semibold">{titleName}</span>
        </>
      )}
    </span>
  );
}
