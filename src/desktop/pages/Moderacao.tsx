import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Ban, CheckCircle, Flag, Loader2, UserX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Denuncia {
  id: string; target_type: string; target_id: string; reporter_id: string;
  reason: string; description: string | null; status: string; created_at: string;
  reporter_name: string;
}

interface BannedUser {
  id: string; display_name: string | null; banned_until: string;
}

export default function Moderacao() {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [banned, setBanned] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [banDialog, setBanDialog] = useState<{ open: boolean; userId: string | null; userName: string }>({ open: false, userId: null, userName: '' });
  const [banDays, setBanDays] = useState('7');
  const { toast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: denData }, { data: bannedData }] = await Promise.all([
      supabase.from('denuncias').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, display_name, banned_until').not('banned_until', 'is', null),
    ]);

    if (denData) {
      const reporterIds = [...new Set(denData.map(d => d.reporter_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', reporterIds);
      const profileMap = new Map<string, string>(profiles?.map(p => [p.id, p.display_name || 'Usuário']) || []);
      setDenuncias(denData.map(d => ({ ...d, reporter_name: profileMap.get(d.reporter_id) || 'Usuário' })));
    }

    if (bannedData) {
      setBanned(bannedData.filter(b => b.banned_until && new Date(b.banned_until) > new Date()) as BannedUser[]);
    }

    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleResolve = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('denuncias').update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: user?.id || null }).eq('id', id);
    toast({ title: 'Denúncia resolvida' }); fetchAll();
  };

  const openBanDialog = (denuncia: Denuncia) => {
    if (denuncia.target_type !== 'usuario') {
      toast({ title: 'Esta denúncia não é contra um usuário', variant: 'destructive' });
      return;
    }
    setBanDialog({ open: true, userId: denuncia.target_id, userName: 'usuário' });
    setBanDays('7');
  };

  const confirmBan = async () => {
    if (!banDialog.userId) return;
    const days = Number(banDays);
    if (!days || days < 1) { toast({ title: 'Informe um número válido de dias', variant: 'destructive' }); return; }
    const until = new Date(Date.now() + days * 86400000).toISOString();
    const { error } = await supabase.from('profiles').update({ banned_until: until }).eq('id', banDialog.userId);
    if (error) { toast({ title: 'Erro ao banir', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `Usuário banido por ${days} dias` });
    setBanDialog({ open: false, userId: null, userName: '' });
    fetchAll();
  };

  const handleUnban = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ banned_until: null }).eq('id', userId);
    if (error) { toast({ title: 'Erro ao desbanir', variant: 'destructive' }); return; }
    toast({ title: 'Usuário desbanido' });
    fetchAll();
  };

  const pendentes = denuncias.filter(d => d.status === 'pending');
  const resolvidas = denuncias.filter(d => d.status === 'resolved');

  if (loading) return <div className="p-6 flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /> Moderação</h1><p className="text-muted-foreground text-sm">Denúncias e gestão de usuários</p></div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Pendentes', value: pendentes.length, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Resolvidas', value: resolvidas.length, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Banidos', value: banned.length, icon: UserX, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Total', value: denuncias.length, icon: Flag, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        ].map(s => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="py-4 px-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="denuncias">
        <TabsList>
          <TabsTrigger value="denuncias"><Flag className="h-4 w-4 mr-1" />Denúncias</TabsTrigger>
          <TabsTrigger value="banidos"><UserX className="h-4 w-4 mr-1" />Usuários Banidos ({banned.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="denuncias" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="border-border">
                  <TableHead>Tipo</TableHead><TableHead>Reportado por</TableHead><TableHead>Motivo</TableHead>
                  <TableHead>Descrição</TableHead><TableHead className="text-center">Status</TableHead>
                  <TableHead>Data</TableHead><TableHead className="text-center w-44">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {denuncias.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma denúncia</TableCell></TableRow>
                  ) : denuncias.map(d => (
                    <TableRow key={d.id} className="border-border hover:bg-muted/30">
                      <TableCell><Badge variant="outline" className="text-xs">{d.target_type === 'anuncio' ? 'Anúncio' : 'Usuário'}</Badge></TableCell>
                      <TableCell className="text-sm">{d.reporter_name}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{d.reason}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{d.description || '—'}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={d.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}>
                          {d.status === 'pending' ? 'Pendente' : 'Resolvida'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(d.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-center">
                        {d.status === 'pending' && (
                          <div className="flex gap-1 justify-center">
                            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => handleResolve(d.id)}>
                              <CheckCircle className="h-3 w-3 mr-1" />Resolver
                            </Button>
                            {d.target_type === 'usuario' && (
                              <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive" onClick={() => openBanDialog(d)}>
                                <Ban className="h-3 w-3 mr-1" />Banir
                              </Button>
                            )}
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

        <TabsContent value="banidos" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="border-border">
                  <TableHead>Usuário</TableHead><TableHead>Banido até</TableHead><TableHead className="text-center w-32">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {banned.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum usuário banido</TableCell></TableRow>
                  ) : banned.map(b => (
                    <TableRow key={b.id} className="border-border hover:bg-muted/30">
                      <TableCell className="text-sm font-medium">{b.display_name || 'Sem nome'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(b.banned_until).toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => handleUnban(b.id)}>
                          <CheckCircle className="h-3 w-3 mr-1" />Desbanir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={banDialog.open} onOpenChange={o => !o && setBanDialog({ open: false, userId: null, userName: '' })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Banir usuário temporariamente</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Duração do banimento (dias)</Label>
              <Input type="number" min="1" value={banDays} onChange={e => setBanDays(e.target.value)} />
              <p className="text-xs text-muted-foreground">O usuário não poderá publicar anúncios, comentar ou interagir até a data definida.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setBanDialog({ open: false, userId: null, userName: '' })}>Cancelar</Button>
              <Button className="bg-destructive text-destructive-foreground" onClick={confirmBan}>
                <Ban className="h-4 w-4 mr-2" />Confirmar Banimento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
