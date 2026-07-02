import { useEffect, useState } from 'react';
import { Store, Loader2, Search, Eye, PalmtreeIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { adminLog } from '@/desktop/lib/adminLog';

interface Seller {
  id: string;
  user_id: string;
  handle: string;
  display_name: string;
  rating: number | null;
  total_sales: number | null;
  vacation_mode: boolean | null;
  vacation_message: string | null;
}

export default function VendedoresAdmin() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Seller | null>(null);
  const [draftMode, setDraftMode] = useState(false);
  const [draftMsg, setDraftMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('seller_profiles')
      .select('id, user_id, handle, display_name, rating, total_sales, vacation_mode, vacation_message')
      .order('display_name');
    setSellers((data || []) as Seller[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEditor = (s: Seller) => {
    setEditing(s);
    setDraftMode(!!s.vacation_mode);
    setDraftMsg(s.vacation_message || '');
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from('seller_profiles')
      .update({ vacation_mode: draftMode, vacation_message: draftMsg || null })
      .eq('id', editing.id);
    if (error) { toast.error('Erro ao salvar'); setSaving(false); return; }
    await adminLog({
      action: draftMode ? 'seller_vacation_on' : 'seller_vacation_off',
      entity: 'seller_profile',
      entity_id: editing.id,
      payload: {
        handle: editing.handle,
        previous: { vacation_mode: editing.vacation_mode, vacation_message: editing.vacation_message },
        next: { vacation_mode: draftMode, vacation_message: draftMsg || null },
      },
    });
    toast.success('Modo férias atualizado');
    setSaving(false);
    setEditing(null);
    load();
  };

  const filtered = sellers.filter(s =>
    !search || s.display_name?.toLowerCase().includes(search.toLowerCase()) || s.handle?.toLowerCase().includes(search.toLowerCase())
  );
  const onVacation = filtered.filter(s => s.vacation_mode).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Store className="h-6 w-6 text-primary" /> Vendedores</h1>
          <p className="text-sm text-muted-foreground">Gerencie perfis $vendedor, modo férias e mensagens de ausência.</p>
        </div>
        <Badge variant="secondary" className="text-sm"><PalmtreeIcon className="h-3.5 w-3.5 mr-1" /> {onVacation} em férias</Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nome ou @handle" className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhum vendedor encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Handle</TableHead>
                  <TableHead>Vendas</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Férias</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.display_name}</TableCell>
                    <TableCell className="text-muted-foreground">${s.handle}</TableCell>
                    <TableCell>{s.total_sales ?? 0}</TableCell>
                    <TableCell>{Number(s.rating ?? 0).toFixed(1)}</TableCell>
                    <TableCell>
                      {s.vacation_mode
                        ? <Badge className="bg-warning/20 text-warning border-warning/40">🏖️ Ativo</Badge>
                        : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openEditor(s)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> Gerenciar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modo férias — {editing?.display_name}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium text-sm">Ativar modo férias</p>
                  <p className="text-xs text-muted-foreground">Oculta os anúncios ativos para visitantes.</p>
                </div>
                <Switch checked={draftMode} onCheckedChange={setDraftMode} />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Mensagem para os visitantes</label>
                <Textarea
                  value={draftMsg}
                  onChange={e => setDraftMsg(e.target.value.slice(0, 240))}
                  placeholder="Ex.: Estou de férias até 30/07 — volto respondendo tudo assim que chegar!"
                  rows={3}
                />
                <p className="text-[11px] text-muted-foreground mt-1 text-right">{draftMsg.length}/240</p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Pré-visualização</p>
                <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 flex items-start gap-3">
                  <span className="text-2xl">🏖️</span>
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-warning">
                      {draftMode ? `${editing.display_name} está em modo férias` : 'Modo férias desativado'}
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      {draftMode
                        ? (draftMsg || 'Os anúncios estão temporariamente ocultos. Ele volta em breve.')
                        : 'A loja aparece normalmente para os visitantes.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button onClick={save} disabled={saving}>
                  {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />} Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
