import { useState, useEffect } from 'react';
import { Tags, Plus, Edit, Trash2, Package, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Categoria | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImage, setFormImage] = useState('');
  const { toast } = useToast();

  const fetchCategorias = async () => {
    setLoading(true);
    const { data: cats } = await supabase.from('categorias').select('*').order('name');
    if (!cats) { setLoading(false); return; }

    // Count products per category
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

  const handleSave = async () => {
    if (!formName.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = { name: formName, description: formDesc || null, image_url: formImage || null };

    if (selected) {
      await supabase.from('categorias').update(payload).eq('id', selected.id);
      toast({ title: 'Categoria atualizada!' });
    } else {
      await supabase.from('categorias').insert(payload);
      toast({ title: 'Categoria criada!' });
    }
    setSaving(false); setDialogOpen(false); resetForm(); fetchCategorias();
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    await supabase.from('categorias').delete().eq('id', selected.id);
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
          <Card key={c.id} className="border-border/50 group hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-muted">
                {c.image_url ? <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Tags className="h-8 w-8" /></div>}
              </div>
              <h3 className="font-semibold text-sm">{c.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description || 'Sem descrição'}</p>
              <div className="flex items-center justify-between mt-3">
                <Badge variant="outline" className="gap-1 text-xs"><Package className="h-3 w-3" />{c.produtos_count} produtos</Badge>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setSelected(c); setDeleteOpen(true); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{selected ? 'Editar Categoria' : 'Cadastrar Categoria'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Nome</Label><Input placeholder="Nome da categoria" value={formName} onChange={e => setFormName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Descrição da categoria" rows={2} value={formDesc} onChange={e => setFormDesc(e.target.value)} /></div>
            <div className="space-y-2"><Label>URL da Imagem</Label><Input placeholder="https://..." value={formImage} onChange={e => setFormImage(e.target.value)} /></div>
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
            <AlertDialogDescription>Tem certeza que deseja excluir "{selected?.name}"?</AlertDialogDescription>
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
