import { useState, useEffect } from 'react';
import { MessageSquare, Mail, MailOpen, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';

interface Msg {
  id: string; sender_name: string; receiver_name: string; content: string;
  is_read: boolean; created_at: string;
}

export default function MensagensAdmin() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from('mensagens').select('*').order('created_at', { ascending: false }).limit(100);
      if (!data) { setLoading(false); return; }

      const userIds = [...new Set(data.flatMap(m => [m.sender_id, m.receiver_id]))];
      const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name || 'Usuário']) || []);

      setMsgs(data.map(m => ({
        id: m.id, sender_name: profileMap.get(m.sender_id) || 'Usuário',
        receiver_name: profileMap.get(m.receiver_id) || 'Usuário',
        content: m.content, is_read: m.is_read, created_at: m.created_at,
      })));
      setLoading(false);
    };
    fetch();
  }, []);

  const unread = msgs.filter(m => !m.is_read).length;

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="h-6 w-6 text-primary" /> Mensagens</h1><p className="text-muted-foreground text-sm">Supervisão de conversas</p></div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: msgs.length, icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Não Lidas', value: unread, icon: Mail, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Lidas', value: msgs.length - unread, icon: MailOpen, color: 'text-green-400', bg: 'bg-green-500/10' },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="py-4 px-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
            <Table>
              <TableHeader><TableRow className="border-border">
                <TableHead>Remetente</TableHead><TableHead>Destinatário</TableHead><TableHead>Mensagem</TableHead>
                <TableHead className="text-center">Lida</TableHead><TableHead>Data</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {msgs.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma mensagem</TableCell></TableRow>
                ) : msgs.map(m => (
                  <TableRow key={m.id} className="border-border hover:bg-muted/30">
                    <TableCell className="text-sm font-medium">{m.sender_name}</TableCell>
                    <TableCell className="text-sm">{m.receiver_name}</TableCell>
                    <TableCell className="text-sm truncate max-w-[300px]">{m.content}</TableCell>
                    <TableCell className="text-center">
                      {m.is_read ? <MailOpen className="h-4 w-4 text-muted-foreground mx-auto" /> : <Mail className="h-4 w-4 text-yellow-400 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(m.created_at).toLocaleDateString('pt-BR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
