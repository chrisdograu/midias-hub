import { Shield, AlertTriangle, Ban, CheckCircle, Eye, Flag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockDenuncias } from '../mockData';

export default function Moderacao() {
  const pendentes = mockDenuncias.filter(d => d.status === 'pending');
  const resolvidas = mockDenuncias.filter(d => d.status === 'resolved');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /> Moderação</h1>
        <p className="text-muted-foreground text-sm">Marketplace Mobile - Denúncias e gestão de usuários</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="py-4 px-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10"><AlertTriangle className="h-5 w-5 text-yellow-400" /></div>
            <div><p className="text-2xl font-bold">{pendentes.length}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-4 px-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle className="h-5 w-5 text-green-400" /></div>
            <div><p className="text-2xl font-bold">{resolvidas.length}</p><p className="text-xs text-muted-foreground">Resolvidas</p></div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="py-4 px-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10"><Ban className="h-5 w-5 text-red-400" /></div>
            <div><p className="text-2xl font-bold">2</p><p className="text-xs text-muted-foreground">Bloqueados</p></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="denuncias">
        <TabsList>
          <TabsTrigger value="denuncias"><Flag className="h-4 w-4 mr-1" />Denúncias</TabsTrigger>
          <TabsTrigger value="bloqueados"><Ban className="h-4 w-4 mr-1" />Usuários Bloqueados</TabsTrigger>
        </TabsList>

        <TabsContent value="denuncias" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Tipo</TableHead>
                    <TableHead>Alvo</TableHead>
                    <TableHead>Reportado por</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-center w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDenuncias.map(d => (
                    <TableRow key={d.id} className="border-border hover:bg-muted/30">
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {d.target_type === 'anuncio' ? 'Anúncio' : 'Usuário'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{d.target_title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.reporter}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{d.reason}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={d.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}>
                          {d.status === 'pending' ? 'Pendente' : 'Resolvida'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{d.created_at}</TableCell>
                      <TableCell className="text-center">
                        {d.status === 'pending' && (
                          <div className="flex gap-1 justify-center">
                            <Button variant="ghost" size="sm" className="text-xs h-7"><Eye className="h-3 w-3 mr-1" />Ver</Button>
                            <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive"><Ban className="h-3 w-3 mr-1" />Remover</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bloqueados" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="py-8 text-center">
              <Ban className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">2 usuários bloqueados</p>
              <div className="mt-4 space-y-2 max-w-md mx-auto">
                {['user_scammer42', 'fake_seller_x'].map(u => (
                  <div key={u} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">{u}</span>
                    <Button variant="outline" size="sm" className="text-xs h-7">Desbloquear</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
