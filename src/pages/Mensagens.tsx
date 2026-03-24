import { useState } from 'react';
import { useMensagens } from '@/hooks/useMensagens';
import { useAuth } from '@/hooks/useAuth';
import { MessageCircle, Send, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Mensagens() {
  const { user } = useAuth();
  const [selectedPartner, setSelectedPartner] = useState<string | undefined>();
  const { conversas, mensagens, enviarMensagem } = useMensagens(selectedPartner);
  const [msg, setMsg] = useState('');

  const handleSend = async () => {
    if (!msg.trim() || !selectedPartner) return;
    await enviarMensagem.mutateAsync({ receiverId: selectedPartner, content: msg });
    setMsg('');
  };

  if (!user) return (
    <div className="container mx-auto px-4 py-16 text-center">
      <p className="text-muted-foreground">Faça login para ver suas mensagens.</p>
      <Link to="/auth" className="text-primary hover:underline mt-2 inline-block">Entrar</Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-6">Mensagens</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[60vh]">
        {/* Conversations list */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-3 border-b border-border">
            <p className="text-sm font-medium text-foreground">Conversas</p>
          </div>
          <div className="overflow-y-auto h-full scrollbar-thin">
            {conversas.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhuma conversa</p>}
            {conversas.map(conv => (
              <button key={conv.partnerId} onClick={() => setSelectedPartner(conv.partnerId)}
                className={`w-full text-left p-3 hover:bg-secondary/50 transition-colors border-b border-border ${selectedPartner === conv.partnerId ? 'bg-secondary' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{conv.partnerName[0].toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">{conv.partnerName}</p>
                      {conv.unread > 0 && <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">{conv.unread}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="md:col-span-2 bg-card border border-border rounded-xl overflow-hidden flex flex-col">
          {!selectedPartner ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Selecione uma conversa</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
                {mensagens.map(m => (
                  <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${m.sender_id === user.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 p-3 border-t border-border">
                <input value={msg} onChange={e => setMsg(e.target.value)} placeholder="Digite sua mensagem..."
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <button onClick={handleSend} className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
