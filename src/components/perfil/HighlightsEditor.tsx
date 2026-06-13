import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Trash2, Sparkles, Plus } from 'lucide-react';
import { toast } from 'sonner';

type HighlightType = 'game' | 'review' | 'review_completa' | 'screenshot' | 'opinion';

type Highlight = {
  id: string;
  type: HighlightType;
  ref_id: string;
  position: number;
  label?: string;
};

const TYPE_LABEL: Record<HighlightType, string> = {
  game: '🎮 Jogo',
  review: '⭐ Review',
  review_completa: '📝 Review Completa',
  screenshot: '📸 Screenshot',
  opinion: '💬 Opinião',
};

const MAX_HIGHLIGHTS = 6;

export default function HighlightsEditor() {
  const { user } = useAuth();
  const [items, setItems] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState<HighlightType>('game');
  const [newRefId, setNewRefId] = useState('');

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('profile_highlights')
      .select('id, type, ref_id, position')
      .eq('user_id', user.id)
      .order('position', { ascending: true });
    const rows = ((data as any[]) || []) as Highlight[];
    // enrich label for games
    const gameIds = rows.filter(r => r.type === 'game').map(r => r.ref_id);
    if (gameIds.length) {
      const { data: prods } = await supabase.from('produtos').select('id, title').in('id', gameIds);
      const map = new Map((prods || []).map((p: any) => [p.id, p.title]));
      rows.forEach(r => { if (r.type === 'game') r.label = map.get(r.ref_id) || r.ref_id; });
    }
    setItems(rows);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleAdd = async () => {
    if (!user || !newRefId.trim()) return;
    if (items.length >= MAX_HIGHLIGHTS) {
      toast.error(`Máximo de ${MAX_HIGHLIGHTS} destaques`);
      return;
    }
    setAdding(true);
    const { error } = await supabase.from('profile_highlights').insert({
      user_id: user.id,
      type: newType,
      ref_id: newRefId.trim(),
      position: items.length,
    });
    setAdding(false);
    if (error) { toast.error('Erro: ' + error.message); return; }
    toast.success('Destaque adicionado');
    setNewRefId('');
    load();
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from('profile_highlights').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover'); return; }
    setItems(prev => prev.filter(i => i.id !== id));
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Fixe até {MAX_HIGHLIGHTS} itens no topo do seu perfil público (jogos, reviews, opiniões, screenshots).
      </p>

      {items.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-border rounded-lg">
          <Sparkles className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum destaque ainda</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map(it => (
            <li key={it.id} className="flex items-center justify-between gap-2 bg-secondary border border-border rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{TYPE_LABEL[it.type]}</p>
                <p className="text-sm text-foreground truncate">{it.label || it.ref_id}</p>
              </div>
              <button onClick={() => handleRemove(it.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-md">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-border pt-4 space-y-2">
        <p className="text-xs font-semibold text-foreground">Adicionar destaque</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <select value={newType} onChange={e => setNewType(e.target.value as HighlightType)}
            className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground">
            {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input value={newRefId} onChange={e => setNewRefId(e.target.value)} placeholder="ID do item"
            className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground" />
          <button onClick={handleAdd} disabled={adding || !newRefId.trim()}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium flex items-center gap-1 disabled:opacity-50">
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Fixar
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Dica: copie o ID do jogo na URL (ex.: /jogo/&lt;id&gt;) ou da review/opinião.
        </p>
      </div>
    </div>
  );
}
