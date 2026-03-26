import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMensagens } from '@/hooks/useMensagens';
import { useTradeProposals } from '@/hooks/useTradeProposals';
import { useDenuncias } from '@/hooks/useDenuncias';
import CertificateBadge from '@/components/CertificateBadge';
import { HalfStarDisplay } from '@/components/HalfStarRating';
import { ArrowLeft, MessageCircle, Send, Loader2, User, Flag, ArrowRightLeft, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const categoryLabels: Record<string, string> = {
  jogo_fisico: 'Jogo Físico', jogo_digital: 'Jogo Digital', console: 'Console', acessorio: 'Acessório',
};

export default function AnuncioDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [proposalItem, setProposalItem] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');

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

  const { data: sellerReputation } = useQuery({
    queryKey: ['seller-rep', anuncio?.seller_id],
    queryFn: async () => {
      if (!anuncio?.seller_id) return { avg: 0, count: 0 };
      const { data } = await supabase
        .from('avaliacoes_usuario')
        .select('rating')
        .eq('reviewed_id', anuncio.seller_id);
      const ratings = data || [];
      return { avg: ratings.length ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0, count: ratings.length };
    },
    enabled: !!anuncio?.seller_id,
  });

  const { mensagens, enviarMensagem } = useMensagens(anuncio?.seller_id);
  const { proposals, createProposal, updateStatus } = useTradeProposals(id);
  const { reportar } = useDenuncias();

  const isOwner = user?.id === anuncio?.seller_id;

  const handleSend = async () => {
    if (!message.trim() || !anuncio) return;
    if (!user) { toast.error('Faça login'); return; }
    try {
      await enviarMensagem.mutateAsync({ receiverId: anuncio.seller_id, content: message, anuncioId: anuncio.id });
      setMessage('');
    } catch { toast.error('Erro ao enviar'); }
  };

  const handleProposal = async () => {
    if (!proposalItem.trim()) return;
    try {
      await createProposal.mutateAsync(proposalItem);
      toast.success('Proposta enviada!');
      setShowProposal(false);
      setProposalItem('');
    } catch { toast.error('Erro ao enviar proposta'); }
  };

  const handleReport = async () => {
    if (!reportReason.trim() || !id) return;
    try {
      await reportar.mutateAsync({ targetType: 'anuncio', targetId: id, reason: reportReason });
      toast.success('Denúncia enviada');
      setShowReport(false);
      setReportReason('');
    } catch { toast.error('Erro ao denunciar'); }
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!anuncio) return <div className="container mx-auto px-4 py-16 text-center"><p className="text-muted-foreground">Anúncio não encontrado.</p></div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl pb-20 md:pb-6">
      <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${(anuncio as any).ad_type === 'troca' ? 'bg-accent/20 text-accent' : 'bg-primary/15 text-primary'}`}>
                {(anuncio as any).ad_type === 'troca' ? '🔄 Troca' : '💰 Venda'}
              </span>
              <span className="text-xs text-muted-foreground">{categoryLabels[(anuncio as any).category] || ''}</span>
              <CertificateBadge type={(anuncio as any).certificate_type || 'sem_certificado'} size="md" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">{anuncio.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">{anuncio.platform}</span>
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">{anuncio.condition}</span>
            </div>
            <p className="text-muted-foreground">{anuncio.description || 'Sem descrição'}</p>
            {(anuncio as any).ad_type === 'troca' && (anuncio as any).desired_item && (
              <div className="mt-3 p-3 bg-accent/10 border border-accent/20 rounded-lg">
                <p className="text-xs text-accent font-medium">🔄 Deseja em troca:</p>
                <p className="text-sm text-foreground">{(anuncio as any).desired_item}</p>
              </div>
            )}
          </motion.div>

          {/* Trade proposals (owner view) */}
          {isOwner && proposals.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-foreground">Propostas de troca ({proposals.length})</h3>
              {proposals.map(p => (
                <div key={p.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">{(p as any).proposer_profile?.display_name || 'Usuário'} oferece:</p>
                    <p className="text-sm font-medium text-foreground">{p.offered_item}</p>
                    <span className={`text-[10px] ${p.status === 'accepted' ? 'text-success' : p.status === 'rejected' ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {p.status === 'pending' ? 'Pendente' : p.status === 'accepted' ? 'Aceita' : 'Recusada'}
                    </span>
                  </div>
                  {p.status === 'pending' && (
                    <div className="flex gap-1">
                      <button onClick={() => updateStatus.mutate({ proposalId: p.id, status: 'accepted' })}
                        className="p-1.5 bg-success/15 text-success rounded-lg hover:bg-success/25"><CheckCircle className="h-4 w-4" /></button>
                      <button onClick={() => updateStatus.mutate({ proposalId: p.id, status: 'rejected' })}
                        className="p-1.5 bg-destructive/15 text-destructive rounded-lg hover:bg-destructive/25"><XCircle className="h-4 w-4" /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            {(anuncio as any).ad_type === 'venda' ? (
              <div className="text-3xl font-bold text-price">R$ {Number(anuncio.price).toFixed(2)}</div>
            ) : (
              <div className="text-lg font-bold text-accent">🔄 Disponível para troca</div>
            )}
            <p className="text-sm text-muted-foreground">Item: {anuncio.game_title}</p>

            {/* Seller info */}
            <Link to={`/perfil/${anuncio.seller_id}`} className="flex items-center gap-3 pt-3 border-t border-border hover:bg-secondary/30 -mx-4 px-4 py-2 transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                {(anuncio as any).profiles?.avatar_url ? (
                  <img src={(anuncio as any).profiles.avatar_url} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{(anuncio as any).profiles?.display_name || 'Vendedor'}</p>
                {sellerReputation && sellerReputation.count > 0 && (
                  <div className="flex items-center gap-1">
                    <HalfStarDisplay rating={sellerReputation.avg} size={12} />
                    <span className="text-[10px] text-muted-foreground">({sellerReputation.count})</span>
                  </div>
                )}
              </div>
            </Link>

            {/* Actions */}
            {!isOwner && user && (
              <div className="space-y-2">
                <button onClick={() => setShowChat(!showChat)}
                  className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90">
                  <MessageCircle className="h-5 w-5" /> Enviar Mensagem
                </button>
                {(anuncio as any).ad_type === 'troca' && (
                  <button onClick={() => setShowProposal(!showProposal)}
                    className="w-full py-3 bg-accent text-accent-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90">
                    <ArrowRightLeft className="h-5 w-5" /> Propor Troca
                  </button>
                )}
                <button onClick={() => setShowReport(!showReport)}
                  className="w-full py-2 text-xs text-muted-foreground hover:text-destructive flex items-center justify-center gap-1 transition-colors">
                  <Flag className="h-3 w-3" /> Denunciar
                </button>
              </div>
            )}
            {!user && (
              <Link to="/auth" className="block w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg text-center hover:opacity-90">
                Faça login para contatar
              </Link>
            )}
          </div>

          {/* Trade proposal form */}
          {showProposal && user && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Propor Troca</h3>
              <textarea value={proposalItem} onChange={e => setProposalItem(e.target.value)}
                placeholder="Descreva o que você oferece em troca..." rows={3}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none" />
              <div className="flex gap-2">
                <button onClick={() => setShowProposal(false)} className="flex-1 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground">Cancelar</button>
                <button onClick={handleProposal} disabled={createProposal.isPending}
                  className="flex-1 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">Enviar</button>
              </div>
            </motion.div>
          )}

          {/* Report form */}
          {showReport && user && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-destructive/20 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-destructive">Denunciar Anúncio</h3>
              <textarea value={reportReason} onChange={e => setReportReason(e.target.value)}
                placeholder="Descreva o motivo da denúncia..." rows={3}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-destructive/50 resize-none" />
              <div className="flex gap-2">
                <button onClick={() => setShowReport(false)} className="flex-1 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground">Cancelar</button>
                <button onClick={handleReport} className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:opacity-90">Denunciar</button>
              </div>
            </motion.div>
          )}

          {/* Chat */}
          {showChat && user && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-3 border-b border-border">
                <p className="text-sm font-medium text-foreground">Chat com {(anuncio as any).profiles?.display_name || 'vendedor'}</p>
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
