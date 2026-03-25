import { useState } from 'react';
import { useBiblioteca } from '@/hooks/useBiblioteca';
import { Library, Gamepad2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

type StatusFilter = 'todos' | 'ja_joguei' | 'quero_jogar';

export default function Biblioteca() {
  const { biblioteca, updateStatus, isLoading } = useBiblioteca();
  const [filter, setFilter] = useState<StatusFilter>('todos');

  const filtered = filter === 'todos' ? biblioteca : biblioteca.filter(b => b.status === filter);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      toast.success('Status atualizado!');
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Library className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Minha Biblioteca</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {([
          { key: 'todos' as const, label: 'Todos' },
          { key: 'quero_jogar' as const, label: 'Quero Jogar' },
          { key: 'ja_joguei' as const, label: 'Já Joguei' },
        ]).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Gamepad2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">
            {filter === 'todos' ? 'Sua biblioteca está vazia. Compre jogos para adicioná-los aqui!' : 'Nenhum jogo nesta categoria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="aspect-[3/4] overflow-hidden">
                <img src={item.produto?.image_url || '/placeholder.svg'} alt={item.produto?.title || ''} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-3 space-y-2">
                <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{item.produto?.title}</h3>
                <div className="flex flex-wrap gap-1">
                  {(item.produto?.platform || []).map(p => (
                    <span key={p} className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">{p}</span>
                  ))}
                </div>
                <select value={item.status} onChange={e => handleStatusChange(item.id, e.target.value)}
                  className="w-full px-2 py-1.5 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                  <option value="quero_jogar">Quero Jogar</option>
                  <option value="ja_joguei">Já Joguei</option>
                </select>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
