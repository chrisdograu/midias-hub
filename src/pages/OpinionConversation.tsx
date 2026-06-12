// Rota canônica: /perfil/:userId/jogo/:productId/opniao/:opinionId/conversa/:convId
// Conversa privada permanente vinculada a uma opinião. Opinião original fixa no topo.
import { useEffect, useRef, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Send, Loader2, Lock, BookOpen, Gamepad2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function OpinionConversation() {
  const { userId, productId, opinionId, convId } = useParams();
  const { user } = useAuth();
  const [opinion, setOpinion] = useState<any>(null);
  const [conv, setConv] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !opinionId || !convId) return;
    (async () => {
      const [{ data: op }, { data: c }, { data: msgs }] = await Promise.all([
        supabase.from('game_opinions').select('*, author:profiles!user_id(display_name, avatar_url)').eq('id', opinionId).maybeSingle(),
        supabase.from('opinion_conversations').select('*').eq('id', convId).maybeSingle(),
        supabase.from('game_opinion_replies').select('*').eq('conversation_id', convId).order('created_at', { ascending: true }),
      ]);
      setOpinion(op);
      setConv(c);
      if (op?.product_id) {
        const { data: p } = await supabase.from('produtos').select('id,title,image_url').eq('id', op.product_id).maybeSingle();
        setProduct(p);
      }
      setMessages(msgs || []);
      setLoading(false);
    })();

    const ch = supabase.channel(`opconv-${convId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_opinion_replies', filter: `conversation_id=eq.${convId}` },
        (p) => setMessages(prev => [...prev, p.new as any]))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, opinionId, convId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  if (!user) return <Navigate to="/auth" replace />;
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!opinion || !conv) return <div className="container mx-auto py-20 text-center text-muted-foreground">Conversa não encontrada.</div>;

  const isParticipant = user.id === conv.author_id || user.id === conv.responder_id;
  if (!isParticipant) return (
    <div className="container mx-auto py-20 text-center">
      <Lock className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
      <p className="text-muted-foreground">Esta conversa é privada.</p>
    </div>
  );

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    const { error } = await supabase.from('game_opinion_replies').insert({
      opinion_id: opinionId, conversation_id: convId,
      sender_id: user.id, responder_id: conv.responder_id, text: text.trim(),
    });
    setSending(false);
    if (error) { toast.error('Erro ao enviar'); return; }
    setText('');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <Link to="/conversas-opinioes" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> Conversas de Opiniões
      </Link>

      {/* Opinião fixa no topo */}
      <div className="bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/30 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-primary">Opinião original</span>
          {product && (
            <Link to={`/jogo/${product.id}`} className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary">
              <Gamepad2 className="h-3 w-3" /> {product.title}
            </Link>
          )}
        </div>
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0">
            {opinion.author?.avatar_url
              ? <img src={opinion.author.avatar_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-sm">{(opinion.author?.display_name || '?')[0]}</div>}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{opinion.author?.display_name || 'Autor'}</p>
            <p className="text-sm mt-1 whitespace-pre-wrap">{opinion.text}</p>
          </div>
        </div>
        {product && (
          <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-2">
            <Link to={`/jogo/${product.id}/review-completa`} className="text-xs inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 text-accent hover:bg-accent/30">
              <BookOpen className="h-3 w-3" /> Escrever Review Completa
            </Link>
          </div>
        )}
      </div>

      {/* Conversa */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3 min-h-[40vh] max-h-[60vh] overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Inicie a conversa.</p>
        ) : messages.map(m => {
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${mine ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                <p className="whitespace-pre-wrap">{m.text}</p>
                <p className={`text-[10px] mt-1 ${mine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {new Date(m.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <Textarea value={text} onChange={e => setText(e.target.value)} placeholder="Sua mensagem..." rows={2} className="flex-1" />
        <Button onClick={send} disabled={sending || !text.trim()} size="icon"><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
