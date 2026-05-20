import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Loader2, Trash2, Zap, Package, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Produto { id: string; title: string; price: number; image_url: string | null; }
interface Promo { id: string; product_id: string; discount_percent: number; starts_at: string; ends_at: string; is_active: boolean; }
interface Bundle { id: string; title: string; description: string | null; price: number; image_url: string | null; is_active: boolean; }
interface BundleItem { bundle_id: string; product_id: string; }
interface DailyPick { pick_date: string; product_id: string; reason?: string | null; }

export default function Promocoes() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [bundleItems, setBundleItems] = useState<BundleItem[]>([]);
  const [picks, setPicks] = useState<DailyPick[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs state
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoForm, setPromoForm] = useState({ product_id: '', discount_percent: 20, hours: 24 });
  const [bundleOpen, setBundleOpen] = useState(false);
  const [bundleForm, setBundleForm] = useState({ title: '', description: '', price: 0, image_url: '', items: [] as string[] });
  const [pickOpen, setPickOpen] = useState(false);
  const [pickForm, setPickForm] = useState({ pick_date: new Date().toISOString().slice(0, 10), product_id: '', reason: '' });
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'promo' | 'bundle'; id: string; label: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const [p, fp, bd, bi, dp] = await Promise.all([
      supabase.from('produtos').select('id, title, price, image_url').eq('is_active', true).order('title'),
      supabase.from('flash_promotions' as any).select('*').order('ends_at', { ascending: false }),
      supabase.from('bundles' as any).select('*').order('created_at', { ascending: false }),
      supabase.from('bundle_items' as any).select('*'),
      supabase.from('daily_pick_overrides' as any).select('*').order('pick_date', { ascending: false }).limit(30),
    ]);
    setProdutos((p.data as any) || []);
    setPromos((fp.data as any) || []);
    setBundles((bd.data as any) || []);
    setBundleItems((bi.data as any) || []);
    setPicks((dp.data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // ---- Flash promos ----
  const createPromo = async () => {
    if (!promoForm.product_id) return toast.error('Escolha um jogo');
    const ends_at = new Date(Date.now() + promoForm.hours * 3600000).toISOString();
    const { error } = await supabase.from('flash_promotions' as any).insert({
      product_id: promoForm.product_id,
      discount_percent: promoForm.discount_percent,
      ends_at, is_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success('Promoção criada');
    setPromoOpen(false);
    load();
  };
  const togglePromo = async (id: string, is_active: boolean) => {
    await supabase.from('flash_promotions' as any).update({ is_active: !is_active }).eq('id', id);
    load();
  };
  const removePromo = async (id: string) => {
    const { error } = await supabase.from('flash_promotions' as any).delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Promoção removida');
    load();
  };

  // ---- Bundles ----
  const createBundle = async () => {
    if (!bundleForm.title || bundleForm.items.length < 2) return toast.error('Título e ao menos 2 jogos');
    const { data: bd, error } = await supabase.from('bundles' as any).insert({
      title: bundleForm.title, description: bundleForm.description || null,
      price: bundleForm.price, image_url: bundleForm.image_url || null,
    }).select().single();
    if (error || !bd) return toast.error(error?.message || 'Erro');
    const items = bundleForm.items.map(pid => ({ bundle_id: (bd as any).id, product_id: pid }));
    await supabase.from('bundle_items' as any).insert(items);
    toast.success('Bundle criado');
    setBundleOpen(false);
    setBundleForm({ title: '', description: '', price: 0, image_url: '', items: [] });
    load();
  };
  const toggleBundle = async (id: string, is_active: boolean) => {
    await supabase.from('bundles' as any).update({ is_active: !is_active }).eq('id', id);
    load();
  };
  const removeBundle = async (id: string) => {
    await supabase.from('bundle_items' as any).delete().eq('bundle_id', id);
    const { error } = await supabase.from('bundles' as any).delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Bundle removido');
    load();
  };

  // ---- Daily pick ----
  const setPick = async () => {
    if (!pickForm.product_id) return toast.error('Escolha um jogo');
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('daily_pick_overrides' as any).upsert({
      pick_date: pickForm.pick_date, product_id: pickForm.product_id, set_by: user?.id, reason: pickForm.reason || null,
    }, { onConflict: 'pick_date' });
    if (error) return toast.error(error.message);
    toast.success('Pick do dia definido');
    setPickOpen(false);
    load();
  };
  const removePick = async (date: string) => {
    await supabase.from('daily_pick_overrides' as any).delete().eq('pick_date', date);
    load();
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const productMap = new Map(produtos.map(p => [p.id, p]));

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Promoções, Bundles e Daily Pick</h1>

      <Tabs defaultValue="flash">
        <TabsList>
          <TabsTrigger value="flash"><Zap className="h-4 w-4 mr-1" /> Promoções Relâmpago</TabsTrigger>
          <TabsTrigger value="bundles"><Package className="h-4 w-4 mr-1" /> Bundles</TabsTrigger>
          <TabsTrigger value="daily"><Calendar className="h-4 w-4 mr-1" /> Pick do Dia</TabsTrigger>
        </TabsList>

        {/* Flash Promotions */}
        <TabsContent value="flash" className="space-y-4">
          <Dialog open={promoOpen} onOpenChange={setPromoOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Nova Promoção</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova promoção relâmpago</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Jogo</Label>
                  <select className="w-full bg-background border border-border rounded p-2 text-sm" value={promoForm.product_id} onChange={e => setPromoForm({ ...promoForm, product_id: e.target.value })}>
                    <option value="">Selecione...</option>
                    {produtos.map(p => <option key={p.id} value={p.id}>{p.title} (R$ {Number(p.price).toFixed(2)})</option>)}
                  </select>
                </div>
                <div><Label>Desconto (%)</Label><Input type="number" value={promoForm.discount_percent} onChange={e => setPromoForm({ ...promoForm, discount_percent: parseInt(e.target.value) || 0 })} /></div>
                <div><Label>Duração (horas)</Label><Input type="number" value={promoForm.hours} onChange={e => setPromoForm({ ...promoForm, hours: parseInt(e.target.value) || 1 })} /></div>
              </div>
              <DialogFooter><Button onClick={createPromo}>Criar</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {promos.map(promo => {
              const prod = productMap.get(promo.product_id);
              const expired = new Date(promo.ends_at) < new Date();
              return (
                <div key={promo.id} className="bg-card border border-border rounded-lg p-4 flex gap-3">
                  {prod?.image_url && <img src={prod.image_url} className="w-16 h-20 object-cover rounded" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{prod?.title || 'Jogo removido'}</p>
                    <p className="text-sm text-price font-bold">-{promo.discount_percent}%</p>
                    <p className="text-xs text-muted-foreground">Termina: {new Date(promo.ends_at).toLocaleString('pt-BR')}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${expired ? 'bg-muted' : promo.is_active ? 'bg-success/20 text-success' : 'bg-muted'}`}>
                        {expired ? 'Expirada' : promo.is_active ? 'Ativa' : 'Pausada'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {!expired && <Button size="sm" variant="outline" onClick={() => togglePromo(promo.id, promo.is_active)}>{promo.is_active ? 'Pausar' : 'Ativar'}</Button>}
                    <Button size="sm" variant="ghost" onClick={() => removePromo(promo.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              );
            })}
            {promos.length === 0 && <p className="text-muted-foreground text-sm col-span-2 text-center py-8">Nenhuma promoção criada.</p>}
          </div>
        </TabsContent>

        {/* Bundles */}
        <TabsContent value="bundles" className="space-y-4">
          <Dialog open={bundleOpen} onOpenChange={setBundleOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Novo Bundle</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Criar bundle</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título</Label><Input value={bundleForm.title} onChange={e => setBundleForm({ ...bundleForm, title: e.target.value })} placeholder="ex: Pacote RPG Lendário" /></div>
                <div><Label>Descrição</Label><Textarea value={bundleForm.description} onChange={e => setBundleForm({ ...bundleForm, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Preço total (R$)</Label><Input type="number" step="0.01" value={bundleForm.price} onChange={e => setBundleForm({ ...bundleForm, price: parseFloat(e.target.value) || 0 })} /></div>
                  <div><Label>Imagem (URL)</Label><Input value={bundleForm.image_url} onChange={e => setBundleForm({ ...bundleForm, image_url: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Jogos incluídos ({bundleForm.items.length})</Label>
                  <div className="border border-border rounded max-h-60 overflow-y-auto p-2 space-y-1">
                    {produtos.map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-sm hover:bg-secondary/50 p-1 rounded cursor-pointer">
                        <input type="checkbox" checked={bundleForm.items.includes(p.id)} onChange={e => {
                          setBundleForm({
                            ...bundleForm,
                            items: e.target.checked ? [...bundleForm.items, p.id] : bundleForm.items.filter(i => i !== p.id),
                          });
                        }} />
                        {p.title} <span className="text-muted-foreground ml-auto">R$ {Number(p.price).toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                  {bundleForm.items.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Soma individual: R$ {bundleForm.items.reduce((s, id) => s + (productMap.get(id)?.price || 0), 0).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter><Button onClick={createBundle}>Criar</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bundles.map(b => {
              const items = bundleItems.filter(bi => bi.bundle_id === b.id);
              return (
                <div key={b.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{b.title}</h3>
                      <p className="text-price font-bold">R$ {Number(b.price).toFixed(2)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => toggleBundle(b.id, b.is_active)}>{b.is_active ? 'Pausar' : 'Ativar'}</Button>
                      <Button size="sm" variant="ghost" onClick={() => removeBundle(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                  {b.description && <p className="text-sm text-muted-foreground mb-2">{b.description}</p>}
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {items.map(it => <div key={it.product_id}>• {productMap.get(it.product_id)?.title || it.product_id}</div>)}
                  </div>
                </div>
              );
            })}
            {bundles.length === 0 && <p className="text-muted-foreground text-sm col-span-2 text-center py-8">Nenhum bundle criado.</p>}
          </div>
        </TabsContent>

        {/* Daily Pick */}
        <TabsContent value="daily" className="space-y-4">
          <p className="text-sm text-muted-foreground">Por padrão, o "Pick do Dia" é escolhido automaticamente. Aqui você pode forçar manualmente para uma data específica.</p>
          <Dialog open={pickOpen} onOpenChange={setPickOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Definir Pick</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Definir Pick do Dia</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Data</Label><Input type="date" value={pickForm.pick_date} onChange={e => setPickForm({ ...pickForm, pick_date: e.target.value })} /></div>
                <div><Label>Jogo</Label>
                  <select className="w-full bg-background border border-border rounded p-2 text-sm" value={pickForm.product_id} onChange={e => setPickForm({ ...pickForm, product_id: e.target.value })}>
                    <option value="">Selecione...</option>
                    {produtos.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div><Label>Motivo da escolha (opcional)</Label><Textarea rows={2} placeholder="Ex: Lançamento da semana, jogo brasileiro, classico imperdível..." value={pickForm.reason} onChange={e => setPickForm({ ...pickForm, reason: e.target.value })} /></div>
              </div>
              <DialogFooter><Button onClick={setPick}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="space-y-2">
            {picks.map(p => (
              <div key={p.pick_date} className="bg-card border border-border rounded p-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{new Date(p.pick_date).toLocaleDateString('pt-BR')}</p>
                  <p className="text-sm text-muted-foreground">{productMap.get(p.product_id)?.title || p.product_id}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => removePick(p.pick_date)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
            {picks.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Nenhum pick manual definido.</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
