import { Star, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockAvaliacoesUsuario } from '../mockData';

export default function AvaliacoesUsuario() {
  const avgRating = (mockAvaliacoesUsuario.reduce((s, a) => s + a.rating, 0) / mockAvaliacoesUsuario.length).toFixed(1);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Star className="h-6 w-6 text-primary" /> Avaliações de Usuários
        </h1>
        <p className="text-muted-foreground text-sm">Reviews entre compradores e vendedores do marketplace</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de Avaliações', value: mockAvaliacoesUsuario.length, color: 'text-blue-400' },
          { label: 'Média Geral', value: avgRating, color: 'text-yellow-400' },
          { label: 'Avaliações Negativas (≤2)', value: mockAvaliacoesUsuario.filter(a => a.rating <= 2).length, color: 'text-red-400' },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="py-4 px-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Avaliador</TableHead>
                <TableHead>Avaliado</TableHead>
                <TableHead>Anúncio</TableHead>
                <TableHead className="text-center">Nota</TableHead>
                <TableHead>Comentário</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-center w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockAvaliacoesUsuario.map(a => (
                <TableRow key={a.id} className="border-border hover:bg-muted/30">
                  <TableCell className="text-sm font-medium">{a.reviewer}</TableCell>
                  <TableCell className="text-sm">{a.reviewed}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.anuncio_title}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < a.rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`} />
                      ))}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm truncate max-w-[250px]">{a.comment}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.created_at}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-1 justify-center">
                      <Button variant="ghost" size="sm" className="text-xs h-7"><Eye className="h-3 w-3 mr-1" />Ver</Button>
                      <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive"><Trash2 className="h-3 w-3 mr-1" />Remover</Button>
                    </div>
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