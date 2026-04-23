import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Ban, CheckCircle, Flag, Loader2, UserX, Eye, XCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type TargetType = 'anuncio' | 'forum_post' | 'profile' | 'usuario' | 'mensagem' | string;

interface Denuncia {
  id: string; target_type: TargetType; target_id: string; reporter_id: string;
  reason: string; description: string | null; status: string; created_at: string;
  reporter_name: string;
  target_label: string;
  target_author_id: string | null;
}

interface BannedUser {
  id: string; display_name: string | null; banned_until: string;
}

const targetTypeLabel = (t: TargetType) => {
  switch (t) {
    case 'anuncio': return 'Anúncio';
    case 'forum_post': return 'Post do Fórum';
    case 'profile':
    case 'usuario': return 'Usuário';
    case 'mensagem': return 'Mensagem';
    default: return t;
  }
};

const statusBadgeClass = (s: string) =>
  s === 'pending' ? 'bg-yellow-500/20 text-yellow-400'
  : s === 'resolved' ? 'bg-green-500/20 text-green-400'
  : 'bg-muted text-muted-foreground';

const statusLabel = (s: string) =>
  s === 'pending' ? 'Pendente' : s === 'resolved' ? 'Resolvida' : 'Improcedente';

export default function Moderacao() {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [banned, setBanned] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [banDialog, setBanDialog] = useState<{ open: boolean; userId: string | null; userName: string }>({ open: false, userId: null, userName: '' });
  const [banDays, setBanDays] = useState('7');
  const [detail, setDetail] = useState<Denuncia | null>(null);
  const [detailContent, setDetailContent] = useState<string>('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const { toast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: denData }, { data: bannedData }] = await Promise.all([
      supabase.from('denuncias').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, display_name, banned_until').not('banned_until', 'is', null),
    ]);

    if (denData) {
      const reporterIds = [...new Set(denData.map(d => d.reporter_id))];

      // Group target IDs by type for bulk lookups
      const anuncioIds = denData.filter(d => d.target_type === 'anuncio').map(d => d.target_id);
      const forumIds = denData.filter(d => d.target_type === 'forum_post').map(d => d.target_id);
      const profileIds = denData.filter(d => d.target_type === 'profile' || d.target_type === 'usuario').map(d => d.target_id);
      const mensagemIds = denData.filter(d => d.target_type === 'mensagem').map(d => d.target_id);

      const allProfileIds = [...new Set([...reporterIds, ...profileIds])];

      const [profilesRes, anunciosRes, forumRes, mensagensRes] = await Promise.all([
        supabase.from('profiles').select('id, display_name').in('id', allProfileIds),
        anuncioIds.length ? supabase.from('anuncios').select('id, title, seller_id').in('id', anuncioIds) : Promise.resolve({ data: [] }),
        forumIds.length ? supabase.from('forum_posts').select('id, content, user_id').in('id', forumIds) : Promise.resolve({ data: [] }),
        mensagemIds.length ? supabase.from('mensagens').select('id, content, sender_id').in('id', mensagemIds) : Promise.resolve({ data: [] }),
      ]);

      const profileMap = new Map<string, string>(profilesRes.data?.map(p => [p.id, p.display_name || 'Usuário']) || []);
      const anuncioMap = new Map<string, { title: string; seller_id: string }>(anunciosRes.data?.map((a: { id: string; title: string; seller_id: string }) => [a.id, { title: a.title, seller_id: a.seller_id }] as [string, { title: string; seller_id: string }]) || []);
      const forumMap = new Map<string, { content: string; user_id: string }>(forumRes.data?.map((f: { id: string; content: string; user_id: string }) => [f.id, { content: f.content, user_id: f.user_id }] as [string, { content: string; user_id: string }]) || []);
      const mensagemMap = new Map<string, { content: string; sender_id: string }>(mensagensRes.data?.map((m: { id: string; content: string; sender_id: string }) => [m.id, { content: m.content, sender_id: m.sender_id }] as [string, { content: string; sender_id: string }]) || []);

      setDenuncias(denData.map(d => {
        let target_label = d.target_id.slice(0, 8);
        let target_author_id: string | null = null;
        if (d.target_type === 'anuncio') {
          const a = anuncioMap.get(d.target_id);
          target_label = a?.title || target_label;
          target_author_id = a?.seller_id || null;
        } else if (d.target_type === 'forum_post') {
          const f = forumMap.get(d.target_id);
          target_label = f?.content?.slice(0, 60) || target_label;
          target_author_id = f?.user_id || null;
        } else if (d.target_type === 'profile' || d.target_type === 'usuario') {
          target_label = profileMap.get(d.target_id) || target_label;
          target_author_id = d.target_id;
        } else if (d.target_type === 'mensagem') {
          const m = mensagemMap.get(d.target_id);
          target_label = m?.content?.slice(0, 60) || target_label;
          target_author_id = m?.sender_id || null;
        }
        return {
          ...d,
          reporter_name: profileMap.get(d.reporter_id) || 'Usuário',
          target_label,
          target_author_id,
        };
      }));
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
    toast({ title: 'Denúncia resolvida' });
    setDetail(null);
    fetchAll();
  };

  const handleDismiss = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('denuncias').update({ status: 'dismissed', resolved_at: new Date().toISOString(), resolved_by: user?.id || null }).eq('id', id);
    toast({ title: 'Denúncia marcada como improcedente' });
    setDetail(null);
    fetchAll();
  };

  const openBanDialog = (userId: string | null, label: string) => {
    if (!userId) {
      toast({ title: 'Não foi possível identificar o autor', variant: 'destructive' });
      return;
    }
    setBanDialog({ open: true, userId, userName: label });
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
    setDetail(null);
    fetchAll();
  };

  const handleUnban = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ banned_until: null }).eq('id', userId);
    if (error) { toast({ title: 'Erro ao desbanir', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Usuário desbanido' });
    fetchAll();
  };

  const openDetail = async (d: Denuncia) => {
    setDetail(d);
    setDetailContent('');
    setLoadingDetail(true);
    try {
      if (d.target_type === 'anuncio') {
        const { data } = await supabase.from('anuncios').select('title, description, price, status').eq('id', d.target_id).maybeSingle();
        setDetailContent(data ? `${data.title}\n\n${data.description || '(sem descrição)'}\n\nPreço: R$ ${Number(data.price).toFixed(2)} • Status: ${data.status}` : 'Anúncio removido ou não encontrado.');
      } else if (d.target_type === 'forum_post') {
        const { data } = await supabase.from('forum_posts').select('content, created_at').eq('id', d.target_id).maybeSingle();
        setDetailContent(data?.content || 'Post removido ou não encontrado.');
      } else if (d.target_type === 'profile' || d.target_type === 'usuario') {
        const { data } = await supabase.from('profiles').select('display_name, bio, banned_until').eq('id', d.target_id).maybeSingle();
        setDetailContent(data ? `${data.display_name || 'Sem nome'}\n\n${data.bio || '(sem bio)'}${data.banned_until ? `\n\n⛔ Banido até ${new Date(data.banned_until).toLocaleString('pt-BR')}` : ''}` : 'Perfil não encontrado.');
      } else if (d.target_type === 'mensagem') {
        const { data } = await supabase.from('mensagens').select('content, created_at').eq('id', d.target_id).maybeSingle();
        setDetailContent(data?.content || 'Mensagem removida ou não encontrada.');
      } else {
        setDetailContent(`Tipo desconhecido: ${d.target_type}`);
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const pendentes = denuncias.filter(d => d.status === 'pending');
  const resolvidas = denuncias.filter(d => d.status === 'resolved');
  const improcedentes = denuncias.filter(d => d.status === 'dismissed');

  if (loading) return <div className="p-6 flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /> Moderação</h1><p className="text-muted-foreground text-sm">Denúncias e gestão de usuários</p></div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Pendentes', value: pendentes.length, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Resolvidas', value: resolvidas.length, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Improcedentes', value: improcedentes.length, icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted/30' },
          { label: 'Banidos', value: banned.length, icon: UserX, color: 'text-red-400', bg: 'bg-red-500/10' },
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
          <TabsTrigger value="denuncias"><Flag className="h-4 w-4 mr-1" />Denúncias ({denuncias.length})</TabsTrigger>
          <TabsTrigger value="banidos"><UserX className="h-4 w-4 mr-1" />Usuários Banidos ({banned.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="denuncias" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="border-border">
                  <TableHead>Tipo</TableHead><TableHead>Conteúdo denunciado</TableHead><TableHead>Reportado por</TableHead>
                  <TableHead>Motivo</TableHead><TableHead className="text-center">Status</TableHead>
                  <TableHead>Data</TableHead><TableHead className="text-center w-32">Ações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {denuncias.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma denúncia</TableCell></TableRow>
                  ) : denuncias.map(d => (
                    <TableRow key={d.id} className="border-border hover:bg-muted/30">
                      <TableCell><Badge variant="outline" className="text-xs">{targetTypeLabel(d.target_type)}</Badge></TableCell>
                      <TableCell className="text-sm max-w-[260px] truncate font-medium">{d.target_label}</TableCell>
                      <TableCell className="text-sm">{d.reporter_name}</TableCell>
                      <TableCell className="text-sm max-w-[180px] truncate">{d.reason}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={statusBadgeClass(d.status)}>{statusLabel(d.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(d.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openDetail(d)}>
                          <Eye className="h-3 w-3 mr-1" />Detalhes
                        </Button>
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

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={o => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" /> Detalhes da denúncia
            </DialogTitle>
            <DialogDescription>
              Reportada por <span className="font-medium text-foreground">{detail?.reporter_name}</span> em {detail && new Date(detail.created_at).toLocaleString('pt-BR')}
            </DialogDescription>
          </DialogHeader>

          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Tipo do alvo</Label>
                  <p className="font-medium">{targetTypeLabel(detail.target_type)}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <p><Badge className={statusBadgeClass(detail.status)}>{statusLabel(detail.status)}</Badge></p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Motivo</Label>
                <p className="text-sm">{detail.reason}</p>
              </div>

              {detail.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Descrição da denúncia</Label>
                  <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded-md p-3 border border-border">{detail.description}</p>
                </div>
              )}

              <Separator />

              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                  Conteúdo reportado
                  {loadingDetail && <Loader2 className="h-3 w-3 animate-spin" />}
                </Label>
                <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded-md p-3 border border-border max-h-48 overflow-y-auto">
                  {loadingDetail ? 'Carregando...' : (detailContent || '(vazio)')}
                </p>
              </div>

              {detail.status === 'pending' && (
                <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => handleDismiss(detail.id)}>
                    <XCircle className="h-4 w-4 mr-1" />Improcedente
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleResolve(detail.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" />Resolver
                  </Button>
                  {detail.target_author_id && (
                    <Button
                      size="sm"
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => openBanDialog(detail.target_author_id, detail.target_label)}
                    >
                      <Ban className="h-4 w-4 mr-1" />Banir autor
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban dialog */}
      <Dialog open={banDialog.open} onOpenChange={o => !o && setBanDialog({ open: false, userId: null, userName: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banir usuário temporariamente</DialogTitle>
            <DialogDescription>{banDialog.userName && <>Alvo: <span className="font-medium text-foreground">{banDialog.userName}</span></>}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Duração do banimento (dias)</Label>
              <Input type="number" min="1" value={banDays} onChange={e => setBanDays(e.target.value)} />
              <p className="text-xs text-muted-foreground">O usuário não poderá publicar anúncios, comentar ou interagir até a data definida.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setBanDialog({ open: false, userId: null, userName: '' })}>Cancelar</Button>
              <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmBan}>
                <Ban className="h-4 w-4 mr-2" />Confirmar Banimento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
