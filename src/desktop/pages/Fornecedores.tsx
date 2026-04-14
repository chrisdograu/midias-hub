import { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit, MoreHorizontal, Trash2, Eye, Package, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Fornecedor {
  id: string; name: string; cnpj: string | null; contact_name: string | null;
  email: string | null; phone: string | null; is_active: boolean; notes: string | null;
  address: string | null; produtos_count: number;
}

export default function Fornecedores() {
  const [search, setSearch] = useState('');
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Fornecedor | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [fName, setFName] = useState('');
  const [fCnpj, setFCnpj] = useState('');
  const [fContact, setFContact] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fNotes, setFNotes] = useState('');

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from('fornecedores').select('*').order('name');
    const { data: prods } = await supabase.from('produtos').select('supplier_id');
    const countMap = new Map<string, number>();
    prods?.forEach(p => { if (p.supplier_id) countMap.set(p.supplier_id, (countMap.get(p.supplier_id) || 0) + 1); });
    setFornecedores((data || []).map(f => ({ ...f, produtos_count: countMap.get(f.id) || 0 })));
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const resetForm = () => { setFName(''); setFCnpj(''); setFContact(''); setFEmail(''); setFPhone(''); setFNotes(''); setSelected(null); };
  const openCreate = () => { resetForm(); setDialogOpen(true); };
  const openEdit = (f: Fornecedor) => {
    setSelected(f); setFName(f.name); setFCnpj(f.cnpj || ''); setFContact(f.contact_name || '');
    setFEmail(f.email || ''); setFPhone(f.phone || ''); setFNotes(f.notes || ''); setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!fName.trim()) { toast({ title: 'Nome obrigatório', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = { name: fName, cnpj: fCnpj || null, contact_name: fContact || null, email: fEmail || null, phone: fPhone || null, notes: fNotes || null };
    if (selected) {
      await supabase.from('fornecedores').update(payload).eq('id', selected.id);
      toast({ title: 'Fornecedor atualizado!' });
    } else {
      await supabase.from('fornecedores').insert(payload);
      toast({ title: 'Fornecedor criado!' });
    }
    setSaving(false); setDialogOpen(false); resetForm(); fetch();
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    await supabase.from('fornecedores').delete().eq('id', selected.id);
    toast({ title: 'Fornecedor excluído' });
    setSaving(false); setDeleteOpen(false); setSelected(null); fetch();
  };

  const handleToggle = async (f: Fornecedor) => {
    await supabase.from('fornecedores').update({ is_active: !f.is_active }).eq('id', f.id);
    toast({ title: f.is_active ? 'Fornecedor desativado' : 'Fornecedor ativado' });
    fetch();
  };

  const filtered = fornecedores.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) || (f.cnpj || '').includes(search)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Truck className="h-6 w-6 text-primary" /> Fornecedores</h1>
          <p className="text-muted-foreground text-sm">{fornecedores.length} fornecedores</p>
        </div>
        <Button className="bg-primary text-primary-foreground" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Novo Fornecedor</Button>
      </div>

      <Card className="border-border/50">
        <CardContent className="py-3 px-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar fornecedor..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Empresa</TableHead><TableHead>CNPJ</TableHead><TableHead>Contato</TableHead>
                  <TableHead>Email</TableHead><TableHead className="text-center">Produtos</TableHead>
                  <TableHead className="text-center">Status</TableHead><TableHead className="text-center w-16">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum fornecedor encontrado</TableCell></TableRow>
                ) : filtered.map(f => (
                  <TableRow key={f.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-medium text-sm">{f.name}</TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">{f.cnpj || '—'}</TableCell>
                    <TableCell className="text-sm">{f.contact_name || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.email || '—'}</TableCell>
                    <TableCell className="text-center"><Badge variant="outline" className="gap-1"><Package className="h-3 w-3" />{f.produtos_count}</Badge></TableCell>
                    <TableCell className="text-center">
                      <Badge className={f.is_active ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}>{f.is_active ? 'Ativo' : 'Inativo'}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(f)}><Edit className="h-4 w-4 mr-2" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggle(f)}><Eye className="h-4 w-4 mr-2" />{f.is_active ? 'Desativar' : 'Ativar'}</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => { setSelected(f); setDeleteOpen(true); }}><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
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
        <DialogContent>
          <DialogHeader><DialogTitle>{selected ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Nome da Empresa</Label><Input placeholder="Nome" value={fName} onChange={e => setFName(e.target.value)} /></div>
            <div className="space-y-2"><Label>CNPJ</Label><Input placeholder="00.000.000/0001-00" value={fCnpj} onChange={e => setFCnpj(e.target.value)} /></div>
            <div className="space-y-2"><Label>Nome do Contato</Label><Input placeholder="Pessoa de contato" value={fContact} onChange={e => setFContact(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="contato@empresa.com" value={fEmail} onChange={e => setFEmail(e.target.value)} /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input placeholder="(11) 3333-0000" value={fPhone} onChange={e => setFPhone(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Observações</Label><Textarea placeholder="Notas sobre o fornecedor" rows={2} value={fNotes} onChange={e => setFNotes(e.target.value)} /></div>
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
          <AlertDialogHeader><AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
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
