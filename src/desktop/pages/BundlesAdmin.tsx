import { useEffect, useMemo, useState } from 'react';
import { Boxes, Loader2, Plus, Trash2, Edit, Search, Download, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminLog, exportCsv } from '../lib/adminLog';

export default function BundlesAdmin() {
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<any | null>(null);
  const [itemsOpen, setItemsOpen] = useState<any | null>(null);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ title: '', description: '', price: 0, image_url: '', is_active: true });
  const [pendingDelete, setPendingDelete] = useState<any | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('bundles').select('*').order('created_at', { ascending: false });
    setBundles(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => bundles.filter(b => !search || b.title.toLowerCase().includes(search.toLowerCase())), [bundles, search]);

  const openCreate = () => { setEditing({}); setForm({ title: '', description: '', price: 0, image_url: '', is_active: true }); };
  const openEdit = (b: any) => { setEditing(b); setForm({ title: b.title, description: b.description || '', price: b.price, image_url: b.image_url || '', is_active: b.is_active }); };

  const save = async () => {
    if (!form.title) return toast.error('Título obrigatório');
    if (editing?.id) {
      const { error } = await supabase.from('bundles').update(form as any).eq('id', editing.id);
      if (error) return toast.error(error.message);
      await adminLog({ action: 'bundle_update', entity: 'bundle', entity_id: editing.id, payload: form });
    } else {
      const { data, error } = await supabase.from('bundles').insert(form as any).select().single();
      if (error) return toast.error(error.message);
      await adminLog({ action: 'bundle_create', entity: 'bundle', entity_id: data?.id, payload: form });
    }
    toast.success('Salvo'); setEditing(null); load();
  };

  const confirmDelete = async () => {
    const b = pendingDelete;
    if (!b) return;
    if (deleteReason.trim().length < 4) { toast.error('Justificativa muito curta'); return; }
    const { error } = await supabase.from('bundles').delete().eq('id', b.id);
    if (error) return toast.error(error.message);
    await adminLog({ action: 'bundle_delete', entity: 'bundle', entity_id: b.id, reason: deleteReason, payload: b });
    toast.success('Excluído'); setPendingDelete(null); setDeleteReason(''); load();
  };

  const toggleActive = async (b: any) => {
    await supabase.from('bundles').update({ is_active: !b.is_active } as any).eq('id', b.id);
    await adminLog({ action: 'bundle_toggle', entity: 'bundle', entity_id: b.id, payload: { is_active: !b.is_active } });
    load();
  };

  const openItems = async (b: any) => {
    setItemsOpen(b);
    const [{ data: prods }, { data: items }] = await Promise.all([
      supabase.from('produtos').select('id,title,price').order('title'),
      supabase.from('bundle_items').select('product_id').eq('bundle_id', b.id),
    ]);
    setProdutos(prods || []);
    setSelectedItems(new Set((items || []).map((i: any) => i.product_id)));
  };

  const toggleItem = (pid: string) => {
    const s = new Set(selectedItems);
    s.has(pid) ? s.delete(pid) : s.add(pid);
    setSelectedItems(s);
  };

  const saveItems = async () => {
    if (!itemsOpen) return;
    await supabase.from('bundle_items').delete().eq('bundle_id', itemsOpen.id);
    if (selectedItems.size > 0) {
      const rows = Array.from(selectedItems).map(pid => ({ bundle_id: itemsOpen.id, product_id: pid }));
      const { error } = await supabase.from('bundle_items').insert(rows as any);
      if (error) return toast.error(error.message);
    }
    await adminLog({ action: 'bundle_items_update', entity: 'bundle', entity_id: itemsOpen.id, payload: { product_ids: Array.from(selectedItems) } });
    toast.success('Itens atualizados'); setItemsOpen(null);
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Boxes} title="Bundles" subtitle="Pacotes promocionais com múltiplos jogos"
        actions={<>
          <Button variant="outline" size="sm" onClick={() => exportCsv('bundles.csv', filtered)}><Download className="h-4 w-4 mr-1" />Exportar</Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Novo bundle</Button>
        </>} />

      <Card className="border-border/50"><CardContent className="p-4">
        <div className="relative max-w-md"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar bundle..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </CardContent></Card>

      <Card className="border-border/50"><CardContent className="p-0">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Preço</TableHead><TableHead>Ativo</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum bundle</TableCell></TableRow> :
                filtered.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.title}</TableCell>
                    <TableCell>R$ {Number(b.price).toFixed(2)}</TableCell>
                    <TableCell><Switch checked={b.is_active} onCheckedChange={() => toggleActive(b)} /></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="outline" onClick={() => openItems(b)}><Package className="h-3.5 w-3.5 mr-1" />Itens</Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(b)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(b)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? 'Editar bundle' : 'Novo bundle'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Título</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Preço</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div><Label>Imagem (URL)</Label><Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /> <Label>Ativo</Label></div>
            <Button onClick={save} className="w-full">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemsOpen} onOpenChange={o => !o && setItemsOpen(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Itens do bundle — {itemsOpen?.title}</DialogTitle></DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {produtos.map(p => (
              <label key={p.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer">
                <Checkbox checked={selectedItems.has(p.id)} onCheckedChange={() => toggleItem(p.id)} />
                <span className="flex-1">{p.title}</span>
                <span className="text-sm text-muted-foreground">R$ {Number(p.price).toFixed(2)}</span>
              </label>
            ))}
          </div>
          <Button onClick={saveItems}>Salvar ({selectedItems.size} selecionados)</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
