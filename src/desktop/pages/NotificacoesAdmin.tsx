import { useState, useEffect, useMemo } from 'react';
import { Bell, Mail, MailOpen, Loader2, Search, ArrowLeft, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const typeLabels: Record<string, string> = {
  nova_mensagem: 'Mensagem', proposta_aceita: 'Proposta Aceita', proposta_recusada: 'Proposta Recusada',
  comentario_review: 'Comentário', certificado_aprovado: 'Certificado OK', certificado_recusado: 'Certificado Recusado', certificado_revogado: 'Certificado Revogado',
};
const typeColors: Record<string, string> = {
  nova_mensagem: 'bg-blue-500/20 text-blue-400', proposta_aceita: 'bg-green-500/20 text-green-400',
  proposta_recusada: 'bg-red-500/20 text-red-400', comentario_review: 'bg-purple-500/20 text-purple-400',
  certificado_aprovado: 'bg-green-500/20 text-green-400', certificado_recusado: 'bg-red-500/20 text-red-400', certificado_revogado: 'bg-orange-500/20 text-orange-400',
};

interface Notif {
  id: string; user_id: string; user_name: string; type: string; title: string; body: string | null; is_read: boolean; created_at: string;
}

export default function NotificacoesAdmin() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(500);
      if (!data) { setLoading(false); return; }
      const userIds = [...new Set(data.map(n => n.user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', userIds);
      const profileMap = new Map<string, string>(profiles?.map(p => [p.id, p.display_name || 'Usuário']) || []);
      setNotifs(data.map(n => ({ ...n, user_name: profileMap.get(n.user_id) || 'Usuário' })));
      setLoading(false);
    };
    fetch();
  }, []);

  // Group by user
  const users = useMemo(() => {
    const m = new Map<string, { id: string; name: string; total: number; unread: number; lastAt: string }>();
    notifs.forEach(n => {
      const ex = m.get(n.user_id);
      if (!ex) m.set(n.user_id, { id: n.user_id, name: n.user_name, total: 1, unread: n.is_read ? 0 : 1, lastAt: n.created_at });
      else { ex.total++; if (!n.is_read) ex.unread++; if (n.created_at > ex.lastAt) ex.lastAt = n.created_at; }
    });
    const all = [...m.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
    const q = search.trim().toLowerCase();
    return q ? all.filter(u => u.name.toLowerCase().includes(q)) : all;
  }, [notifs, search]);

  const userNotifs = useMemo(() => selectedUser ? notifs.filter(n => n.user_id === selectedUser.id) : [], [notifs, selectedUser]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    if (error) { toast({ title: 'Erro ao marcar notificação', variant: 'destructive' }); return; }
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const totalUnread = notifs.filter(n => !n.is_read).length;

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6 text-primary" /> Notificações</h1><p className="text-muted-foreground text-sm">Agrupadas por usuário</p></div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Usuários', value: new Set(notifs.map(n => n.user_id)).size, icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Total', value: notifs.length, icon: Bell, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Não Lidas', value: totalUnread, icon: Mail, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="py-4 px-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!selectedUser && (
        <>
          <Card className="border-border/50">
            <CardContent className="py-3 px-4">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar usuário..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-0">
              {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
                <Table>
                  <TableHeader><TableRow className="border-border">
                    <TableHead>Usuário</TableHead><TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Não lidas</TableHead><TableHead>Última</TableHead>
                    <TableHead className="text-center w-32">Ações</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma notificação</TableCell></TableRow>
                    ) : users.map(u => (
                      <TableRow key={u.id} className="border-border hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedUser({ id: u.id, name: u.name })}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-center"><Badge variant="secondary">{u.total}</Badge></TableCell>
                        <TableCell className="text-center">{u.unread > 0 ? <Badge className="bg-yellow-500/20 text-yellow-400">{u.unread}</Badge> : <span className="text-muted-foreground text-xs">0</span>}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(u.lastAt).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-center"><Button size="sm" variant="ghost" className="h-7 text-xs">Ver tudo</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {selectedUser && (
        <>
          <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
          <h2 className="text-lg font-semibold">Notificações de: {selectedUser.name}</h2>
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="border-border">
                  <TableHead>Tipo</TableHead><TableHead>Título</TableHead><TableHead>Conteúdo</TableHead>
                  <TableHead className="text-center">Lida</TableHead><TableHead>Data</TableHead><TableHead className="text-center w-24">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {userNotifs.map(n => (
                    <TableRow key={n.id} className="border-border hover:bg-muted/30">
                      <TableCell><Badge className={typeColors[n.type] || 'bg-muted text-muted-foreground'}>{typeLabels[n.type] || n.type}</Badge></TableCell>
                      <TableCell className="text-sm">{n.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[300px]">{n.body || '—'}</TableCell>
                      <TableCell className="text-center">{n.is_read ? <MailOpen className="h-4 w-4 text-muted-foreground mx-auto" /> : <Mail className="h-4 w-4 text-primary mx-auto" />}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(n.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-center">
                        {!n.is_read && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAsRead(n.id)}>Marcar lida</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
