import { Award, CheckCircle, XCircle, Clock, Ban, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { mockCertificados, certStatusLabels, certStatusColors } from '../mockData';

export default function Certificados() {
  const pendentes = mockCertificados.filter(c => c.status === 'pendente');
  const outros = mockCertificados.filter(c => c.status !== 'pendente');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Award className="h-6 w-6 text-primary" /> Certificados</h1>
        <p className="text-muted-foreground text-sm">Gestão de certificados de vendedores</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Pendentes', count: mockCertificados.filter(c => c.status === 'pendente').length, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Ativos', count: mockCertificados.filter(c => c.status === 'ativo').length, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Recusados', count: mockCertificados.filter(c => c.status === 'recusado').length, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Revogados', count: mockCertificados.filter(c => c.status === 'revogado').length, icon: Ban, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="py-4 px-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div><p className="text-2xl font-bold">{s.count}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pendentes">
        <TabsList>
          <TabsTrigger value="pendentes">Pendentes ({pendentes.length})</TabsTrigger>
          <TabsTrigger value="todos">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="mt-4">
          {pendentes.length === 0 ? (
            <Card className="border-border/50"><CardContent className="py-12 text-center text-muted-foreground">Nenhuma solicitação pendente</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {pendentes.map(c => (
                <Card key={c.id} className="border-border/50 border-l-4 border-l-yellow-500">
                  <CardContent className="py-4 px-5 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{c.user}</p>
                      <p className="text-xs text-muted-foreground">Solicitado em {c.requested_at}</p>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild><Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" />Analisar</Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Analisar Solicitação</DialogTitle></DialogHeader>
                          <div className="space-y-4 py-2">
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">Usuário</p>
                              <p className="font-semibold">{c.user}</p>
                              <p className="text-xs text-muted-foreground mt-1">Solicitado em {c.requested_at}</p>
                            </div>
                            <div className="space-y-2">
                              <Label>Decisão</Label>
                              <Select>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ativo">Aprovar</SelectItem>
                                  <SelectItem value="recusado">Recusar</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Validade (se aprovado)</Label>
                              <Select>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="6">6 meses</SelectItem>
                                  <SelectItem value="12">1 ano</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Justificativa</Label>
                              <Textarea placeholder="Motivo da decisão" rows={2} />
                            </div>
                            <Button className="w-full bg-primary text-primary-foreground">Confirmar</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="todos" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Usuário</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Solicitado em</TableHead>
                    <TableHead>Revisado em</TableHead>
                    <TableHead>Justificativa</TableHead>
                    <TableHead>Expira em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCertificados.map(c => (
                    <TableRow key={c.id} className="border-border hover:bg-muted/30">
                      <TableCell className="font-medium text-sm">{c.user}</TableCell>
                      <TableCell className="text-center"><Badge className={certStatusColors[c.status]}>{certStatusLabels[c.status]}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.requested_at}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.reviewed_at ?? '-'}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{c.reason ?? '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.expires_at ?? '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
