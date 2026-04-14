import { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, Edit, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Produto = Tables<'produtos'>;

export default function Produtos() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<{ id: string; name: string }[]>([]);
  const [fornecedores, setFornecedores] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Produto | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fCost, setFCost] = useState('');
  const [fPrice, setFPrice] = useState('');
  const [fType, setFType] = useState<'digital' | 'physical' | 'subscription'>('digital');
  const [fPlatform, setFPlatform] = useState('');
  const [fStock, setFStock] = useState('');
  const [fAlert, setFAlert] = useState('5');
  const [fCatId, setFCatId] = useState('');
  const [fSuppId, setFSuppId] = useState('');
  const [fImage, setFImage] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: prods }, { data: cats }, { data: forns }] = await Promise.all([
      supabase.from('produtos').select('*').order('title'),
      supabase.from('categorias').select('id, name').order('name'),
      supabase.from('fornecedores').select('id, name').order('name'),
    ]);
    setProdutos(prods || []);
    setCategorias(cats || []);
    setFornecedores(forns || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setFTitle(''); setFDesc(''); setFCost(''); setFPrice(''); setFType('digital');
    setFPlatform(''); setFStock(''); setFAlert('5'); setFCatId(''); setFSuppId(''); setFImage('');
    setSelected(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (p: Produto) => {
    setSelected(p); setFTitle(p.title); setFDesc(p.description || ''); setFCost(String(p.cost_price || 0));
    setFPrice(String(p.price)); setFType(p.product_type); setFPlatform((p.platform || []).join(', '));
    setFStock(String(p.stock)); setFAlert(String(p.stock_alert_threshold)); setFCatId(p.category_id || '');
    setFSuppId(p.supplier_id || ''); setFImage(p.image_url || ''); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!fTitle.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return; }
    setSaving(true);
    const catName = categorias.find(c => c.id === fCatId)?.name || null;
    const payload = {
      title: fTitle, description: fDesc || null, cost_price: Number(fCost) || 0,
      price: Number(fPrice) || 0, original_price: Number(fPrice) || 0, product_type: fType as any,
      platform: fPlatform.split(',').map(s => s.trim()).filter(Boolean),
      stock: Number(fStock) || 0, stock_alert_threshold: Number(fAlert) || 5,
      category_id: fCatId || null, category: catName, supplier_id: fSuppId || null,
      image_url: fImage || null,
    };
    if (selected) {
      await supabase.from('produtos').update(payload).eq('id', selected.id);
      toast({ title: 'Produto atualizado!' });
    } else {
      await supabase.from('produtos').insert(payload);
      toast({ title: 'Produto criado!' });
    }
    setSaving(false); setDialogOpen(false); resetForm(); fetchAll();
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    await supabase.from('produtos').delete().eq('id', selected.id);
    toast({ title: 'Produto excluído' });
    setSaving(false); setDeleteOpen(false); setSelected(null); fetchAll();
  };

  const handleToggle = async (p: Produto) => {
    await supabase.from('produtos').update({ is_active: !p.is_active }).eq('id', p.id);
    toast({ title: p.is_active ? 'Produto desativado' : 'Produto ativado' }); fetchAll();
  };

  const uniqueCats = [...new Set(produtos.map(p => p.category).filter(Boolean))] as string[];
  const filtered = produtos.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6 text-primary" /> Produtos</h1>
          <p className="text-muted-foreground text-sm">{produtos.length} produtos cadastrados</p>
        </div>
        <Button className="bg-primary text-primary-foreground" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Produto</Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="py-3 px-4 flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar produto..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48"><Filter className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Categorias</SelectItem>
              {uniqueCats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-12"></TableHead><TableHead>Produto</TableHead><TableHead>Categoria</TableHead>
                  <TableHead>Plataforma</TableHead><TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Venda</TableHead><TableHead className="text-center">Estoque</TableHead>
                  <TableHead className="text-center">Status</TableHead><TableHead className="text-center w-16">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</TableCell></TableRow>
                ) : filtered.map(p => (
                  <TableRow key={p.id} className="border-border hover:bg-muted/30">
                    <TableCell>{p.image_url ? <img src={p.image_url} alt="" className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-muted" />}</TableCell>
                    <TableCell><p className="font-medium text-sm">{p.title}</p></TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{p.category || '—'}</Badge></TableCell>
                    <TableCell className="text-sm">{(p.platform || []).join(', ') || '—'}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">R$ {(p.cost_price || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">R$ {p.price.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={p.stock === 0 ? 'bg-red-500/20 text-red-400' : p.stock <= p.stock_alert_threshold ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}>{p.stock}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={p.is_active ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}>{p.is_active ? 'Ativo' : 'Inativo'}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(p)}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggle(p)}>{p.is_active ? 'Desativar' : 'Ativar'}</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => { setSelected(p); setDeleteOpen(true); }}><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selected ? 'Editar Produto' : 'Cadastrar Produto'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2"><Label>Nome</Label><Input placeholder="Nome do produto" value={fTitle} onChange={e => setFTitle(e.target.value)} /></div>
            <div className="col-span-2 space-y-2"><Label>Descrição</Label><Textarea placeholder="Descrição" rows={3} value={fDesc} onChange={e => setFDesc(e.target.value)} /></div>
            <div className="space-y-2"><Label>Preço de Custo</Label><Input type="number" placeholder="0.00" value={fCost} onChange={e => setFCost(e.target.value)} /></div>
            <div className="space-y-2"><Label>Preço de Venda</Label><Input type="number" placeholder="0.00" value={fPrice} onChange={e => setFPrice(e.target.value)} /></div>
            <div className="space-y-2"><Label>Tipo</Label>
              <Select value={fType} onValueChange={v => setFType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Jogo Digital</SelectItem>
                  <SelectItem value="physical">Jogo Físico</SelectItem>
                  <SelectItem value="subscription">Assinatura</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Plataforma</Label><Input placeholder="PS5, Xbox, PC..." value={fPlatform} onChange={e => setFPlatform(e.target.value)} /></div>
            <div className="space-y-2"><Label>Estoque</Label><Input type="number" placeholder="0" value={fStock} onChange={e => setFStock(e.target.value)} /></div>
            <div className="space-y-2"><Label>Alerta Mín.</Label><Input type="number" placeholder="5" value={fAlert} onChange={e => setFAlert(e.target.value)} /></div>
            <div className="space-y-2"><Label>Categoria</Label>
              <Select value={fCatId} onValueChange={setFCatId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Fornecedor</Label>
              <Select value={fSuppId} onValueChange={setFSuppId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{fornecedores.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2"><Label>URL da Imagem</Label><Input placeholder="https://..." value={fImage} onChange={e => setFImage(e.target.value)} /></div>
            <div className="col-span-2 flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancelar</Button>
              <Button className="bg-primary text-primary-foreground" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir "{selected?.title}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground" disabled={saving}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
