import { useEffect, useRef, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Loader2, Send, ShieldCheck, Trash2, VolumeX, UserMinus, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useSubmitGuard } from '@/hooks/useSubmitGuard';

interface Msg { id: string; sender_id: string; content: string; created_at: string; }
interface Profile { id: string; display_name: string | null; avatar_url: string | null; }

export default function TournamentGroup() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<any>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [participants, setParticipants] = useState<any[]>([]);
  const [isMod, setIsMod] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { submitting, guard } = useSubmitGuard();

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

    const ch = supabase.channel(`tg-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensagens', filter: `tournament_id=eq.${id}` }, () => loadMessages())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_participants', filter: `tournament_id=eq.${id}` }, () => loadParticipants())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, id]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages]);

  const loadMessages = async () => {
    const { data } = await supabase.from('mensagens')
      .select('id, sender_id, content, created_at')
      .eq('tournament_id', id!).order('created_at', { ascending: true }).limit(200);
    setMessages((data as any) || []);
    const ids = [...new Set(((data as any) || []).map((m: any) => m.sender_id))];
    if (ids.length) {
      const { data: profs } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', ids as any);
      const map: Record<string, Profile> = {};
      (profs || []).forEach((p: any) => { map[p.id] = p; });
      setProfiles(prev => ({ ...prev, ...map }));
    }
  };

  const loadParticipants = async () => {
    const { data } = await supabase.from('tournament_participants')
      .select('user_id, profiles:user_id(display_name, avatar_url)')
      .eq('tournament_id', id!);
    setParticipants((data as any) || []);
  };

  const send = guard(async () => {
    if (!text.trim() || !user) return;
    const { error } = await supabase.from('mensagens').insert({
      sender_id: user.id,
      receiver_id: user.id, // grupo: usa próprio id como placeholder
      content: text.trim(),
      tournament_id: id!,
      message_type: 'text',
    } as any);
    if (error) { toast.error(error.message); return; }
    setText('');
  });

  const deleteMsg = async (mid: string) => {
    const { error } = await supabase.from('mensagens').delete().eq('id', mid);
    if (error) toast.error(error.message); else toast.success('Mensagem removida');
  };

  const muteUser = async (uid: string) => {
    const hours = Number(prompt('Silenciar por quantas horas?', '24'));
    if (!hours || hours <= 0) return;
    const until = new Date(Date.now() + hours * 3600000).toISOString();
    const { error } = await supabase.from('tournament_chat_mutes').insert({
      tournament_id: id!, user_id: uid, muted_by: user!.id, muted_until: until,
    } as any);
    if (error) toast.error(error.message); else toast.success(`Silenciado por ${hours}h`);
  };

  const kickUser = async (uid: string) => {
    if (!confirm('Remover este participante do torneio?')) return;
    const { error } = await supabase.from('tournament_participants').delete()
      .eq('tournament_id', id!).eq('user_id', uid);
    if (error) toast.error(error.message); else toast.success('Removido');
  };

  if (!user) return <Navigate to="/auth" replace />;
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!tournament) return <div className="container mx-auto py-20 text-center text-muted-foreground">Torneio não encontrado</div>;

  const amParticipant = participants.some((p: any) => p.user_id === user.id);
  if (!amParticipant && !isMod) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">Apenas participantes têm acesso ao grupo deste torneio.</p>
        <Link to={`/torneios/${id}`} className="text-primary hover:underline">Voltar ao evento</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <Link to={`/torneios/${id}`} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-3">
        <ArrowLeft className="h-4 w-4" /> Voltar ao evento
      </Link>
      <div className="grid lg:grid-cols-[1fr_280px] gap-4 h-[calc(100vh-180px)]">
        {/* Chat */}
        <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-bold flex items-center gap-2">{tournament.title} {isMod && <Crown className="h-4 w-4 text-yellow-500" />}</h2>
              <p className="text-xs text-muted-foreground">Grupo de participantes · {participants.length} membros</p>
            </div>
            {isMod && <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">Moderador</span>}
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Sem mensagens. Quebre o gelo!</p>}
            {messages.map(m => {
              const prof = profiles[m.sender_id];
              const mine = m.sender_id === user.id;
              return (
                <div key={m.id} className={`flex gap-2 group ${mine ? 'flex-row-reverse' : ''}`}>
                  <div className={`max-w-[70%] rounded-2xl px-3 py-2 ${mine ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                    {!mine && <div className="text-xs font-semibold opacity-80 mb-0.5">{prof?.display_name || 'Usuário'}</div>}
                    <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">{new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  {isMod && !mine && (
                    <button onClick={() => deleteMsg(m.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <Input value={text} onChange={e => setText(e.target.value)} placeholder="Mensagem..." onKeyDown={e => e.key === 'Enter' && send()} />
            <Button onClick={send} disabled={submitting || !text.trim()}><Send className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Participantes */}
        <aside className="bg-card border border-border rounded-xl p-4 overflow-y-auto">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Participantes</h3>
          <ul className="space-y-2">
            {participants.map((p: any) => (
              <li key={p.user_id} className="flex items-center justify-between text-sm group">
                <Link to={`/amigo/${p.user_id}`} className="flex items-center gap-2 hover:text-primary truncate">
                  {p.profiles?.avatar_url ? (
                    <img src={p.profiles.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : <div className="w-6 h-6 rounded-full bg-secondary" />}
                  <span className="truncate">{p.profiles?.display_name || 'Usuário'}</span>
                </Link>
                {isMod && p.user_id !== user.id && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => muteUser(p.user_id)} className="text-muted-foreground hover:text-yellow-500" title="Silenciar"><VolumeX className="h-3.5 w-3.5" /></button>
                    <button onClick={() => kickUser(p.user_id)} className="text-muted-foreground hover:text-destructive" title="Remover"><UserMinus className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
