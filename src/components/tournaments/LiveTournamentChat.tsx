import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Msg {
  id: string; user_id: string; content: string; kind: string;
  created_at: string; payload?: any;
}
interface Profile { id: string; display_name: string | null; avatar_url: string | null }

const HYPE_EMOJIS = ['🔥', '⚡', '👑', '💥', '🎯', '😱'];

export default function LiveTournamentChat({ tournamentId, matchId }: { tournamentId: string; matchId?: string }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      let q = supabase.from('tournament_chat_messages' as any).select('*')
        .eq('tournament_id', tournamentId).order('created_at', { ascending: true }).limit(200);
      if (matchId) q = q.eq('match_id', matchId);
      const { data } = await q;
      const items = ((data as any) || []) as Msg[];
      setMsgs(items);
      const uids = [...new Set(items.map(m => m.user_id))];
      if (uids.length) {
        const { data: profs } = await supabase.from('profiles').select('id, display_name, avatar_url').in('id', uids);
        setProfiles(Object.fromEntries((profs || []).map(p => [p.id, p as Profile])));
      }
    })();

    const ch = supabase.channel(`tournament-chat-${tournamentId}-${matchId || 'all'}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tournament_chat_messages', filter: `tournament_id=eq.${tournamentId}` },
        async (payload) => {
          const m = payload.new as Msg;
          if (matchId && (m as any).match_id !== matchId) return;
          setMsgs(prev => [...prev, m]);
          if (!profiles[m.user_id]) {
            const { data: p } = await supabase.from('profiles').select('id, display_name, avatar_url').eq('id', m.user_id).maybeSingle();
            if (p) setProfiles(prev => ({ ...prev, [m.user_id]: p as Profile }));
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [tournamentId, matchId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs.length]);

  const send = async (kind: string = 'message', content?: string) => {
    if (!user) return;
    const body = content ?? text.trim();
    if (!body) return;
    await supabase.from('tournament_chat_messages' as any).insert({
      tournament_id: tournamentId, match_id: matchId || null,
      user_id: user.id, kind, content: body,
    });
    if (kind === 'message') setText('');
  };

  return (
    <div className="flex flex-col bg-card/40 backdrop-blur-md border border-border/60 rounded-xl overflow-hidden h-[480px]">
      <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between bg-gradient-to-r from-red-500/10 to-amber-500/10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <span className="text-xs font-bold tracking-[0.2em] uppercase">Chat ao vivo</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{msgs.length} mensagens</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        <AnimatePresence initial={false}>
          {msgs.map(m => {
            const p = profiles[m.user_id];
            const isHype = m.kind === 'hype';
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className={`flex gap-2 items-start text-sm ${isHype ? 'bg-amber-500/10 border border-amber-500/30 rounded-lg px-2 py-1' : ''}`}
              >
                {p?.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-primary mr-1.5">{p?.display_name || '...'}</span>
                  <span className={`break-words ${isHype ? 'text-amber-300 font-bold text-base' : 'text-foreground/90'}`}>{m.content}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {msgs.length === 0 && <p className="text-center text-xs text-muted-foreground py-8">Seja o primeiro a animar!</p>}
      </div>

      <div className="border-t border-border/60 p-2 space-y-2 bg-background/40">
        <div className="flex gap-1 justify-center">
          {HYPE_EMOJIS.map(e => (
            <button key={e} onClick={() => send('hype', e)} className="text-lg hover:scale-125 transition-transform">{e}</button>
          ))}
        </div>
        {user ? (
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Mande hype..." maxLength={200} className="h-9 text-sm" />
            <Button type="submit" size="sm" disabled={!text.trim()}><Send className="h-3.5 w-3.5" /></Button>
          </form>
        ) : (
          <p className="text-xs text-center text-muted-foreground py-1">Entre para participar do chat</p>
        )}
      </div>
    </div>
  );
}
