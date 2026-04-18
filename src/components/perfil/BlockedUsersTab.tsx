import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, UserX, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';

interface BlockedUser {
  id: string;
  blocked_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export default function BlockedUsersTab() {
  const { user } = useAuth();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: blocks } = await supabase
      .from('blocked_users')
      .select('id, blocked_id')
      .eq('blocker_id', user.id);

    if (!blocks || blocks.length === 0) { setBlocked([]); setLoading(false); return; }

    const ids = blocks.map(b => b.blocked_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', ids);

    const map = new Map(profiles?.map(p => [p.id, p]) || []);
    setBlocked(blocks.map(b => {
      const p = map.get(b.blocked_id);
      return { id: b.id, blocked_id: b.blocked_id, display_name: p?.display_name || null, avatar_url: p?.avatar_url || null };
    }));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleUnblock = async (blockId: string) => {
    const { error } = await supabase.from('blocked_users').delete().eq('id', blockId);
    if (error) { toast.error('Erro ao desbloquear'); return; }
    toast.success('Usuário desbloqueado');
    load();
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (blocked.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ShieldOff className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Você não bloqueou nenhum usuário</p>
        <p className="text-xs mt-1">Bloqueios feitos no app mobile aparecem aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {blocked.map(b => (
        <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/40">
          <div className="w-10 h-10 rounded-full bg-primary/20 overflow-hidden flex items-center justify-center">
            {b.avatar_url ? <img src={b.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserX className="h-5 w-5 text-primary" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{b.display_name || 'Usuário'}</p>
          </div>
          <button onClick={() => handleUnblock(b.id)} className="text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-muted text-foreground transition-colors">
            Desbloquear
          </button>
        </div>
      ))}
    </div>
  );
}
