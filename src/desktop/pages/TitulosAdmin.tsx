import { useEffect, useState } from 'react';
import { Award, Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminPageHeader } from '../components/AdminPageHeader';

/**
 * Outorga e remoção de títulos para usuários.
 */
export default function TitulosAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ user_id: '', name: '' });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('user_titles').select('*').order('awarded_at', { ascending: false }).limit(200);
    setRows(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const award = async () => {
    if (!form.user_id || !form.name) return toast.error('Preencha tudo');
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('user_titles').insert({ ...form, source: 'admin', awarded_by: user?.id } as any);
    if (error) return toast.error(error.message);
    toast.success('Título concedido'); setOpen(false); setForm({ user_id: '', name: '' }); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Remover título?')) return;
    const { error } = await supabase.from('user_titles').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Removido'); load();
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Award} title="Títulos" subtitle="Outorga manual de títulos especiais"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Conceder</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Conceder título</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>User ID</Label><Input value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} placeholder="UUID do usuário" /></div>
                <div><Label>Nome do título</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <Button onClick={award} className="w-full">Conceder</Button>
              </div>
            </DialogContent>
          </Dialog>
        } />
      <Card className="border-border/50"><CardContent className="p-0">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Título</TableHead><TableHead>Origem</TableHead><TableHead>Quando</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sem títulos</TableCell></TableRow> :
                rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.user_id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.source}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(r.awarded_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
