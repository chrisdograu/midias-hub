import { Link } from 'react-router-dom';
import { useAnuncios } from '@/hooks/useAnuncios';
import { useAuth } from '@/hooks/useAuth';
import CertificateBadge from '@/components/CertificateBadge';
import { ArrowLeft, Plus, Loader2, Package, Pause, Play, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function MeusAnuncios() {
  const { user } = useAuth();
  const { meusAnuncios, deletarAnuncio, isLoading } = useAnuncios();
  const queryClient = useQueryClient();

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const { error } = await supabase.from('anuncios').update({ status: newStatus }).eq('id', id);
    if (error) { toast.error('Erro'); return; }
    queryClient.invalidateQueries({ queryKey: ['meus-anuncios'] });
    toast.success(newStatus === 'active' ? 'Anúncio reativado' : 'Anúncio pausado');
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Meus Anúncios</h1>
        <Link to="/marketplace/criar" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-1 hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo
        </Link>
      </div>

      {meusAnuncios.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum anúncio ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meusAnuncios.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground">{a.title}</h3>
                  <p className="text-xs text-muted-foreground">{a.game_title} • {a.platform}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  a.status === 'active' ? 'bg-success/15 text-success' :
                  a.status === 'paused' ? 'bg-warning/15 text-warning' :
                  'bg-muted text-muted-foreground'
                }`}>{a.status === 'active' ? 'Ativo' : a.status === 'paused' ? 'Pausado' : 'Concluído'}</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                {Number(a.price) > 0 && <span className="text-lg font-bold text-price">R$ {Number(a.price).toFixed(2)}</span>}
                <CertificateBadge type={(a as any).certificate_type || 'sem_certificado'} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleStatus(a.id, a.status)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs font-medium text-foreground hover:bg-secondary/80">
                  {a.status === 'active' ? <><Pause className="h-3 w-3" /> Pausar</> : <><Play className="h-3 w-3" /> Reativar</>}
                </button>
                <button onClick={() => { deletarAnuncio.mutate(a.id); toast.success('Excluído'); }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/20">
                  <Trash2 className="h-3 w-3" /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
