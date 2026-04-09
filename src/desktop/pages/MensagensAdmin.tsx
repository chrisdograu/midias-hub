import { MessageSquare, Eye, Mail, MailOpen, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockMensagensAdmin } from '../mockData';

export default function MensagensAdmin() {
  const unread = mockMensagensAdmin.filter(m => !m.is_read).length;
  const total = mockMensagensAdmin.length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" /> Mensagens
        </h1>
        <p className="text-muted-foreground text-sm">Supervisão de conversas entre usuários do marketplace</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de Mensagens', value: total, icon: MessageSquare, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Não Lidas', value: unread, icon: Mail, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Denúncias via Chat', value: 1, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
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
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Remetente</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Anúncio</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead className="text-center">Lida</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-center w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMensagensAdmin.map(m => (
                <TableRow key={m.id} className="border-border hover:bg-muted/30">
                  <TableCell className="text-sm font-medium">{m.sender}</TableCell>
                  <TableCell className="text-sm">{m.receiver}</TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[180px]">
                    {m.anuncio_title || <span className="italic">Direto</span>}
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[250px]">{m.content}</TableCell>
                  <TableCell className="text-center">
                    {m.is_read
                      ? <MailOpen className="h-4 w-4 text-muted-foreground mx-auto" />
                      : <Mail className="h-4 w-4 text-yellow-400 mx-auto" />
                    }
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.created_at}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" className="text-xs h-7"><Eye className="h-3 w-3 mr-1" />Ver</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}