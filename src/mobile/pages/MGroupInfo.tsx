import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Users, Crown, Eye, LogOut, ShieldOff, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Member { user_id: string; role: 'admin'|'member'|'observer'; display_name: string | null; avatar_url: string | null; }

const ROLE_LABEL = { admin: 'Administrador', member: 'Membro', observer: 'Observador' } as const;

export default function MGroupInfo() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [actionFor, setActionFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data: g } = await supabase.from('groups').select('*').eq('id', id).maybeSingle();
    setGroup(g);
    const { data: ms } = await supabase.from('group_members')
      .select('user_id, role, profiles:user_id(display_name, avatar_url)')
      .eq('group_id', id);
    setMembers(((ms as any) || []).map((m: any) => ({
      user_id: m.user_id, role: m.role,
      display_name: m.profiles?.display_name, avatar_url: m.profiles?.avatar_url,
    })));
    const { data: b } = await supabase.from('group_blocks').select('id').eq('group_id', id).eq('user_id', user?.id || '').maybeSingle();
    setBlocked(!!b);
    setLoading(false);
  };

  useEffect(() => { if (user && id) load(); }, [user?.id, id]);

  if (!user) return <Navigate to="/m/auth" replace />;
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!group) return <div className="p-6 text-center text-muted-foreground">Grupo não encontrado</div>;

  const myRole = members.find(m => m.user_id === user.id)?.role;
  const isAdmin = myRole === 'admin';
  const visible = expanded ? members : members.slice(0, 5);

  const changeRole = async (uid: string, role: 'admin'|'member'|'observer') => {
    const { error } = await supabase.from('group_members').update({ role }).eq('group_id', id!).eq('user_id', uid);
    if (error) toast.error(error.message); else { toast.success('Papel atualizado'); load(); }
    setActionFor(null);
  };

  const removeMember = async (uid: string) => {
    if (!confirm('Remover este membro?')) return;
    const { error } = await supabase.from('group_members').delete().eq('group_id', id!).eq('user_id', uid);
    if (error) toast.error(error.message); else { toast.success('Removido'); load(); }
  };

  const leave = async () => {
    if (!confirm('Sair do grupo?')) return;
    const { error } = await supabase.from('group_members').delete().eq('group_id', id!).eq('user_id', user.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Você saiu do grupo');
    navigate('/m/grupos');
  };

  const toggleBlock = async () => {
    if (blocked) {
      await supabase.from('group_blocks').delete().eq('group_id', id!).eq('user_id', user.id);
      toast.success('Grupo desbloqueado');
    } else {
      await supabase.from('group_blocks').insert({ group_id: id!, user_id: user.id } as any);
      toast.success('Grupo bloqueado');
    }
    setBlocked(!blocked);
  };

  return (
    <div className="px-4 py-5 space-y-4 pb-24">
      <Link to={`/m/grupos/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</Link>

      <div className="text-center">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent overflow-hidden flex items-center justify-center text-primary-foreground">
          {group.image_url ? <img src={group.image_url} alt="" className="w-full h-full object-cover" /> : <Users className="h-8 w-8" />}
        </div>
        <h1 className="font-display text-xl font-bold mt-2">{group.name}</h1>
        {group.description && <p className="text-sm text-muted-foreground mt-1">{group.description}</p>}
      </div>

      <section className="glass rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Participantes ({members.length})</p>
        </div>
        <div className="space-y-1.5">
          {visible.map(m => (
            <div key={m.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-card/50 transition-colors">
              <Link to={`/m/perfil/${m.user_id}`} className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent overflow-hidden flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover" /> : (m.display_name?.[0]?.toUpperCase() || '?')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate flex items-center gap-1.5">
                    {m.display_name || 'Usuário'}
                    {m.role === 'admin' && <Crown className="h-3 w-3 text-yellow-500" />}
                    {m.role === 'observer' && <Eye className="h-3 w-3" />}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{ROLE_LABEL[m.role]}</p>
                </div>
              </Link>
              {isAdmin && m.user_id !== user.id && (
                <button onClick={() => setActionFor(actionFor === m.user_id ? null : m.user_id)} className="text-xs text-primary px-2 py-1">Ações</button>
              )}
            </div>
          ))}
          {actionFor && isAdmin && (() => {
            const m = members.find(x => x.user_id === actionFor);
            if (!m) return null;
            return (
              <div className="glass rounded-lg p-2 space-y-1">
                <p className="text-[10px] uppercase text-muted-foreground px-2">Definir papel de {m.display_name}</p>
                <button onClick={() => changeRole(m.user_id, 'admin')} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-card flex items-center gap-2"><Crown className="h-3.5 w-3.5 text-yellow-500" /> Promover para Administrador</button>
                <button onClick={() => changeRole(m.user_id, 'member')} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-card flex items-center gap-2"><Users className="h-3.5 w-3.5 text-primary" /> Definir como Membro</button>
                <button onClick={() => changeRole(m.user_id, 'observer')} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-card flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> Definir como Observador</button>
                <button onClick={() => removeMember(m.user_id)} className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-card flex items-center gap-2 text-destructive"><Trash2 className="h-3.5 w-3.5" /> Remover do grupo</button>
              </div>
            );
          })()}
        </div>
        {members.length > 5 && (
          <button onClick={() => setExpanded(!expanded)} className="w-full text-center text-xs text-primary mt-2 flex items-center justify-center gap-1">
            {expanded ? <>Ocultar <ChevronUp className="h-3 w-3" /></> : <>Ver todos os participantes <ChevronDown className="h-3 w-3" /></>}
          </button>
        )}
      </section>

      <section className="space-y-2">
        <button onClick={leave} className="w-full p-3 rounded-xl bg-card border border-border text-sm font-semibold flex items-center justify-center gap-2 text-destructive">
          <LogOut className="h-4 w-4" /> Sair do grupo
        </button>
        <button onClick={toggleBlock} className="w-full p-3 rounded-xl bg-card border border-border text-sm font-semibold flex items-center justify-center gap-2">
          <ShieldOff className="h-4 w-4" /> {blocked ? 'Desbloquear grupo' : 'Bloquear grupo'}
        </button>
      </section>
    </div>
  );
}
