import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function useFollow(targetId?: string) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!targetId) return;
    const [{ count: f }, { count: fg }, mine] = await Promise.all([
      supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', targetId),
      supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', targetId),
      user ? supabase.from('user_follows').select('id').eq('follower_id', user.id).eq('following_id', targetId).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    setFollowersCount(f || 0);
    setFollowingCount(fg || 0);
    setIsFollowing(!!mine.data);
  }, [targetId, user?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const toggle = async () => {
    if (!user) { toast.error('Entre para seguir'); return; }
    if (!targetId || user.id === targetId) return;
    setLoading(true);
    if (isFollowing) {
      await supabase.from('user_follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
      setIsFollowing(false);
      setFollowersCount(c => Math.max(0, c - 1));
    } else {
      const { error } = await supabase.from('user_follows').insert({ follower_id: user.id, following_id: targetId });
      if (error) { toast.error('Não foi possível seguir'); setLoading(false); return; }
      setIsFollowing(true);
      setFollowersCount(c => c + 1);
      // Notifica o usuário seguido
      await supabase.from('notifications').insert({
        user_id: targetId, type: 'novo_seguidor' as any,
        title: 'Você tem um novo seguidor 🎮',
        body: 'Alguém começou a seguir seu perfil na MIDIAS',
        reference_type: 'profile', reference_id: user.id,
      });
      toast.success('Seguindo ✨');
    }
    setLoading(false);
  };

  return { isFollowing, followersCount, followingCount, loading, toggle, refresh };
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  const { data } = await supabase.from('user_follows').select('following_id').eq('follower_id', userId);
  return (data || []).map(d => d.following_id);
}
