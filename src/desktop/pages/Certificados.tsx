import { useState, useEffect } from 'react';
import { Award, CheckCircle, XCircle, Clock, Ban, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { certStatusLabels, certStatusColors } from '../mockData';

interface Cert {
  id: string; user_id: string; user_name: string; status: string;
  requested_at: string; reviewed_at: string | null; reason: string | null; expires_at: string | null;
}

export default function Certificados() {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzeOpen, setAnalyzeOpen] = useState(false);
  const [selected, setSelected] = useState<Cert | null>(null);
  const [decision, setDecision] = useState('');
  const [validity, setValidity] = useState('12');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchCerts = async () => {
    setLoading(true);
    const { data } = await supabase.from('certificados').select('*').order('requested_at', { ascending: false });
    if (!data) { setLoading(false); return; }
    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', userIds);
    const profileMap = new Map<string, string>(profiles?.map(p => [p.id, p.display_name || 'Usuário']) || []);
    setCerts(data.map(c => ({ ...c, user_name: profileMap.get(c.user_id) || 'Usuário' })));
    setLoading(false);
  };

  useEffect(() => { fetchCerts(); }, []);

  const handleDecision = async () => {
    if (!selected || !decision) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const update: any = {
      status: decision, reason: reason || null,
      reviewed_at: new Date().toISOString(), reviewed_by: user?.id || null,
    };
    if (decision === 'ativo') {
      const months = Number(validity) || 12;
      const exp = new Date(); exp.setMonth(exp.getMonth() + months);
      update.expires_at = exp.toISOString();
    }
    await supabase.from('certificados').update(update).eq('id', selected.id);
    toast({ title: decision === 'ativo' ? 'Certificado aprovado!' : 'Certificado recusado' });
    setSaving(false); setAnalyzeOpen(false); setSelected(null); setDecision(''); setReason('');
    fetchCerts();
  };

  const pendentes = certs.filter(c => c.status === 'pendente');
  const counts = { pendente: pendentes.length, ativo: certs.filter(c => c.status === 'ativo').length, recusado: certs.filter(c => c.status === 'recusado').length, revogado: certs.filter(c => c.status === 'revogado').length };

  if (loading) return <div className="p-6 flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Award className="h-6 w-6 text-primary" /> Certificados</h1><p className="text-muted-foreground text-sm">Gestão de certificados de vendedores</p></div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Pendentes', count: counts.pendente, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Ativos', count: counts.ativo, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Recusados', count: counts.recusado, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Revogados', count: counts.revogado, icon: Ban, color: 'text-orange-400', bg: 'bg-orange-500/10' },
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
                    <div><p className="font-semibold">{c.user_name}</p><p className="text-xs text-muted-foreground">Solicitado em {new Date(c.requested_at).toLocaleDateString('pt-BR')}</p></div>
                    <Button variant="outline" size="sm" onClick={() => { setSelected(c); setAnalyzeOpen(true); }}><Eye className="h-4 w-4 mr-1" />Analisar</Button>
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
                <TableHeader><TableRow className="border-border">
                  <TableHead>Usuário</TableHead><TableHead className="text-center">Status</TableHead><TableHead>Solicitado</TableHead>
                  <TableHead>Revisado</TableHead><TableHead>Justificativa</TableHead><TableHead>Expira</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {certs.map(c => (
                    <TableRow key={c.id} className="border-border hover:bg-muted/30">
                      <TableCell className="font-medium text-sm">{c.user_name}</TableCell>
                      <TableCell className="text-center"><Badge className={certStatusColors[c.status]}>{certStatusLabels[c.status] || c.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(c.requested_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.reviewed_at ? new Date(c.reviewed_at).toLocaleDateString('pt-BR') : '—'}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{c.reason || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleDateString('pt-BR') : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={analyzeOpen} onOpenChange={o => { setAnalyzeOpen(o); if (!o) { setSelected(null); setDecision(''); setReason(''); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Analisar Solicitação</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Usuário</p><p className="font-semibold">{selected.user_name}</p><p className="text-xs text-muted-foreground mt-1">Solicitado em {new Date(selected.requested_at).toLocaleDateString('pt-BR')}</p></div>
              <div className="space-y-2"><Label>Decisão</Label>
                <Select value={decision} onValueChange={setDecision}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent><SelectItem value="ativo">Aprovar</SelectItem><SelectItem value="recusado">Recusar</SelectItem></SelectContent>
                </Select>
              </div>
              {decision === 'ativo' && (
                <div className="space-y-2"><Label>Validade</Label>
                  <Select value={validity} onValueChange={setValidity}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="6">6 meses</SelectItem><SelectItem value="12">1 ano</SelectItem></SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2"><Label>Justificativa</Label><Textarea placeholder="Motivo da decisão" rows={2} value={reason} onChange={e => setReason(e.target.value)} /></div>
              <Button className="w-full bg-primary text-primary-foreground" onClick={handleDecision} disabled={saving || !decision}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Confirmar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
