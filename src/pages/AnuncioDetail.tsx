import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMensagens } from '@/hooks/useMensagens';
import { ArrowLeft, MessageCircle, Send, Loader2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function AnuncioDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [showChat, setShowChat] = useState(false);

  const { data: anuncio, isLoading } = useQuery({
    queryKey: ['anuncio', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anuncios')
        .select('*, profiles:seller_id(display_name, avatar_url)')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { mensagens, enviarMensagem } = useMensagens(anuncio?.seller_id);

  const handleSend = async () => {
    if (!message.trim() || !anuncio) return;
    if (!user) { toast.error('Faça login para enviar mensagem'); return; }
    try {
      await enviarMensagem.mutateAsync({ receiverId: anuncio.seller_id, content: message, anuncioId: anuncio.id });
      setMessage('');
    } catch { toast.error('Erro ao enviar mensagem'); }
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!anuncio) return <div className="container mx-auto px-4 py-16 text-center"><p className="text-muted-foreground">Anúncio não encontrado.</p></div>;

  const isOwner = user?.id === anuncio.seller_id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar ao Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-foreground mb-2">{anuncio.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">{anuncio.platform}</span>
              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">{anuncio.condition}</span>
            </div>
            <p className="text-muted-foreground">{anuncio.description || 'Sem descrição'}</p>
          </motion.div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <div className="text-3xl font-bold text-price">R$ {Number(anuncio.price).toFixed(2)}</div>
            <p className="text-sm text-muted-foreground">Jogo: {anuncio.game_title}</p>
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-foreground">{(anuncio as any).profiles?.display_name || 'Vendedor'}</span>
            </div>
            {!isOwner && user && (
              <button onClick={() => setShowChat(!showChat)}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all">
                <MessageCircle className="h-5 w-5" /> Enviar Mensagem
              </button>
            )}
            {!user && (
              <Link to="/auth" className="block w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg text-center hover:opacity-90 transition-all">
                Faça login para contatar
              </Link>
            )}
          </div>

          {/* Chat */}
          {showChat && user && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-3 border-b border-border">
                <p className="text-sm font-medium text-foreground">Chat com vendedor</p>
              </div>
              <div className="h-48 overflow-y-auto p-3 space-y-2 scrollbar-thin">
                {mensagens.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhuma mensagem ainda</p>}
                {mensagens.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.sender_id === user.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 p-3 border-t border-border">
                <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Digite sua mensagem..."
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <button onClick={handleSend} className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
