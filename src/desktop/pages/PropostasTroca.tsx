import { ArrowLeftRight, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockPropostasTroca, tradeStatusLabels, tradeStatusColors } from '../mockData';

export default function PropostasTroca() {
  const counts = {
    pending: mockPropostasTroca.filter(p => p.status === 'pending').length,
    accepted: mockPropostasTroca.filter(p => p.status === 'accepted').length,
    rejected: mockPropostasTroca.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ArrowLeftRight className="h-6 w-6 text-primary" /> Propostas de Troca
        </h1>
        <p className="text-muted-foreground text-sm">Acompanhamento de trocas entre usuários do marketplace</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pendentes', value: counts.pending, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Aceitas', value: counts.accepted, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Recusadas', value: counts.rejected, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
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
                <TableHead>Proponente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Anúncio</TableHead>
                <TableHead>Item Oferecido</TableHead>
                <TableHead className="text-center">Confirmações</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-center w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPropostasTroca.map(p => (
                <TableRow key={p.id} className="border-border hover:bg-muted/30">
                  <TableCell className="text-sm font-medium">{p.proposer}</TableCell>
                  <TableCell className="text-sm">{p.seller}</TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">{p.anuncio_title}</TableCell>
                  <TableCell className="text-sm truncate max-w-[200px]">{p.offered_item}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-2 justify-center text-xs">
                      <span className={p.proposer_confirmed ? 'text-green-400' : 'text-muted-foreground'}>
                        Prop: {p.proposer_confirmed ? '✓' : '✗'}
                      </span>
                      <span className={p.seller_confirmed ? 'text-green-400' : 'text-muted-foreground'}>
                        Vend: {p.seller_confirmed ? '✓' : '✗'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={tradeStatusColors[p.status] || ''}>
                      {tradeStatusLabels[p.status] || p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.created_at}</TableCell>
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