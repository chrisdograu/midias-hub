import { useEffect, useMemo, useState } from 'react';
import { LifeBuoy, Loader2, Search, Download, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminLog, exportCsv } from '../lib/adminLog';

interface Props { channel: 'mobile' | 'web' }

export default function TicketsList({ channel }: Props) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState<Record<string, string>>({});
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('tickets').select('*').eq('channel', channel).order('created_at', { ascending: false });
    setTickets(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, [channel]);

  const filtered = useMemo(() => tickets.filter(t =>
    (status === 'all' || t.status === status) &&
    (!search || (t.subject || '').toLowerCase().includes(search.toLowerCase()) || (t.body || '').toLowerCase().includes(search.toLowerCase()))
  ), [tickets, status, search]);

  const slaHours = (t: any) => Math.floor((Date.now() - new Date(t.created_at).getTime()) / 3600000);

  const sendReply = async (t: any) => {
    const text = (reply[t.id] || '').trim(); if (!text) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('ticket_messages').insert({ ticket_id: t.id, sender_id: user!.id, content: text } as any);
    if (error) return toast.error(error.message);
    await supabase.from('tickets').update({ status: 'answered' } as any).eq('id', t.id);
    await adminLog({ action: 'ticket_reply', entity: 'ticket', entity_id: t.id, payload: { content: text } });
    toast.success('Resposta enviada'); setReply({ ...reply, [t.id]: '' }); load();
  };

  const close = async (t: any) => {
    const reason = prompt('Motivo do fechamento (opcional):') || '';
    await supabase.from('tickets').update({ status: 'closed' } as any).eq('id', t.id);
    await adminLog({ action: 'ticket_close', entity: 'ticket', entity_id: t.id, reason });
    toast.success('Ticket fechado'); load();
  };

  const assignToMe = async (t: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('tickets').update({ assigned_to: user?.id } as any).eq('id', t.id);
    await adminLog({ action: 'ticket_assign', entity: 'ticket', entity_id: t.id, payload: { assigned_to: user?.id } });
    toast.success('Atribuído a você'); load();
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={LifeBuoy} title={`Tickets ${channel === 'mobile' ? 'Mobile (chat)' : 'Web (email)'}`}
        subtitle={channel === 'mobile' ? 'Suporte por chat do app mobile' : 'Tickets recebidos via formulário web'}
        actions={<Button variant="outline" size="sm" onClick={() => exportCsv(`tickets_${channel}.csv`, filtered)}><Download className="h-4 w-4 mr-1" />Exportar</Button>} />

      <Card className="border-border/50"><CardContent className="p-4 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]"><Label className="text-xs">Buscar</Label>
          <div className="relative"><Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Assunto ou corpo..." value={search} onChange={e => setSearch(e.target.value)} /></div></div>
        <div><Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abertos</SelectItem>
              <SelectItem value="answered">Respondidos</SelectItem>
              <SelectItem value="closed">Fechados</SelectItem>
            </SelectContent></Select></div>
      </CardContent></Card>

      <Card className="border-border/50"><CardContent className="p-0">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> :
          filtered.length === 0 ? <p className="p-8 text-center text-muted-foreground">Nenhum ticket {channel}</p> :
            <Table>
              <TableHeader><TableRow><TableHead>Assunto</TableHead><TableHead>Status</TableHead><TableHead>SLA</TableHead><TableHead>Atribuído</TableHead><TableHead className="w-[40%]">Ação</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map(t => {
                  const h = slaHours(t);
                  const sla = h > 48 ? 'destructive' : h > 24 ? 'secondary' : 'default';
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="font-medium">{t.subject}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{t.body}</div>
                        <div className="text-xs text-muted-foreground mt-1">{new Date(t.created_at).toLocaleString('pt-BR')}</div>
                      </TableCell>
                      <TableCell><Badge variant={t.status === 'open' ? 'destructive' : 'secondary'}>{t.status}</Badge></TableCell>
                      <TableCell><Badge variant={sla as any}>{h}h</Badge></TableCell>
                      <TableCell className="text-xs font-mono">{t.assigned_to ? t.assigned_to.slice(0, 8) : <Button size="sm" variant="ghost" onClick={() => assignToMe(t)}><UserCheck className="h-3.5 w-3.5" /></Button>}</TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Textarea rows={2} placeholder="Resposta..." value={reply[t.id] || ''} onChange={e => setReply({ ...reply, [t.id]: e.target.value })} />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => sendReply(t)}>Responder</Button>
                            <Button size="sm" variant="outline" onClick={() => close(t)}>Fechar</Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
        }
      </CardContent></Card>
    </div>
  );
}
