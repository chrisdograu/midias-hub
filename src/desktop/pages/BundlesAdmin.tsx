import { useEffect, useState } from 'react';
import { Boxes, Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminPageHeader } from '../components/AdminPageHeader';

export default function BundlesAdmin() {
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', price: 0, image_url: '', is_active: true });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('bundles').select('*').order('created_at', { ascending: false });
    setBundles(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title) return toast.error('Título obrigatório');
    const { error } = await supabase.from('bundles').insert(form);
    if (error) return toast.error(error.message);
    toast.success('Bundle criado'); setOpen(false); load();
    setForm({ title: '', description: '', price: 0, image_url: '', is_active: true });
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este bundle?')) return;
    const { error } = await supabase.from('bundles').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Bundle excluído'); load();
  };

  const toggleActive = async (b: any) => {
    await supabase.from('bundles').update({ is_active: !b.is_active }).eq('id', b.id);
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Boxes} title="Bundles" subtitle="Pacotes promocionais com múltiplos jogos"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Novo bundle</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo bundle</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Título</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <div><Label>Preço</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
                <div><Label>Imagem (URL)</Label><Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} /></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /> <Label>Ativo</Label></div>
                <Button onClick={create} className="w-full">Criar</Button>
              </div>
            </DialogContent>
          </Dialog>
        } />
      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
            <Table>
              <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Preço</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {bundles.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum bundle</TableCell></TableRow> :
                  bundles.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.title}</TableCell>
                      <TableCell>R$ {Number(b.price).toFixed(2)}</TableCell>
                      <TableCell><Switch checked={b.is_active} onCheckedChange={() => toggleActive(b)} /></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
