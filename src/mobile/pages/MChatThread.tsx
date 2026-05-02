import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Send, Image as ImageIcon, ArrowLeftRight, Loader2, Check, X, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { MobileBadge } from '@/mobile/lib/badge';

interface Msg {
  id: string; sender_id: string; receiver_id: string; content: string;
  created_at: string; is_read: boolean; message_type: string;
  payload: any | null; image_url: string | null;
}
interface Conv { id: string; participant_1: string; participant_2: string; anuncio_id: string | null }
interface Other { id: string; display_name: string | null; avatar_url: string | null }
interface AdInfo { id: string; title: string; price: number; ad_type: string; accepts_counteroffer: boolean; desired_item: string | null }

export default function MChatThread() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conv, setConv] = useState<Conv | null>(null);
  const [other, setOther] = useState<Other | null>(null);
  const [ad, setAd] = useState<AdInfo | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerType, setOfferType] = useState<'money' | 'item'>('money');
  const [offerAmount, setOfferAmount] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!conversationId || !user) {
      setLoading(false);
      return;
    }
    const { data: c } = await supabase.from('conversas').select('id, participant_1, participant_2, anuncio_id').eq('id', conversationId).maybeSingle();
    if (!c) { setLoading(false); return; }
    const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
    const [{ data: p }, { data: a }, { data: m }] = await Promise.all([
      supabase.from('profiles').select('id, display_name, avatar_url').eq('id', otherId).maybeSingle(),
      c.anuncio_id ? supabase.from('anuncios').select('id, title, price, ad_type, accepts_counteroffer, desired_item').eq('id', c.anuncio_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from('mensagens').select('id, sender_id, receiver_id, content, created_at, is_read, message_type, payload, image_url').or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`).order('created_at'),
    ]);
    setConv(c as Conv);
    setOther(p as Other);
    setAd(a as AdInfo | null);
    setMsgs((m || []) as Msg[]);
    setLoading(false);
    await supabase.from('mensagens').update({ is_read: true }).eq('receiver_id', user.id).eq('sender_id', otherId).eq('is_read', false);
  };

  const upsertMessage = (message: Msg) => {
    setMsgs((current) => {
      const next = [...current];
      const index = next.findIndex((item) => item.id === message.id);
      if (index >= 0) next[index] = message;
      else next.push(message);
      next.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
      return next;
    });
  };

  useEffect(() => {
    load();
    if (!conversationId || !user) return;
    const participantIds = conv ? [conv.participant_1, conv.participant_2].sort() : null;
    if (!participantIds) return;
    const ch = supabase.channel(`thread-${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, (payload) => {
        const message = payload.new as Msg;
        const messageParticipants = [message.sender_id, message.receiver_id].sort();
        if (participantIds[0] !== messageParticipants[0] || participantIds[1] !== messageParticipants[1]) return;
        upsertMessage(message);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mensagens' }, (payload) => {
        const message = payload.new as Msg;
        const messageParticipants = [message.sender_id, message.receiver_id].sort();
        if (participantIds[0] !== messageParticipants[0] || participantIds[1] !== messageParticipants[1]) return;
        upsertMessage(message);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationId, user, conv?.participant_1, conv?.participant_2]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);

  const sendText = async () => {
    if (!text.trim() || !user || !other || sending) return;
    setSending(true);
    const content = text.trim().slice(0, 1000);
    setText('');
    const { error } = await supabase.from('mensagens').insert({
      sender_id: user.id, receiver_id: other.id, content,
      anuncio_id: conv?.anuncio_id || null, message_type: 'text',
    });
    if (error) toast.error('Erro ao enviar');
    else {
      setMsgs((current) => [...current, {
        id: `optimistic-${Date.now()}`,
        sender_id: user.id,
        receiver_id: other.id,
        content,
        created_at: new Date().toISOString(),
        is_read: false,
        message_type: 'text',
        payload: null,
        image_url: null,
      }]);
      if (conv) await supabase.from('conversas').update({ last_message: content, last_message_at: new Date().toISOString() }).eq('id', conv.id);
    }
    setSending(false);
  };

  const sendImage = async (file: File) => {
    if (!user || !other) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 5MB'); return; }
    setSending(true);
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
    const { error: upErr } = await supabase.storage.from('chat-images').upload(path, file);
    if (upErr) { toast.error('Erro ao enviar imagem'); setSending(false); return; }
    const { data: pub } = supabase.storage.from('chat-images').getPublicUrl(path);
    await supabase.from('mensagens').insert({
      sender_id: user.id, receiver_id: other.id, content: '[imagem]', image_url: pub.publicUrl,
      anuncio_id: conv?.anuncio_id || null, message_type: 'image',
    });
    if (conv) await supabase.from('conversas').update({ last_message: '📷 Imagem', last_message_at: new Date().toISOString() }).eq('id', conv.id);
    setSending(false);
  };

  const sendOffer = async () => {
    if (!user || !other) return;
    const payload = offerType === 'money'
      ? { type: 'money', amount: Number(offerAmount), status: 'pending' }
      : { type: 'item', desc: offerDesc.trim().slice(0, 200), status: 'pending' };
    if (offerType === 'money' && (!offerAmount || isNaN(Number(offerAmount)))) { toast.error('Valor inválido'); return; }
    if (offerType === 'item' && !offerDesc.trim()) { toast.error('Descreva o item'); return; }
    setSending(true);
    await supabase.from('mensagens').insert({
      sender_id: user.id, receiver_id: other.id,
      content: offerType === 'money' ? `Contraoferta: R$ ${offerAmount}` : `Contraoferta de troca: ${offerDesc}`,
      anuncio_id: conv?.anuncio_id || null, message_type: 'counteroffer', payload,
    });
    if (conv) await supabase.from('conversas').update({ last_message: '💱 Contraoferta', last_message_at: new Date().toISOString() }).eq('id', conv.id);
    setOfferOpen(false); setOfferAmount(''); setOfferDesc(''); setSending(false);
    toast.success('Contraoferta enviada');
  };

  const respondOffer = async (msg: Msg, accepted: boolean) => {
    if (!user) return;
    const newPayload = { ...msg.payload, status: accepted ? 'accepted' : 'rejected' };
    await supabase.from('mensagens').update({ payload: newPayload }).eq('id', msg.id);
    await supabase.from('mensagens').insert({
      sender_id: user.id, receiver_id: msg.sender_id,
      content: accepted ? '✅ Contraoferta aceita' : '❌ Contraoferta recusada',
      anuncio_id: conv?.anuncio_id || null, message_type: 'text',
    });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!conv || !other) return <div className="p-6 text-center text-muted-foreground">Conversa não encontrada.</div>;

  const canCounteroffer = ad && (ad.accepts_counteroffer || ad.ad_type === 'troca');

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <header className="sticky top-[57px] z-20 backdrop-blur-xl bg-background/80 border-b border-border/50 px-3 py-2 flex items-center gap-3">
        <button onClick={() => navigate('/m/chat')} className="p-1"><ArrowLeft className="h-5 w-5" /></button>
        <Link to={`/m/perfil/${other.id}`} className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent overflow-hidden flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
            {other.avatar_url ? <img src={other.avatar_url} alt="" className="w-full h-full object-cover" /> : other.display_name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{other.display_name || 'Usuário'}</p>
            {ad && <p className="text-[10px] text-muted-foreground truncate">📦 {ad.title}</p>}
          </div>
        </Link>
      </header>

      <div className="flex-1 px-3 py-3 space-y-2 overflow-y-auto">
        {msgs.length === 0 && <p className="text-center text-xs text-muted-foreground py-10">Mande a primeira mensagem 👋</p>}
        {msgs.map(m => {
          const own = m.sender_id === user?.id;
          if (m.message_type === 'counteroffer') {
            const status = m.payload?.status || 'pending';
            return (
              <div key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%] glass border border-accent/40 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-accent text-xs font-bold uppercase tracking-wide">
                    <ArrowLeftRight className="h-3.5 w-3.5" /> Contraoferta
                  </div>
                  <p className="text-sm font-semibold">
                    {m.payload?.type === 'money' ? `💰 R$ ${Number(m.payload.amount).toFixed(2)}` : `🎮 ${m.payload?.desc}`}
                  </p>
                  {status === 'pending' && !own && (
                    <div className="flex gap-2">
                      <button onClick={() => respondOffer(m, true)} className="flex-1 py-1.5 rounded-lg bg-success/20 text-success text-xs font-semibold flex items-center justify-center gap-1"><Check className="h-3 w-3" />Aceitar</button>
                      <button onClick={() => respondOffer(m, false)} className="flex-1 py-1.5 rounded-lg bg-destructive/20 text-destructive text-xs font-semibold flex items-center justify-center gap-1"><X className="h-3 w-3" />Recusar</button>
                    </div>
                  )}
                  {status !== 'pending' && (
                    <MobileBadge tone={status === 'accepted' ? 'success' : 'muted'}>
                      {status === 'accepted' ? '✅ Aceita' : '❌ Recusada'}
                    </MobileBadge>
                  )}
                </div>
              </div>
            );
          }
          return (
            <div key={m.id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${own ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card text-foreground rounded-bl-sm border border-border/50'}`}>
                {m.image_url
                  ? <img src={m.image_url} alt="" className="rounded-lg max-h-60 object-cover" />
                  : <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>}
                <p className={`text-[9px] mt-0.5 ${own ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-[68px] backdrop-blur-xl bg-background/90 border-t border-border/50 px-2 py-2">
        {canCounteroffer && (
          <button onClick={() => setOfferOpen(true)} className="w-full mb-2 py-1.5 rounded-lg bg-accent/20 text-accent text-xs font-semibold flex items-center justify-center gap-1.5">
            <ArrowLeftRight className="h-3.5 w-3.5" /> Fazer contraoferta
          </button>
        )}
        <div className="flex items-center gap-1.5">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && sendImage(e.target.files[0])} />
          <button onClick={() => fileRef.current?.click()} disabled={sending} className="p-2.5 rounded-full bg-secondary text-muted-foreground"><ImageIcon className="h-4 w-4" /></button>
          <input
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendText())}
            placeholder="Digite uma mensagem..." maxLength={1000}
            className="flex-1 px-3 py-2.5 bg-card border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button onClick={sendText} disabled={sending || !text.trim()} className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground flex items-center justify-center disabled:opacity-50">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {offerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end" onClick={() => setOfferOpen(false)}>
          <motion.div initial={{ y: 200 }} animate={{ y: 0 }} className="w-full bg-card rounded-t-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold flex items-center gap-2"><ArrowLeftRight className="h-4 w-4 text-accent" />Fazer contraoferta</h3>
            <div className="flex gap-2 p-1 bg-secondary rounded-lg">
              <button onClick={() => setOfferType('money')} className={`flex-1 py-2 rounded-md text-xs font-semibold ${offerType === 'money' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>💰 Dinheiro</button>
              <button onClick={() => setOfferType('item')} className={`flex-1 py-2 rounded-md text-xs font-semibold ${offerType === 'item' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>🎮 Item</button>
            </div>
            {offerType === 'money' ? (
              <input type="number" step="0.01" value={offerAmount} onChange={e => setOfferAmount(e.target.value)} placeholder="R$ 0,00" className="w-full p-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            ) : (
              <textarea value={offerDesc} onChange={e => setOfferDesc(e.target.value)} maxLength={200} rows={3} placeholder="Descreva o item que está oferecendo..." className="w-full p-3 bg-background border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50" />
            )}
            <div className="flex gap-2">
              <button onClick={() => setOfferOpen(false)} className="flex-1 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold">Cancelar</button>
              <button onClick={sendOffer} disabled={sending} className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold">Enviar</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
