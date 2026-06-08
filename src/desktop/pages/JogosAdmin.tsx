import { useEffect, useMemo, useState } from 'react';
import { Gamepad2, Loader2, Plus, Search, Edit, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminLog, exportCsv } from '../lib/adminLog';

const ESTADOS = ['ativo', 'oculto', 'somente_forum', 'somente_loja', 'descontinuado'] as const;
type Estado = typeof ESTADOS[number];
const LABELS: Record<Estado, string> = { ativo: 'Ativo', oculto: 'Oculto', somente_forum: 'Somente Fórum', somente_loja: 'Somente Loja', descontinuado: 'Descontinuado' };

interface Jogo { id: string; title: string; estado_publicacao: Estado; stock: number; price: number; }

export default function JogosAdmin() {
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [editing, setEditing] = useState<Jogo | null>(null);
  const [form, setForm] = useState({ price: '', stock: '' });
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('produtos').select('id,title,estado_publicacao,stock,price').order('updated_at', { ascending: false });
    setJogos((data || []) as any); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => jogos.filter(j =>
    (estadoFilter === 'all' || j.estado_publicacao === estadoFilter) &&
    (!search || j.title.toLowerCase().includes(search.toLowerCase()))
  ), [jogos, estadoFilter, search]);

  const updateEstado = async (j: Jogo, estado: Estado) => {
    const { error } = await supabase.from('produtos').update({ estado_publicacao: estado } as any).eq('id', j.id);
    if (error) return toast.error(error.message);
    await adminLog({ action: 'jogo_estado_update', entity: 'produto', entity_id: j.id, payload: { from: j.estado_publicacao, to: estado, title: j.title } });
    toast.success('Estado atualizado'); load();
  };

  const openEdit = (j: Jogo) => { setEditing(j); setForm({ price: String(j.price), stock: String(j.stock) }); };

  const saveEdit = async () => {
    if (!editing) return;
    const price = Number(form.price); const stock = Number(form.stock);
    if (isNaN(price) || isNaN(stock)) return toast.error('Valores inválidos');
    const { error } = await supabase.from('produtos').update({ price, stock } as any).eq('id', editing.id);
    if (error) return toast.error(error.message);
    await adminLog({ action: 'jogo_update', entity: 'produto', entity_id: editing.id, payload: { from: { price: editing.price, stock: editing.stock }, to: { price, stock } } });
    toast.success('Atualizado'); setEditing(null); load();
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Gamepad2} title="Jogos" subtitle="Catálogo, estado de publicação e preço/estoque inline"
        actions={<>
          <Button variant="outline" size="sm" onClick={() => exportCsv('jogos.csv', filtered)}><Download className="h-4 w-4 mr-1" />Exportar</Button>
          <Button onClick={() => navigate('/desktop/jogos/novo')}><Plus className="h-4 w-4 mr-1" /> Novo jogo</Button>
        </>} />

      <Card className="border-border/50"><CardContent className="p-4 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]"><Label className="text-xs">Buscar</Label>
          <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Título..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
        <div><Label className="text-xs">Estado</Label>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos</SelectItem>{ESTADOS.map(e => <SelectItem key={e} value={e}>{LABELS[e]}</SelectItem>)}</SelectContent></Select></div>
      </CardContent></Card>

      <Card className="border-border/50"><CardContent className="p-0">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
          <Table>
            <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Preço</TableHead><TableHead>Estoque</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum jogo</TableCell></TableRow> :
                filtered.map(j => (
                  <TableRow key={j.id}>
                    <TableCell className="font-medium">{j.title}</TableCell>
                    <TableCell>R$ {Number(j.price).toFixed(2)}</TableCell>
                    <TableCell>{j.stock}</TableCell>
                    <TableCell><Badge variant={j.estado_publicacao === 'ativo' ? 'default' : 'secondary'}>{LABELS[j.estado_publicacao]}</Badge></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Select value={j.estado_publicacao} onValueChange={(v) => updateEstado(j, v as Estado)}>
                        <SelectTrigger className="w-[160px] inline-flex"><SelectValue /></SelectTrigger>
                        <SelectContent>{ESTADOS.map(e => <SelectItem key={e} value={e}>{LABELS[e]}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" onClick={() => openEdit(j)}><Edit className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        )}
      </CardContent></Card>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar — {editing?.title}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Preço</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
            <div><Label>Estoque</Label><Input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} /></div>
          </div>
          <Button onClick={saveEdit}>Salvar</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
