import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Upload, X, Shield, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const inputClass = "w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
const selectClass = inputClass;

export default function CreateAd() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', game_title: '', platform: 'PC',
    condition: 'novo', price: '', ad_type: 'venda', category: 'jogo_digital',
    certificate_type: 'sem_certificado', desired_item: '',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Faça login'); return; }
    if (!form.title || !form.game_title) { toast.error('Preencha os campos obrigatórios'); return; }
    if (form.ad_type === 'venda' && !form.price) { toast.error('Informe o preço'); return; }

    setLoading(true);
    try {
      const { error } = await supabase.from('anuncios').insert({
        seller_id: user.id,
        title: form.title,
        description: form.description || null,
        game_title: form.game_title,
        platform: form.platform,
        condition: form.condition,
        price: form.ad_type === 'venda' ? Number(form.price) : 0,
        ad_type: form.ad_type,
        category: form.category,
        certificate_type: form.certificate_type,
        desired_item: form.ad_type === 'troca' ? form.desired_item : null,
      } as any);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['anuncios'] });
      toast.success('Anúncio criado!');
      navigate('/marketplace');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar anúncio');
    } finally { setLoading(false); }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-lg">
      <Link to="/marketplace" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="text-xl font-bold text-foreground mb-6">Criar Anúncio</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2">
          {(['venda', 'troca'] as const).map(t => (
            <button key={t} type="button" onClick={() => set('ad_type', t)}
              className={`py-3 rounded-lg text-sm font-semibold transition-all ${form.ad_type === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground border border-border'}`}>
              {t === 'venda' ? '💰 Venda' : '🔄 Troca'}
            </button>
          ))}
        </div>

        <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Título do anúncio *" required className={inputClass} />
        <input value={form.game_title} onChange={e => set('game_title', e.target.value)} placeholder="Nome do jogo/item *" required className={inputClass} />
        <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descrição detalhada" rows={3}
          className={`${inputClass} resize-none`} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className={selectClass}>
              <option value="jogo_fisico">Jogo Físico</option>
              <option value="jogo_digital">Jogo Digital</option>
              <option value="console">Console</option>
              <option value="acessorio">Acessório</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Plataforma</label>
            <select value={form.platform} onChange={e => set('platform', e.target.value)} className={selectClass}>
              {['PC', 'PS5', 'PS4', 'Xbox Series', 'Xbox One', 'Switch'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Conservação</label>
            <select value={form.condition} onChange={e => set('condition', e.target.value)} className={selectClass}>
              <option value="novo">Novo</option>
              <option value="seminovo">Seminovo</option>
              <option value="usado">Usado</option>
            </select>
          </div>
          {form.ad_type === 'venda' && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Preço (R$)</label>
              <input type="number" step="0.01" value={form.price} onChange={e => set('price', e.target.value)}
                placeholder="0,00" required className={inputClass} />
            </div>
          )}
        </div>

        {form.ad_type === 'troca' && (
          <input value={form.desired_item} onChange={e => set('desired_item', e.target.value)}
            placeholder="O que deseja em troca?" className={inputClass} />
        )}

        {/* Certificate */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground block">Tipo de certificado</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => set('certificate_type', 'com_certificado')}
              className={`p-3 rounded-lg border text-left transition-all ${form.certificate_type === 'com_certificado' ? 'border-success bg-success/10' : 'border-border bg-secondary'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="h-4 w-4 text-success" />
                <span className="text-xs font-semibold text-foreground">Com Certificado</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Protegido pela loja. Mediação em caso de problemas.</p>
            </button>
            <button type="button" onClick={() => set('certificate_type', 'sem_certificado')}
              className={`p-3 rounded-lg border text-left transition-all ${form.certificate_type === 'sem_certificado' ? 'border-warning bg-warning/10' : 'border-border bg-secondary'}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-xs font-semibold text-foreground">Sem Certificado</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Negociação direta, por conta e risco próprio.</p>
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 glow-primary">
          {loading ? 'Publicando...' : 'Publicar Anúncio'}
        </button>
      </form>
    </div>
  );
}
