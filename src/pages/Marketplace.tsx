import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnuncios } from '@/hooks/useAnuncios';
import { useAuth } from '@/hooks/useAuth';
import { Search, Plus, Loader2, ShoppingBag, Gamepad2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Marketplace() {
  const { anuncios, meusAnuncios, criarAnuncio, deletarAnuncio, isLoading } = useAnuncios();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showMeus, setShowMeus] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', game_title: '', platform: 'PC', condition: 'novo', price: '' });

  const filtered = anuncios.filter(a =>
    a.title.toLowerCase().includes(query.toLowerCase()) ||
    a.game_title.toLowerCase().includes(query.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.game_title || !form.price) { toast.error('Preencha todos os campos obrigatórios'); return; }
    try {
      await criarAnuncio.mutateAsync({ ...form, price: Number(form.price) });
      toast.success('Anúncio criado!');
      setShowCreate(false);
      setForm({ title: '', description: '', game_title: '', platform: 'PC', condition: 'novo', price: '' });
    } catch { toast.error('Erro ao criar anúncio'); }
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
        </div>
        <div className="flex gap-2">
          {user && (
            <>
              <button onClick={() => setShowMeus(!showMeus)} className="px-4 py-2 text-sm bg-secondary border border-border rounded-lg hover:bg-secondary/80 transition-colors text-foreground">
                Meus Anúncios
              </button>
              <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-1">
                <Plus className="h-4 w-4" /> Anunciar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar anúncios..."
          className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-foreground mb-4">Criar Anúncio</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Título do anúncio *" required
                className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <input value={form.game_title} onChange={e => setForm({ ...form, game_title: e.target.value })} placeholder="Nome do jogo *" required
                className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descrição" rows={3}
                className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}
                  className="px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {['PC', 'PS5', 'PS4', 'Xbox', 'Switch'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}
                  className="px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="novo">Novo</option>
                  <option value="usado">Usado</option>
                  <option value="digital">Digital</option>
                </select>
              </div>
              <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="Preço (R$) *" required
                className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 bg-secondary border border-border rounded-lg text-sm font-medium text-foreground hover:bg-secondary/80">Cancelar</button>
                <button type="submit" disabled={criarAnuncio.isPending} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50">Publicar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* My ads */}
      {showMeus && user && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Meus Anúncios</h2>
          {meusAnuncios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Você ainda não criou nenhum anúncio.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {meusAnuncios.map(a => (
                <div key={a.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-foreground">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.game_title} • {a.platform} • {a.condition}</p>
                    <p className="text-price font-bold mt-1">R$ {Number(a.price).toFixed(2)}</p>
                  </div>
                  <button onClick={() => { deletarAnuncio.mutate(a.id); toast.success('Anúncio removido'); }}
                    className="text-xs text-destructive hover:underline">Excluir</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All ads */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Gamepad2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Nenhum anúncio encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(a => (
            <Link key={a.id} to={`/marketplace/${a.id}`} className="bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-all block">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-foreground">{a.title}</h3>
                  <p className="text-xs text-muted-foreground">{a.game_title}</p>
                </div>
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">{a.condition}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{a.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{a.platform}</span>
                <span className="text-lg font-bold text-price">R$ {Number(a.price).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary">{((a.profiles as any)?.display_name || 'U')[0].toUpperCase()}</span>
                </div>
                {(a.profiles as any)?.display_name || 'Vendedor'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
