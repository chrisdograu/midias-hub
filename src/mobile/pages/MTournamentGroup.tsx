import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Send, Crown, Trash2, ShieldCheck, UserMinus, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { MentionText } from '@/mobile/components/MentionText';
import { recordMentions } from '@/mobile/lib/mentions';

interface Msg { id: string; sender_id: string; content: string; created_at: string; }

export default function MTournamentGroup() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<any>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [participants, setParticipants] = useState<any[]>([]);
  const [isMod, setIsMod] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSide, setShowSide] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data: t } = await supabase.from('tournaments').select('*').eq('id', id).maybeSingle();
      setTournament(t);
      const { data: mods } = await supabase.from('tournament_moderators').select('user_id').eq('tournament_id', id);
      setIsMod(!!mods?.some((m: any) => m.user_id === user.id));
      await loadParticipants();
      await loadMessages();
      setLoading(false);
    })();
    const ch = supabase.channel(`mtg-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensagens', filter: `tournament_id=eq.${id}` }, loadMessages)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_participants', filter: `tournament_id=eq.${id}` }, loadParticipants)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id, id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const loadMessages = async () => {
    const { data } = await supabase.from('mensagens').select('id, sender_id, content, created_at')
      .eq('tournament_id', id!).is('group_id', null).order('created_at', { ascending: true }).limit(200);
    setMessages((data as any) || []);
    const ids = [...new Set(((data as any) || []).map((m: any) => m.sender_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', ids as any);
      const map: any = {};
      (profs || []).forEach((p: any) => map[p.id] = p);
      setProfiles(prev => ({ ...prev, ...map }));
    }
  };
  const loadParticipants = async () => {
    const { data } = await supabase.from('tournament_participants')
      .select('user_id, profiles:user_id(display_name, avatar_url)')
      .eq('tournament_id', id!);
    setParticipants((data as any) || []);
  };

  const send = async () => {
    if (!text.trim() || !user) return;
    const content = text.trim();
    setText('');
    const { data: inserted, error } = await supabase.from('mensagens').insert({
      sender_id: user.id, receiver_id: user.id, content,
      tournament_id: id!, message_type: 'text',
    } as any).select('id').single();
    if (error) { toast.error(error.message); return; }
    if (inserted) recordMentions({ text: content, mentionedBy: user.id, sourceType: 'message', sourceId: inserted.id });
  };

  const deleteMsg = async (mid: string) => { await supabase.from('mensagens').delete().eq('id', mid); };
  const kick = async (uid: string) => {
    if (!confirm('Remover do torneio?')) return;
    await supabase.from('tournament_participants').delete().eq('tournament_id', id!).eq('user_id', uid);
  };
  const mute = async (uid: string) => {
    const h = Number(prompt('Silenciar por quantas horas?', '24'));
    if (!h || h <= 0) return;
    const until = new Date(Date.now() + h*3600000).toISOString();
    await supabase.from('tournament_chat_mutes').insert({ tournament_id: id!, user_id: uid, muted_by: user!.id, muted_until: until } as any);
    toast.success('Silenciado');
  };

  if (!user) return <Navigate to="/m/auth" replace />;
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!tournament) return <div className="p-6 text-center text-muted-foreground">Torneio não encontrado</div>;

  const amParticipant = participants.some((p: any) => p.user_id === user.id);
  if (!amParticipant && !isMod) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">Apenas participantes acessam o grupo do torneio.</p>
        <Link to="/m" className="text-primary text-sm">Voltar</Link>
      </div>
    );
  }
  const threadHeight = 'calc(100dvh - 57px - 56px - env(safe-area-inset-bottom))';

  return (
    <div className="flex flex-col overflow-hidden bg-background" style={{ height: threadHeight }}>
      <header className="shrink-0 backdrop-blur-xl bg-background/80 border-b border-border/50 px-3 py-2 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate flex items-center gap-1">
            🏆 {tournament.title}
            {isMod && <Crown className="h-3 w-3 text-yellow-500" />}
          </p>
          <p className="text-[10px] text-muted-foreground">{participants.length} participantes</p>
        </div>
        <button onClick={() => setShowSide(!showSide)} className="p-2"><ShieldCheck className="h-4 w-4 text-primary" /></button>
      </header>

      {showSide && (
        <div className="shrink-0 max-h-[40vh] overflow-y-auto border-b border-border bg-card/50 p-3">
          <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Participantes</p>
          <div className="space-y-1.5">
            {participants.map((p: any) => (
              <div key={p.user_id} className="flex items-center gap-2 text-sm">
                <Link to={`/m/perfil/${p.user_id}`} className="flex items-center gap-2 flex-1 min-w-0">
                  {p.profiles?.avatar_url ? <img src={p.profiles.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-secondary" />}
                  <span className="truncate">{p.profiles?.display_name || 'Usuário'}</span>
                </Link>
                {isMod && p.user_id !== user.id && (
                  <>
                    <button onClick={() => mute(p.user_id)} className="text-yellow-500" title="Silenciar"><VolumeX className="h-3.5 w-3.5" /></button>
                    <button onClick={() => kick(p.user_id)} className="text-destructive"><UserMinus className="h-3.5 w-3.5" /></button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 px-3 py-3 space-y-2 overflow-y-auto">
        {messages.length === 0 && <p className="text-center text-xs text-muted-foreground py-10">Sem mensagens ainda.</p>}
        {messages.map(m => {
          const own = m.sender_id === user.id;
          const prof = profiles[m.sender_id];
          return (
            <div key={m.id} className={`group flex ${own ? 'justify-end' : 'justify-start'} gap-2`}>
              {!own && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent overflow-hidden flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0">
                  {prof?.avatar_url ? <img src={prof.avatar_url} alt="" className="w-full h-full object-cover" /> : (prof?.display_name?.[0]?.toUpperCase() || '?')}
                </div>
              )}
              <div className={`max-w-[78%] rounded-2xl px-3 py-2 ${own ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border/50 rounded-bl-sm'}`}>
                {!own && <p className="text-[10px] font-semibold opacity-80">{prof?.display_name || 'Usuário'}</p>}
                <MentionText text={m.content} className="text-sm whitespace-pre-wrap break-words" />
                <p className={`text-[9px] mt-0.5 ${own ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{new Date(m.created_at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</p>
              </div>
              {isMod && !own && (
                <button onClick={() => deleteMsg(m.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-3 w-3" /></button>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 backdrop-blur-xl bg-background/90 border-t border-border/50 px-2 py-2">
        <div className="flex items-center gap-1.5">
          <input value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Mensagem (use @)..." maxLength={1000}
            className="flex-1 px-3 py-2.5 bg-card border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <button onClick={send} disabled={!text.trim()} className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground flex items-center justify-center disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
