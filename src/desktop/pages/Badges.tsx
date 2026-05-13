import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Loader2, Trash2, Award } from 'lucide-react';
import { toast } from 'sonner';

interface Badge {
  id: string; name: string; description: string; icon: string; category: string; created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  store: 'Loja & Compras',
  community: 'Comunidade',
  level: 'Nível & XP',
  tournament: 'Torneios',
  special: 'Especiais',
  general: 'Gerais',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  store: 'Concedidos automaticamente ao atingir marcos de compras na loja.',
  community: 'Concedidos por participação no fórum, reviews e interações.',
  level: 'Concedidos ao atingir certos níveis de XP.',
  tournament: 'Concedidos por vitórias e participações em torneios oficiais.',
  special: 'Concedidos manualmente pela equipe em eventos especiais.',
  general: 'Outros badges sem categoria definida.',
};

export default function BadgesAdmin() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', description: '', icon: '🏆', category: 'special' });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('badge_catalog' as any).select('*').order('category').order('id');
    setBadges((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.id || !form.name) return toast.error('ID e Nome obrigatórios');
    const { error } = await supabase.from('badge_catalog' as any).insert(form);
    if (error) return toast.error(error.message);
    toast.success('Badge criado!');
    setOpen(false);
    setForm({ id: '', name: '', description: '', icon: '🏆', category: 'special' });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Remover este badge? Usuários que já o ganharam podem perder a referência.')) return;
    const { error } = await supabase.from('badge_catalog' as any).delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Removido');
    load();
  };

  const grouped = badges.reduce<Record<string, Badge[]>>((acc, b) => {
    (acc[b.category] ||= []).push(b); return acc;
  }, {});
  const cats = Object.keys(grouped).length ? Object.keys(grouped) : ['special'];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Award className="h-6 w-6 text-primary" /> Badges</h1>
          <p className="text-sm text-muted-foreground">Catálogo de conquistas visíveis aos usuários.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Novo Badge</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar badge</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>ID (slug, único)</Label><Input value={form.id} onChange={e => setForm({ ...form, id: e.target.value.replace(/\s+/g, '_').toLowerCase() })} placeholder="ex: tournament_champion" /></div>
              <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Ícone (emoji)</Label><Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} maxLength={4} /></div>
              <div><Label>Categoria</Label>
                <select className="w-full bg-background border border-border rounded-md p-2 text-sm" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><Label>Descrição (como ganhar)</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={create}>Criar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
        <Tabs defaultValue={cats[0]}>
          <TabsList className="flex-wrap h-auto">
            {cats.map(c => <TabsTrigger key={c} value={c}>{CATEGORY_LABELS[c] || c} ({grouped[c]?.length || 0})</TabsTrigger>)}
          </TabsList>
          {cats.map(c => (
            <TabsContent key={c} value={c} className="space-y-4">
              <p className="text-sm text-muted-foreground">{CATEGORY_DESCRIPTIONS[c] || ''}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(grouped[c] || []).map(b => (
                  <div key={b.id} className="bg-card border border-border rounded-lg p-4 flex gap-3 items-start">
                    <div className="text-3xl">{b.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{b.name}</h3>
                      <p className="text-xs text-muted-foreground mb-1">{b.id}</p>
                      <p className="text-sm text-muted-foreground">{b.description}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => remove(b.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
