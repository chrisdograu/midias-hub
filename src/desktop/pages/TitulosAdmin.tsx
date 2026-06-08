import { useEffect, useMemo, useState } from 'react';
import { Award, Loader2, Plus, Trash2, Search, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminLog, exportCsv } from '../lib/adminLog';
import { useDebounce } from '@/hooks/useDebounce';

export default function TitulosAdmin() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ user_id: '', name: '' });
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [filterSearch, setFilterSearch] = useState('');
  const debounced = useDebounce(userSearch, 300);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('user_titles').select('*').order('awarded_at', { ascending: false }).limit(300);
    setRows(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!debounced || debounced.length < 2) { setUserResults([]); return; }
    (async () => {
      const { data } = await supabase.from('profiles').select('id, display_name, handle')
        .or(`display_name.ilike.%${debounced}%,handle.ilike.%${debounced}%`).limit(8);
      setUserResults(data || []);
    })();
  }, [debounced]);

  const filtered = useMemo(() => rows.filter(r => !filterSearch ||
    (r.name || '').toLowerCase().includes(filterSearch.toLowerCase()) ||
    (r.user_id || '').includes(filterSearch)
  ), [rows, filterSearch]);

  const award = async () => {
    if (!form.user_id || !form.name) return toast.error('Preencha tudo');
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('user_titles').insert({ ...form, source: 'admin', awarded_by: user?.id } as any).select().single();
    if (error) return toast.error(error.message);
    await adminLog({ action: 'titulo_award', entity: 'user_title', entity_id: data?.id, payload: form });
    toast.success('Título concedido'); setOpen(false); setForm({ user_id: '', name: '' }); setUserSearch(''); load();
  };

  const remove = async (r: any) => {
    const reason = prompt('Motivo da remoção:'); if (!reason) return;
    const { error } = await supabase.from('user_titles').delete().eq('id', r.id);
    if (error) return toast.error(error.message);
    await adminLog({ action: 'titulo_revoke', entity: 'user_title', entity_id: r.id, reason, payload: r });
    toast.success('Removido'); load();
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Award} title="Títulos" subtitle="Outorga manual de títulos especiais"
        actions={<>
          <Button variant="outline" size="sm" onClick={() => exportCsv('titulos.csv', filtered)}><Download className="h-4 w-4 mr-1" />Exportar</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Conceder</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Conceder título</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Buscar usuário</Label>
                  <Input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Nome ou @handle" />
                  {userResults.length > 0 && (
                    <div className="border border-border rounded mt-1 max-h-40 overflow-y-auto">
                      {userResults.map(u => (
                        <button key={u.id} type="button" onClick={() => { setForm({ ...form, user_id: u.id }); setUserSearch(u.display_name); setUserResults([]); }}
                          className="w-full text-left p-2 hover:bg-muted text-sm">
                          {u.display_name} <span className="text-muted-foreground">@{u.handle || '—'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {form.user_id && <div className="text-xs text-muted-foreground">User ID: {form.user_id}</div>}
                <div><Label>Nome do título</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <Button onClick={award} className="w-full">Conceder</Button>
              </div>
            </DialogContent>
          </Dialog>
        </>} />

      <Card className="border-border/50"><CardContent className="p-4">
        <div className="relative max-w-md"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Filtrar por nome ou user id..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} /></div>
      </CardContent></Card>

      <Card className="border-border/50"><CardContent className="p-0">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Título</TableHead><TableHead>Origem</TableHead><TableHead>Quando</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sem títulos</TableCell></TableRow> :
                filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.user_id.slice(0, 8)}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.source}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(r.awarded_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => remove(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>
    </div>
  );
}
