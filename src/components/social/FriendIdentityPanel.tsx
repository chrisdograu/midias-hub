import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Gamepad2, Trophy, Clock, Film, Link2 } from 'lucide-react';

interface Props { userId: string; }

const PLATFORM_LABEL: Record<string, string> = {
  steam: 'Steam', psn: 'PlayStation', xbox: 'Xbox', nintendo: 'Nintendo',
  epic: 'Epic Games', battlenet: 'Battle.net', riot: 'Riot', origin: 'EA',
};

export default function FriendIdentityPanel({ userId }: Props) {
  const { data: platforms = [] } = useQuery({
    queryKey: ['fi-platforms', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('connected_platforms').select('platform,username,profile_url,is_public')
        .eq('user_id', userId).eq('is_public', true);
      return data || [];
    },
  });
  const { data: achievements = [] } = useQuery({
    queryKey: ['fi-achievements', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_achievements' as any).select('*').eq('user_id', userId)
        .order('unlocked_at', { ascending: false }).limit(6);
      return (data as any[]) || [];
    },
  });
  const { data: playtime = [] } = useQuery({
    queryKey: ['fi-playtime', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_playtime' as any).select('product_id,hours_played,produto:product_id(title,image_url)')
        .eq('user_id', userId).order('hours_played', { ascending: false }).limit(5);
      return (data as any[]) || [];
    },
  });
  const { data: clips = [] } = useQuery({
    queryKey: ['fi-clips', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('game_clips').select('id,title,thumbnail_url,video_url,product_id,created_at')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(6);
      return data || [];
    },
  });

  const totalHours = playtime.reduce((s, p) => s + Number(p.hours_played || 0), 0);
  const nothing = !platforms.length && !achievements.length && !playtime.length && !clips.length;
  if (nothing) return null;

  return (
    <div className="space-y-6 mt-6">
      {platforms.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" /> Plataformas conectadas
          </h2>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p: any, i) => (
              <a key={i} href={p.profile_url || '#'} target="_blank" rel="noreferrer"
                className="text-xs bg-card border border-border rounded-full px-3 py-1.5 hover:border-primary/40">
                <span className="font-semibold text-foreground">{PLATFORM_LABEL[p.platform] || p.platform}</span>
                <span className="text-muted-foreground"> · {p.username}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {playtime.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Mais jogados
            <span className="text-xs text-muted-foreground font-normal">({totalHours.toFixed(0)}h totais)</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {playtime.map((p: any) => (
              <div key={p.product_id} className="bg-card border border-border rounded-lg p-2">
                {p.produto?.image_url && <img src={p.produto.image_url} className="w-full aspect-[3/4] object-cover rounded mb-1" alt="" />}
                <p className="text-[10px] text-foreground line-clamp-1">{p.produto?.title}</p>
                <p className="text-[10px] text-primary font-bold">{Number(p.hours_played).toFixed(0)}h</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {achievements.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" /> Conquistas recentes
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {achievements.map((a: any) => (
              <div key={a.id} className="bg-card border border-border rounded-lg p-3">
                <p className="text-xs font-semibold text-foreground line-clamp-1">{a.title || a.name || 'Conquista'}</p>
                {a.description && <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{a.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {clips.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <Film className="h-4 w-4 text-accent" /> Clipes
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {clips.map(c => (
              <a key={c.id} href={c.video_url} target="_blank" rel="noreferrer"
                className="block bg-card border border-border rounded-lg overflow-hidden group">
                <div className="aspect-video bg-muted relative">
                  {c.thumbnail_url && <img src={c.thumbnail_url} className="w-full h-full object-cover" alt="" />}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Gamepad2 className="h-6 w-6 text-white" />
                  </div>
                </div>
                {c.title && <p className="text-[10px] text-foreground p-2 line-clamp-1">{c.title}</p>}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
