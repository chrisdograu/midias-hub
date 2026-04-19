import { useState, useEffect, useRef } from 'react';
import { Tags, Plus, Edit, Trash2, Package, Loader2, Eye, Upload, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Categoria {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  produtos_count: number;
}

interface ProdutoSimple {
  id: string;
  title: string;
  price: number;
  stock: number;
  image_url: string | null;
  is_active: boolean;
}

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Categoria | null>(null);
  const [categoriaProdutos, setCategoriaProdutos] = useState<ProdutoSimple[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast({ title: 'Imagem máxima de 2MB', variant: 'destructive' }); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `categorias/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await supabase.storage.from('product-images').upload(path, file, { cacheControl: '3600' });
    if (upErr) { toast({ title: 'Erro no upload', description: upErr.message, variant: 'destructive' }); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
    setFormImage(publicUrl);
    setUploading(false);
    toast({ title: 'Imagem enviada!' });
  };

  const fetchCategorias = async () => {
    setLoading(true);
    const { data: cats } = await supabase.from('categorias').select('*').order('name');
    if (!cats) { setLoading(false); return; }

    const { data: produtos } = await supabase.from('produtos').select('category_id');
    const countMap = new Map<string, number>();
    produtos?.forEach(p => {
      if (p.category_id) countMap.set(p.category_id, (countMap.get(p.category_id) || 0) + 1);
    });

    setCategorias(cats.map(c => ({ ...c, produtos_count: countMap.get(c.id) || 0 })));
    setLoading(false);
  };

  useEffect(() => { fetchCategorias(); }, []);

  const resetForm = () => { setFormName(''); setFormDesc(''); setFormImage(''); setSelected(null); };

  const openCreate = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (c: Categoria) => {
    setSelected(c); setFormName(c.name); setFormDesc(c.description || ''); setFormImage(c.image_url || '');
    setDialogOpen(true);
  };

  const openView = async (c: Categoria) => {
    setSelected(c);
    setViewOpen(true);
    setLoadingProdutos(true);
    const { data } = await supabase
      .from('produtos')
      .select('id, title, price, stock, image_url, is_active')
      .eq('category_id', c.id)
      .order('title');
    setCategoriaProdutos(data || []);
    setLoadingProdutos(false);
  };

  const handleSave = async () => {
    if (!formName.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = { name: formName, description: formDesc || null, image_url: formImage || null };

    if (selected) {
      const { error } = await supabase.from('categorias').update(payload).eq('id', selected.id);
      if (error) { toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' }); setSaving(false); return; }
      toast({ title: 'Categoria atualizada!' });
    } else {
      const { error } = await supabase.from('categorias').insert(payload);
      if (error) { toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' }); setSaving(false); return; }
      toast({ title: 'Categoria criada!' });
    }
    setSaving(false); setDialogOpen(false); resetForm(); fetchCategorias();
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from('categorias').delete().eq('id', selected.id);
    if (error) { toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' }); setSaving(false); return; }
    toast({ title: 'Categoria excluída' });
    setSaving(false); setDeleteOpen(false); setSelected(null); fetchCategorias();
  };

  if (loading) return <div className="p-6 flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Tags className="h-6 w-6 text-primary" /> Categorias</h1>
          <p className="text-muted-foreground text-sm">{categorias.length} categorias</p>
        </div>
        <Button className="bg-primary text-primary-foreground" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Nova Categoria</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categorias.map((c) => (
          <Card key={c.id} className="border-border/50 hover:border-primary/40 transition-colors flex flex-col">
            <CardContent className="p-4 flex flex-col flex-1">
              <button
                onClick={() => openView(c)}
                className="aspect-video rounded-lg overflow-hidden mb-3 bg-muted hover:opacity-80 transition-opacity cursor-pointer w-full"
                title="Ver produtos desta categoria"
              >
                {c.image_url ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Tags className="h-8 w-8" /></div>}
              </button>
              <button onClick={() => openView(c)} className="text-left">
                <h3 className="font-semibold text-sm hover:text-primary transition-colors">{c.name}</h3>
              </button>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description || 'Sem descrição'}</p>
              <div className="flex items-center justify-between mt-3">
                <Badge variant="outline" className="gap-1 text-xs"><Package className="h-3 w-3" />{c.produtos_count} produtos</Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Visualizar produtos" onClick={() => openView(c)}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Excluir" onClick={() => { setSelected(c); setDeleteOpen(true); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Products Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-primary" /> {selected?.name}
            </DialogTitle>
            {selected?.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {loadingProdutos ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : categoriaProdutos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Nenhum produto cadastrado nesta categoria</p>
              </div>
            ) : (
              <ScrollArea className="h-[420px] pr-3">
                <div className="space-y-2">
                  {categoriaProdutos.map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{p.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">Estoque: {p.stock}</span>
                          {!p.is_active && <Badge variant="outline" className="text-[10px] py-0 h-4">Inativo</Badge>}
                        </div>
                      </div>
                      <p className="font-semibold text-sm text-primary shrink-0">R$ {Number(p.price).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          <div className="text-xs text-muted-foreground border-t border-border pt-3">
            Total: {categoriaProdutos.length} {categoriaProdutos.length === 1 ? 'produto' : 'produtos'}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selected ? 'Editar Categoria' : 'Cadastrar Categoria'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Nome</Label><Input placeholder="Nome da categoria" value={formName} onChange={e => setFormName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Descrição da categoria" rows={2} value={formDesc} onChange={e => setFormDesc(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Imagem da Categoria</Label>
              {formImage ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted border border-border">
                  <img src={formImage} alt="preview" className="w-full h-full object-cover" />
                  <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setFormImage('')}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                >
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                  <span className="text-xs">{uploading ? 'Enviando...' : 'Clique para enviar imagem (max 2MB)'}</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              <Input placeholder="Ou cole uma URL: https://..." value={formImage} onChange={e => setFormImage(e.target.value)} className="text-xs" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
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
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{selected?.name}"?
              {(selected?.produtos_count ?? 0) > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Atenção: esta categoria possui {selected?.produtos_count} produto(s) vinculado(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
