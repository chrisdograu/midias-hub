import { useState, useEffect } from 'react';
import { Ticket, Plus, Search, Edit, Trash2, MoreHorizontal, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Cupom = Tables<'cupons'>;

export default function Cupons() {
  const [search, setSearch] = useState('');
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Cupom | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [fCode, setFCode] = useState('');
  const [fDiscount, setFDiscount] = useState('');
  const [fMaxUses, setFMaxUses] = useState('');
  const [fActive, setFActive] = useState(true);
  const [fValidUntil, setFValidUntil] = useState('');

  const fetchCupons = async () => {
    setLoading(true);
    const { data } = await supabase.from('cupons').select('*').order('created_at', { ascending: false });
    setCupons(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCupons(); }, []);

  const resetForm = () => {
    setFCode(''); setFDiscount(''); setFMaxUses(''); setFActive(true); setFValidUntil('');
    setSelected(null);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (c: Cupom) => {
    setSelected(c);
    setFCode(c.code); setFDiscount(String(c.discount_percent)); setFMaxUses(c.max_uses ? String(c.max_uses) : '');
    setFActive(c.is_active); setFValidUntil(c.valid_until ? c.valid_until.split('T')[0] : '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!fCode.trim() || !fDiscount) { toast({ title: 'Código e desconto obrigatórios', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = {
      code: fCode.toUpperCase().trim(),
      discount_percent: Number(fDiscount),
      max_uses: fMaxUses ? Number(fMaxUses) : null,
      is_active: fActive,
      valid_until: fValidUntil ? new Date(fValidUntil).toISOString() : null,
    };
    if (selected) {
      await supabase.from('cupons').update(payload).eq('id', selected.id);
      toast({ title: 'Cupom atualizado!' });
    } else {
      await supabase.from('cupons').insert(payload);
      toast({ title: 'Cupom criado!' });
    }
    setSaving(false); setDialogOpen(false); resetForm(); fetchCupons();
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    await supabase.from('cupons').delete().eq('id', selected.id);
    toast({ title: 'Cupom excluído' });
    setSaving(false); setDeleteOpen(false); setSelected(null); fetchCupons();
  };

  const handleToggle = async (c: Cupom) => {
    await supabase.from('cupons').update({ is_active: !c.is_active }).eq('id', c.id);
    toast({ title: c.is_active ? 'Cupom desativado' : 'Cupom ativado' });
    fetchCupons();
  };

  const filtered = cupons.filter(c => c.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Ticket className="h-6 w-6 text-primary" /> Cupons de Desconto</h1>
          <p className="text-muted-foreground text-sm">{cupons.length} cupons cadastrados</p>
        </div>
        <Button className="bg-primary text-primary-foreground" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Cupom</Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="py-3 px-4 flex gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar cupom..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Código</TableHead><TableHead className="text-center">Desconto</TableHead>
                  <TableHead className="text-center">Usos</TableHead><TableHead className="text-center">Máx.</TableHead>
                  <TableHead>Validade</TableHead><TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center w-16">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum cupom encontrado</TableCell></TableRow>
                ) : filtered.map(c => (
                  <TableRow key={c.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-mono font-bold text-primary">{c.code}</TableCell>
                    <TableCell className="text-center"><Badge variant="outline">{c.discount_percent}%</Badge></TableCell>
                    <TableCell className="text-center text-sm">{c.uses_count}</TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">{c.max_uses ?? '∞'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.valid_until ? new Date(c.valid_until).toLocaleDateString('pt-BR') : 'Sem prazo'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={c.is_active ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}>
                        {c.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(c)}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggle(c)}>{c.is_active ? 'Desativar' : 'Ativar'}</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => { setSelected(c); setDeleteOpen(true); }}><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{selected ? 'Editar Cupom' : 'Novo Cupom'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Código</Label><Input placeholder="EX: GAMER20" value={fCode} onChange={e => setFCode(e.target.value)} className="uppercase" /></div>
            <div className="space-y-2"><Label>Desconto (%)</Label><Input type="number" placeholder="10" min={1} max={100} value={fDiscount} onChange={e => setFDiscount(e.target.value)} /></div>
            <div className="space-y-2"><Label>Limite de usos (vazio = ilimitado)</Label><Input type="number" placeholder="100" value={fMaxUses} onChange={e => setFMaxUses(e.target.value)} /></div>
            <div className="space-y-2"><Label>Válido até (vazio = sem prazo)</Label><Input type="date" value={fValidUntil} onChange={e => setFValidUntil(e.target.value)} /></div>
            <div className="flex items-center gap-3"><Switch checked={fActive} onCheckedChange={setFActive} /><Label>Ativo</Label></div>
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
          <AlertDialogHeader><AlertDialogTitle>Excluir cupom?</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir o cupom "{selected?.code}"?</AlertDialogDescription>
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
