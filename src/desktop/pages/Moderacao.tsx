import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Ban, CheckCircle, Eye, Flag, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Denuncia {
  id: string; target_type: string; target_id: string; reporter_id: string;
  reason: string; description: string | null; status: string; created_at: string;
  reporter_name: string;
}

export default function Moderacao() {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDenuncias = async () => {
    setLoading(true);
    const { data } = await supabase.from('denuncias').select('*').order('created_at', { ascending: false });
    if (!data) { setLoading(false); return; }
    const reporterIds = [...new Set(data.map(d => d.reporter_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', reporterIds);
    const profileMap = new Map(profiles?.map(p => [p.id, p.display_name || 'Usuário']) || []);
    setDenuncias(data.map(d => ({ ...d, reporter_name: profileMap.get(d.reporter_id) || 'Usuário' })));
    setLoading(false);
  };

  useEffect(() => { fetchDenuncias(); }, []);

  const handleResolve = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('denuncias').update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: user?.id || null }).eq('id', id);
    toast({ title: 'Denúncia resolvida' }); fetchDenuncias();
  };

  const pendentes = denuncias.filter(d => d.status === 'pending');
  const resolvidas = denuncias.filter(d => d.status === 'resolved');

  if (loading) return <div className="p-6 flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /> Moderação</h1><p className="text-muted-foreground text-sm">Denúncias e gestão</p></div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pendentes', value: pendentes.length, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Resolvidas', value: resolvidas.length, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
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
        </TabsList>
        <TabsContent value="denuncias" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="border-border">
                  <TableHead>Tipo</TableHead><TableHead>Reportado por</TableHead><TableHead>Motivo</TableHead>
                  <TableHead>Descrição</TableHead><TableHead className="text-center">Status</TableHead>
                  <TableHead>Data</TableHead><TableHead className="text-center w-32">Ações</TableHead>
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
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => handleResolve(d.id)}>
                            <CheckCircle className="h-3 w-3 mr-1" />Resolver
                          </Button>
                        )}
                      </TableCell>
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
