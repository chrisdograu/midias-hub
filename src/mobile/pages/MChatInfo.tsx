import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Image as ImageIcon, FileText, Sparkles, ShieldAlert, ShieldOff, BellOff, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Msg { id: string; content: string; image_url: string | null; message_type: string; created_at: string; }

export default function MChatInfo() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conv, setConv] = useState<any>(null);
  const [other, setOther] = useState<any>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [muted, setMuted] = useState(false);
  const [tab, setTab] = useState<'images'|'gifs'|'files'>('images');

  useEffect(() => {
    if (!user || !conversationId) return;
    (async () => {
      const { data: c } = await supabase.from('conversas').select('*').eq('id', conversationId).maybeSingle();
      if (!c) { setLoading(false); return; }
      setConv(c);
      const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
      const [{ data: p }, { data: ms }, { data: b }, { data: cs }] = await Promise.all([
        supabase.from('profiles').select('id, display_name, avatar_url, bio').eq('id', otherId).maybeSingle(),
        supabase.from('mensagens').select('id, content, image_url, message_type, created_at')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: false }).limit(300),
        supabase.from('blocked_users').select('id').eq('blocker_id', user.id).eq('blocked_id', otherId).maybeSingle(),
        supabase.from('conversation_settings').select('muted').eq('conversation_id', conversationId).eq('user_id', user.id).maybeSingle(),
      ]);
      setOther(p);
      setMsgs((ms || []) as any);
      setBlocked(!!b);
      setMuted(!!cs?.muted);
      setLoading(false);
    })();
  }, [user?.id, conversationId]);

  if (!user) return <Navigate to="/m/auth" replace />;
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!conv || !other) return <div className="p-6 text-center text-muted-foreground">Conversa não encontrada</div>;

  const images = msgs.filter(m => m.image_url && m.content === '[imagem]');
  const gifs = msgs.filter(m => m.image_url && m.content === '[gif]');
  const files = msgs.filter(m => m.message_type === 'file');

  const block = async () => {
    if (blocked) {
      await supabase.from('blocked_users').delete().eq('blocker_id', user.id).eq('blocked_id', other.id);
      toast.success('Desbloqueado'); setBlocked(false);
    } else {
      if (!confirm(`Bloquear ${other.display_name}?`)) return;
      await supabase.from('blocked_users').insert({ blocker_id: user.id, blocked_id: other.id } as any);
      toast.success('Bloqueado'); setBlocked(true);
    }
  };

  const toggleMute = async () => {
    const next = !muted;
    await supabase.from('conversation_settings').upsert({
      conversation_id: conversationId!, user_id: user.id, muted: next,
    } as any, { onConflict: 'conversation_id,user_id' });
    setMuted(next);
    toast.success(next ? '🔕 Notificações silenciadas' : '🔔 Notificações ativas');
  };

  return (
    <div className="px-4 py-5 space-y-4 pb-24">
      <Link to={`/m/chat/${conversationId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Voltar à conversa</Link>

      {/* Cabeçalho: clicar abre perfil */}
      <Link to={`/m/perfil/${other.id}`} className="block text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent overflow-hidden flex items-center justify-center text-primary-foreground text-2xl font-bold">
          {other.avatar_url ? <img src={other.avatar_url} alt="" className="w-full h-full object-cover" /> : other.display_name?.[0]?.toUpperCase()}
        </div>
        <h1 className="font-display text-lg font-bold mt-2">{other.display_name}</h1>
        {other.bio && <p className="text-xs text-muted-foreground mt-1">{other.bio}</p>}
        <p className="text-[10px] text-primary mt-1">Toque para abrir perfil</p>
      </Link>

      {/* Galeria */}
      <section className="glass rounded-xl p-3">
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg mb-3">
          <button onClick={() => setTab('images')} className={`flex-1 py-1.5 rounded-md text-xs font-semibold ${tab === 'images' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}><ImageIcon className="h-3 w-3 inline mr-1" />Imagens ({images.length})</button>
          <button onClick={() => setTab('gifs')} className={`flex-1 py-1.5 rounded-md text-xs font-semibold ${tab === 'gifs' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}><Sparkles className="h-3 w-3 inline mr-1" />GIFs ({gifs.length})</button>
          <button onClick={() => setTab('files')} className={`flex-1 py-1.5 rounded-md text-xs font-semibold ${tab === 'files' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}><FileText className="h-3 w-3 inline mr-1" />Arquivos ({files.length})</button>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(tab === 'images' ? images : tab === 'gifs' ? gifs : []).map(m => (
            <a key={m.id} href={m.image_url!} target="_blank" rel="noreferrer" className="aspect-square rounded-lg overflow-hidden bg-secondary">
              <img src={m.image_url!} alt="" className="w-full h-full object-cover" />
            </a>
          ))}
          {tab === 'files' && files.map(m => (
            <div key={m.id} className="col-span-3 p-2 bg-secondary rounded-lg text-xs flex items-center gap-2"><FileText className="h-3 w-3" />{m.content}</div>
          ))}
        </div>
        {((tab === 'images' && !images.length) || (tab === 'gifs' && !gifs.length) || (tab === 'files' && !files.length)) && (
          <p className="text-center text-xs text-muted-foreground py-6">Nada por aqui ainda.</p>
        )}
      </section>

      <section className="space-y-2">
        <button onClick={block} className="w-full p-3 rounded-xl bg-card border border-border text-sm font-semibold flex items-center justify-center gap-2 text-destructive">
          <ShieldOff className="h-4 w-4" /> {blocked ? 'Desbloquear usuário' : 'Bloquear usuário'}
        </button>
        <Link to={`/m/perfil/${other.id}`} className="w-full p-3 rounded-xl bg-card border border-border text-sm font-semibold flex items-center justify-center gap-2 text-destructive">
          <ShieldAlert className="h-4 w-4" /> Denunciar (via perfil)
        </Link>
      </section>
    </div>
  );
}
