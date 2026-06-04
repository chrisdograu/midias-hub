import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Friend { id: string; display_name: string | null; avatar_url: string | null; }

export default function MGroupNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // amigos = follow mútuo
      const { data: iFollow } = await supabase.from('user_follows').select('following_id').eq('follower_id', user.id);
      const { data: followsMe } = await supabase.from('user_follows').select('follower_id').eq('following_id', user.id);
      const a = new Set((iFollow || []).map((r: any) => r.following_id));
      const b = new Set((followsMe || []).map((r: any) => r.follower_id));
      const mutual = [...a].filter(x => b.has(x));
      if (!mutual.length) { setFriends([]); setLoading(false); return; }
      const { data: profs } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', mutual);
      setFriends((profs || []) as any);
      setLoading(false);
    })();
  }, [user?.id]);

  if (!user) return <Navigate to="/m/auth" replace />;

  const toggle = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const create = async () => {
    if (!name.trim()) { toast.error('Dê um nome ao grupo'); return; }
    if (selected.size < 1) { toast.error('Selecione ao menos 1 amigo'); return; }
    setSubmitting(true);

    const userIds = [user.id, ...selected];
    // valida amizade mútua de todos os pares via RPC
    const { data: allFriends, error: vErr } = await supabase.rpc('are_users_all_mutual_friends' as any, { _users: userIds });
    if (vErr) { toast.error('Falha ao validar amizades'); setSubmitting(false); return; }
    if (!allFriends) {
      toast.error('Todos os participantes devem ser amigos entre si.');
      setSubmitting(false);
      return;
    }

    const { data: g, error } = await supabase.from('groups').insert({
      name: name.trim(), description: description.trim() || null, created_by: user.id,
    } as any).select('id').single();
    if (error || !g) { toast.error(error?.message || 'Erro ao criar grupo'); setSubmitting(false); return; }

    // criador é admin via trigger; insere os demais como member
    const rows = [...selected].map(uid => ({ group_id: g.id, user_id: uid, role: 'member' as const }));
    if (rows.length) await supabase.from('group_members').insert(rows as any);
    toast.success('Grupo criado!');
    navigate(`/m/grupos/${g.id}`);
  };

  return (
    <div className="px-4 py-5 space-y-4">
      <Link to="/m/grupos" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
      <h1 className="font-display text-xl font-bold gradient-text">Novo grupo</h1>

      <div className="space-y-3">
        <input value={name} onChange={e => setName(e.target.value)} maxLength={60} placeholder="Nome do grupo" className="w-full p-3 bg-card border border-border rounded-lg text-sm" />
        <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={200} rows={2} placeholder="Descrição (opcional)" className="w-full p-3 bg-card border border-border rounded-lg text-sm resize-none" />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Selecionar amigos ({selected.size})</p>
        <p className="text-[11px] text-muted-foreground mb-2">⚠️ Todos os escolhidos devem ser amigos entre si (follow mútuo).</p>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : friends.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Você ainda não tem amigos mútuos.</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
            {friends.map(f => (
              <button key={f.id} onClick={() => toggle(f.id)} className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors ${selected.has(f.id) ? 'bg-primary/15 border border-primary/40' : 'bg-card border border-border'}`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent overflow-hidden flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  {f.avatar_url ? <img src={f.avatar_url} alt="" className="w-full h-full object-cover" /> : (f.display_name?.[0]?.toUpperCase() || '?')}
                </div>
                <span className="text-sm font-medium flex-1 text-left truncate">{f.display_name || 'Usuário'}</span>
                {selected.has(f.id) && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <button onClick={create} disabled={submitting} className="w-full py-3 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold disabled:opacity-50">
        {submitting ? 'Criando...' : 'Criar grupo'}
      </button>
    </div>
  );
}
