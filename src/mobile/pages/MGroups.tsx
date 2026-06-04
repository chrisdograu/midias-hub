import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Plus, Users, Loader2, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { timeAgo } from '@/mobile/lib/time';

interface Group {
  id: string; name: string; image_url: string | null; description: string | null;
  member_count: number; my_role: string; last_message: string | null; last_message_at: string | null;
}

export default function MGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data: mems } = await supabase
        .from('group_members').select('group_id, role').eq('user_id', user.id);
      const ids = (mems || []).map((m: any) => m.group_id);
      if (!ids.length) { setGroups([]); setLoading(false); return; }
      const [{ data: gs }, { data: counts }, { data: last }] = await Promise.all([
        supabase.from('groups').select('id, name, image_url, description').in('id', ids),
        supabase.from('group_members').select('group_id').in('group_id', ids),
        supabase.from('mensagens').select('group_id, content, created_at').in('group_id', ids).order('created_at', { ascending: false }).limit(200),
      ]);
      const countMap = new Map<string, number>();
      (counts || []).forEach((c: any) => countMap.set(c.group_id, (countMap.get(c.group_id) || 0) + 1));
      const lastMap = new Map<string, any>();
      (last || []).forEach((m: any) => { if (!lastMap.has(m.group_id)) lastMap.set(m.group_id, m); });
      const roleMap = new Map<string, string>((mems || []).map((m: any) => [m.group_id, m.role]));
      const merged = (gs || []).map((g: any) => ({
        ...g,
        member_count: countMap.get(g.id) || 0,
        my_role: roleMap.get(g.id) || 'member',
        last_message: lastMap.get(g.id)?.content || null,
        last_message_at: lastMap.get(g.id)?.created_at || null,
      })).sort((a, b) => +new Date(b.last_message_at || 0) - +new Date(a.last_message_at || 0));
      setGroups(merged);
      setLoading(false);
    })();
  }, [user?.id]);

  if (!user) return <Navigate to="/m/auth" replace />;

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold gradient-text">Grupos</h1>
        <Link to="/m/grupos/novo" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-semibold">
          <Plus className="h-3.5 w-3.5" /> Novo
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : groups.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Você ainda não tem grupos.</p>
          <p className="text-xs mt-1">Crie um grupo com seus amigos para conversar juntos.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map(g => (
            <Link key={g.id} to={`/m/grupos/${g.id}`} className="flex items-center gap-3 p-3 glass rounded-xl hover:border-primary/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent overflow-hidden flex items-center justify-center text-primary-foreground font-bold shrink-0">
                {g.image_url ? <img src={g.image_url} alt="" className="w-full h-full object-cover" /> : <Users className="h-5 w-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                    {g.name}
                    {g.my_role === 'admin' && <Crown className="h-3 w-3 text-yellow-500" />}
                  </p>
                  <span className="text-[10px] text-muted-foreground shrink-0">{g.last_message_at ? timeAgo(g.last_message_at) : ''}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{g.member_count} membros · {g.last_message || 'Sem mensagens'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
