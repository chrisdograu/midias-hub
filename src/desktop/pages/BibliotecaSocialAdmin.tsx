import { useEffect, useState } from 'react';
import { Library, Loader2, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminPageHeader } from '../components/AdminPageHeader';

/**
 * Read-only viewer da biblioteca social do usuário. Cada consulta exige justificativa
 * e é registrada em admin_logs.
 */
export default function BibliotecaSocialAdmin() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [target, setTarget] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [open, setOpen] = useState(false);

  const find = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('id, display_name, handle').ilike('display_name', `%${search}%`).limit(20);
    setUsers(data || []);
    setLoading(false);
  };

  const openLibrary = (u: any) => { setTarget(u); setOpen(true); setReason(''); };

  const confirmView = async () => {
    if (reason.trim().length < 6) return toast.error('Justificativa muito curta');
    // RPC autoritária: valida is_admin() e escreve o log em admin_logs no servidor.
    // O SELECT direto na tabela como fallback não existe mais para admins.
    const { data, error } = await supabase.rpc('read_user_library_admin' as any, {
      _target: target.id,
      _reason: reason.trim(),
    });
    if (error) { toast.error(error.message || 'Falha ao consultar biblioteca'); return; }
    setItems((data as any[]) || []);
    setOpen(false);
    toast.success('Acesso registrado no log');
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Library} title="Biblioteca Social (Admin)" subtitle="Visualização somente leitura com auditoria obrigatória" />
      <Card className="border-border/50"><CardContent className="p-4 flex gap-2">
        <Input placeholder="Buscar usuário pelo nome" value={search} onChange={e => setSearch(e.target.value)} />
        <Button onClick={find}><Search className="h-4 w-4 mr-1" />Buscar</Button>
      </CardContent></Card>

      {users.length > 0 && (
        <Card className="border-border/50"><CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Handle</TableHead><TableHead className="text-right">Ação</TableHead></TableRow></TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell>{u.display_name}</TableCell>
                  <TableCell className="text-muted-foreground">@{u.handle || '—'}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => openLibrary(u)}>Ver biblioteca</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent></Card>
      )}

      {items.length > 0 && (
        <Card className="border-border/50"><CardContent className="p-0">
          <div className="px-4 py-3 border-b border-border text-sm">Biblioteca de <b>{target?.display_name}</b> — somente leitura</div>
          {loading ? <Loader2 className="h-5 w-5 animate-spin m-6 text-primary" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Horas</TableHead><TableHead>Nota pessoal</TableHead><TableHead>Atualizado</TableHead></TableRow></TableHeader>
              <TableBody>
                {items.map(it => (
                  <TableRow key={it.id}>
                    <TableCell>{it.status}</TableCell>
                    <TableCell>{it.hours_played || 0}h</TableCell>
                    <TableCell>{it.personal_rating ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(it.status_updated_at).toLocaleString('pt-BR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent></Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Justificativa de acesso</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Esta ação será registrada nos logs administrativos.</p>
          <Textarea rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex.: investigação de denúncia #1234" />
          <Button onClick={confirmView}>Confirmar e visualizar</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
