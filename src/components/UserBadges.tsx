import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface BadgeRow {
  badge_id: string;
  awarded_at: string;
  badge_catalog: { name: string; description: string; icon: string; category: string } | null;
}

interface Props {
  userId: string | null | undefined;
  max?: number;
  className?: string;
}

export default function UserBadges({ userId, max = 12, className }: Props) {
  const [badges, setBadges] = useState<BadgeRow[]>([]);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('user_badges' as any)
        .select('badge_id, awarded_at, badge_catalog(name, description, icon, category)')
        .eq('user_id', userId)
        .order('awarded_at', { ascending: false })
        .limit(max);
      if (mounted) setBadges((data as any) || []);
    })();
    return () => { mounted = false; };
  }, [userId, max]);

  if (!badges.length) return null;

  return (
    <div className={cn('flex flex-wrap gap-1.5 justify-center', className)}>
      {badges.map(b => (
        <span
          key={b.badge_id}
          title={`${b.badge_catalog?.name || b.badge_id}\n${b.badge_catalog?.description || ''}`}
          className="inline-flex items-center gap-1 rounded-full bg-secondary/60 border border-border/50 px-2 py-0.5 text-xs"
        >
          <span>{b.badge_catalog?.icon || '🏆'}</span>
          <span className="font-medium">{b.badge_catalog?.name || b.badge_id}</span>
        </span>
      ))}
    </div>
  );
}
