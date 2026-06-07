import { useEffect, useState } from 'react';
import { LifeBuoy, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminPageHeader } from '../components/AdminPageHeader';

interface Props { channel: 'mobile' | 'web' }

export default function TicketsList({ channel }: Props) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('tickets').select('*').eq('channel', channel).order('created_at', { ascending: false });
    setTickets(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, [channel]);

  const sendReply = async (ticketId: string) => {
    const text = (reply[ticketId] || '').trim();
    if (!text) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('ticket_messages').insert({ ticket_id: ticketId, sender_id: user!.id, content: text } as any);
    if (error) return toast.error(error.message);
    await supabase.from('tickets').update({ status: 'answered' } as any).eq('id', ticketId);
    toast.success('Resposta enviada'); setReply({ ...reply, [ticketId]: '' }); load();
  };

  const close = async (id: string) => {
    await supabase.from('tickets').update({ status: 'closed' } as any).eq('id', id);
    toast.success('Ticket fechado'); load();
  };

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={LifeBuoy} title={`Tickets ${channel === 'mobile' ? 'Mobile (chat)' : 'Web (email)'}`}
        subtitle={channel === 'mobile' ? 'Suporte por chat do app mobile' : 'Tickets recebidos via formulário web'} />
      <Card className="border-border/50"><CardContent className="p-0">
        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> :
          tickets.length === 0 ? <p className="p-8 text-center text-muted-foreground">Nenhum ticket {channel}</p> :
            <Table>
              <TableHeader><TableRow><TableHead>Assunto</TableHead><TableHead>Status</TableHead><TableHead>Data</TableHead><TableHead className="w-[40%]">Ação</TableHead></TableRow></TableHeader>
              <TableBody>
                {tickets.map(t => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="font-medium">{t.subject}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{t.body}</div>
                    </TableCell>
                    <TableCell><Badge variant={t.status === 'open' ? 'destructive' : 'secondary'}>{t.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(t.created_at).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <Textarea rows={2} placeholder="Resposta..." value={reply[t.id] || ''} onChange={e => setReply({ ...reply, [t.id]: e.target.value })} />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => sendReply(t.id)}>Responder</Button>
                          <Button size="sm" variant="outline" onClick={() => close(t.id)}>Fechar</Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        }
      </CardContent></Card>
    </div>
  );
}
