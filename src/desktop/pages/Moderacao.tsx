import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Ban, CheckCircle, Flag, Loader2, UserX, Eye, XCircle, History, Trash2, Infinity as InfinityIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type TargetType = 'anuncio' | 'forum_post' | 'profile' | 'usuario' | 'mensagem'
  | 'reviews_completas' | 'game_opinions' | 'game_screenshots' | 'game_clips' | 'avaliacoes'
  | 'forum_replies' | string;

interface Denuncia {
  id: string; target_type: TargetType; target_id: string; reporter_id: string;
  reason: string; description: string | null; status: string; created_at: string;
  reporter_name: string;
  target_label: string;
  target_author_id: string | null;
}

interface BannedUser { id: string; display_name: string | null; banned_until: string }
interface HistoryRow {
  id: string; target_user_id: string; moderator_id: string; action: string;
  duration_days: number | null; reason: string | null; reference_type: string | null;
  reference_id: string | null; created_at: string;
  target_name: string; moderator_name: string;
}

// Config de tipos denunciáveis: qual tabela consultar, campo de título, autor e preview
const TARGET_CONFIG: Record<string, { label: string; table: string; select: string; titleField: string; authorField: string; canDelete: boolean }> = {
  anuncio:            { label: 'Anúncio',        table: 'anuncios',           select: 'title, description, price, status, seller_id', titleField: 'title',   authorField: 'seller_id', canDelete: true },
  forum_post:         { label: 'Post do Fórum',  table: 'forum_posts',        select: 'title, content, user_id',                        titleField: 'title',   authorField: 'user_id',   canDelete: true },
  forum_replies:      { label: 'Resposta Fórum', table: 'forum_replies',      select: 'content, user_id',                               titleField: 'content', authorField: 'user_id',   canDelete: true },
  profile:            { label: 'Usuário',        table: 'profiles',           select: 'display_name, bio, banned_until',                titleField: 'display_name', authorField: 'id',   canDelete: false },
  usuario:            { label: 'Usuário',        table: 'profiles',           select: 'display_name, bio, banned_until',                titleField: 'display_name', authorField: 'id',   canDelete: false },
  mensagem:           { label: 'Mensagem',       table: 'mensagens',          select: 'content, sender_id',                             titleField: 'content', authorField: 'sender_id', canDelete: true },
  reviews_completas:  { label: 'Review Longa',   table: 'reviews_completas',  select: 'title, content, user_id',                        titleField: 'title',   authorField: 'user_id',   canDelete: true },
  avaliacoes:         { label: 'Avaliação',      table: 'avaliacoes',         select: 'comment, rating, user_id',                       titleField: 'comment', authorField: 'user_id',   canDelete: true },
  game_opinions:      { label: 'Opinião',        table: 'game_opinions',      select: 'text, user_id',                                  titleField: 'text',    authorField: 'user_id',   canDelete: true },
  game_screenshots:   { label: 'Screenshot',     table: 'game_screenshots',   select: 'caption, user_id',                               titleField: 'caption', authorField: 'user_id',   canDelete: true },
  game_clips:         { label: 'Clip',           table: 'game_clips',         select: 'title, user_id',                                 titleField: 'title',   authorField: 'user_id',   canDelete: true },
};

const targetTypeLabel = (t: TargetType) => TARGET_CONFIG[t]?.label || t;

const statusBadgeClass = (s: string) =>
  s === 'pending' ? 'bg-yellow-500/20 text-yellow-400'
  : s === 'resolved' ? 'bg-green-500/20 text-green-400'
  : 'bg-muted text-muted-foreground';

const statusLabel = (s: string) =>
  s === 'pending' ? 'Pendente' : s === 'resolved' ? 'Resolvida' : 'Improcedente';

const actionLabel = (a: string) => ({
  ban_temp: 'Ban temporário', ban_permanent: 'Ban permanente', unban: 'Desbanido',
  delete_content: 'Conteúdo removido', warning: 'Advertência', dismiss: 'Improcedente', resolve: 'Resolvida',
} as Record<string, string>)[a] || a;

const actionColor = (a: string) =>
  a === 'ban_permanent' ? 'bg-red-500/20 text-red-400'
  : a === 'ban_temp' ? 'bg-orange-500/20 text-orange-400'
  : a === 'unban' ? 'bg-green-500/20 text-green-400'
  : a === 'delete_content' ? 'bg-purple-500/20 text-purple-400'
  : 'bg-muted text-muted-foreground';

const PERMANENT_BAN_DATE = '2999-12-31T23:59:59Z';

export default function Moderacao() {
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [banned, setBanned] = useState<BannedUser[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [banDialog, setBanDialog] = useState<{ open: boolean; userId: string | null; userName: string; permanent: boolean }>({ open: false, userId: null, userName: '', permanent: false });
  const [banDays, setBanDays] = useState('7');
  const [banReason, setBanReason] = useState('');
  const [detail, setDetail] = useState<Denuncia | null>(null);
  const [detailContent, setDetailContent] = useState<string>('');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const { toast } = useToast();

  const logModeration = async (target_user_id: string, action: string, opts: { duration_days?: number | null; reason?: string | null; reference_type?: string | null; reference_id?: string | null } = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase.from('moderation_history' as any) as any).insert({
      target_user_id, moderator_id: user.id, action,
      duration_days: opts.duration_days ?? null, reason: opts.reason ?? null,
      reference_type: opts.reference_type ?? null, reference_id: opts.reference_id ?? null,
    });
    // notify user
    await supabase.from('notifications').insert({
      user_id: target_user_id, type: 'nova_mensagem',
      title: action === 'ban_permanent' ? 'Sua conta foi banida permanentemente'
        : action === 'ban_temp' ? `Você foi banido por ${opts.duration_days} dias`
        : action === 'unban' ? 'Seu banimento foi removido'
        : action === 'delete_content' ? 'Conteúdo seu foi removido' : 'Ação de moderação',
      body: opts.reason || null,
      reference_type: 'moderacao',
    });
  };

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: denData }, { data: bannedData }, { data: histData }] = await Promise.all([
      supabase.from('denuncias').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, display_name, banned_until').not('banned_until', 'is', null),
      (supabase.from('moderation_history' as any) as any).select('*').order('created_at', { ascending: false }).limit(200),
    ]);

    if (denData) {
      const reporterIds = [...new Set(denData.map(d => d.reporter_id))];
      const anuncioIds = denData.filter(d => d.target_type === 'anuncio').map(d => d.target_id);
      const forumIds = denData.filter(d => d.target_type === 'forum_post').map(d => d.target_id);
      const profileIds = denData.filter(d => d.target_type === 'profile' || d.target_type === 'usuario').map(d => d.target_id);
      const mensagemIds = denData.filter(d => d.target_type === 'mensagem').map(d => d.target_id);
      const allProfileIds = [...new Set([...reporterIds, ...profileIds])];

      const [profilesRes, anunciosRes, forumRes, mensagensRes] = await Promise.all([
        allProfileIds.length ? supabase.from('profiles').select('id, display_name').in('id', allProfileIds) : Promise.resolve({ data: [] as any[] }),
        anuncioIds.length ? supabase.from('anuncios').select('id, title, seller_id').in('id', anuncioIds) : Promise.resolve({ data: [] as any[] }),
        forumIds.length ? supabase.from('forum_posts').select('id, content, user_id').in('id', forumIds) : Promise.resolve({ data: [] as any[] }),
        mensagemIds.length ? supabase.from('mensagens').select('id, content, sender_id').in('id', mensagemIds) : Promise.resolve({ data: [] as any[] }),
      ]);

      const profileMap = new Map<string, string>((profilesRes.data || []).map((p: any) => [p.id, p.display_name || 'Usuário']));
      const anuncioMap = new Map<string, any>((anunciosRes.data || []).map((a: any) => [a.id, a]));
      const forumMap = new Map<string, any>((forumRes.data || []).map((f: any) => [f.id, f]));
      const mensagemMap = new Map<string, any>((mensagensRes.data || []).map((m: any) => [m.id, m]));

      setDenuncias(denData.map(d => {
        let target_label = d.target_id.slice(0, 8);
        let target_author_id: string | null = null;
        if (d.target_type === 'anuncio') { const a = anuncioMap.get(d.target_id); target_label = a?.title || target_label; target_author_id = a?.seller_id || null; }
        else if (d.target_type === 'forum_post') { const f = forumMap.get(d.target_id); target_label = f?.content?.slice(0, 60) || target_label; target_author_id = f?.user_id || null; }
        else if (d.target_type === 'profile' || d.target_type === 'usuario') { target_label = profileMap.get(d.target_id) || target_label; target_author_id = d.target_id; }
        else if (d.target_type === 'mensagem') { const m = mensagemMap.get(d.target_id); target_label = m?.content?.slice(0, 60) || target_label; target_author_id = m?.sender_id || null; }
        return { ...d, reporter_name: profileMap.get(d.reporter_id) || 'Usuário', target_label, target_author_id };
      }));
    }

    if (bannedData) setBanned(bannedData.filter(b => b.banned_until && new Date(b.banned_until) > new Date()) as BannedUser[]);

    if (histData?.length) {
      const ids = new Set<string>();
      (histData as any[]).forEach((h: any) => { ids.add(h.target_user_id); ids.add(h.moderator_id); });
      const { data: profs } = ids.size ? await supabase.from('profiles').select('id, display_name').in('id', [...ids]) : { data: [] as any[] };
      const m = new Map<string, string>((profs || []).map((p: any) => [p.id, p.display_name || 'Usuário']));
      setHistory((histData as any[]).map((h: any) => ({ ...h, target_name: m.get(h.target_user_id) || '—', moderator_name: m.get(h.moderator_id) || '—' })));
    } else setHistory([]);

    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleResolve = async (d: Denuncia) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('denuncias').update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: user?.id || null }).eq('id', d.id);
    toast({ title: 'Denúncia resolvida' });
    setDetail(null); fetchAll();
  };

  const handleDismiss = async (d: Denuncia) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('denuncias').update({ status: 'dismissed', resolved_at: new Date().toISOString(), resolved_by: user?.id || null }).eq('id', d.id);
    toast({ title: 'Denúncia marcada como improcedente' });
    setDetail(null); fetchAll();
  };

  const handleDeleteContent = async (d: Denuncia) => {
    if (!confirm('Tem certeza? Esta ação é irreversível.')) return;
    let ok = false;
    if (d.target_type === 'anuncio') { const r = await supabase.from('anuncios').delete().eq('id', d.target_id); ok = !r.error; }
    else if (d.target_type === 'forum_post') { const r = await supabase.from('forum_posts').delete().eq('id', d.target_id); ok = !r.error; }
    else if (d.target_type === 'mensagem') { const r = await supabase.from('mensagens').delete().eq('id', d.target_id); ok = !r.error; }
    if (!ok) { toast({ title: 'Erro ao remover conteúdo', variant: 'destructive' }); return; }
    if (d.target_author_id) await logModeration(d.target_author_id, 'delete_content', { reason: d.reason, reference_type: d.target_type, reference_id: d.target_id });
    await handleResolve(d);
    toast({ title: 'Conteúdo removido' });
  };

  const openBanDialog = (userId: string | null, label: string, permanent = false) => {
    if (!userId) { toast({ title: 'Não foi possível identificar o autor', variant: 'destructive' }); return; }
    setBanDialog({ open: true, userId, userName: label, permanent });
    setBanDays('7'); setBanReason(detail?.reason || '');
  };

  const confirmBan = async () => {
    if (!banDialog.userId) return;
    let until: string;
    let days: number | null = null;
    if (banDialog.permanent) until = PERMANENT_BAN_DATE;
    else {
      days = Number(banDays);
      if (!days || days < 1) { toast({ title: 'Informe um número válido de dias', variant: 'destructive' }); return; }
      until = new Date(Date.now() + days * 86400000).toISOString();
    }
    const { error } = await supabase.from('profiles').update({ banned_until: until }).eq('id', banDialog.userId);
    if (error) { toast({ title: 'Erro ao banir', description: error.message, variant: 'destructive' }); return; }
    await logModeration(banDialog.userId, banDialog.permanent ? 'ban_permanent' : 'ban_temp', { duration_days: days, reason: banReason || null });
    toast({ title: banDialog.permanent ? 'Usuário banido permanentemente' : `Usuário banido por ${days} dias` });
    setBanDialog({ open: false, userId: null, userName: '', permanent: false }); setBanReason('');
    setDetail(null); fetchAll();
  };

  const handleUnban = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ banned_until: null }).eq('id', userId);
    if (error) { toast({ title: 'Erro ao desbanir', description: error.message, variant: 'destructive' }); return; }
    await logModeration(userId, 'unban', {});
    toast({ title: 'Usuário desbanido' });
    fetchAll();
  };

  const openDetail = async (d: Denuncia) => {
    setDetail(d); setDetailContent(''); setLoadingDetail(true);
    try {
      if (d.target_type === 'anuncio') {
        const { data } = await supabase.from('anuncios').select('title, description, price, status').eq('id', d.target_id).maybeSingle();
        setDetailContent(data ? `${data.title}\n\n${data.description || '(sem descrição)'}\n\nPreço: R$ ${Number(data.price).toFixed(2)} • Status: ${data.status}` : 'Anúncio removido ou não encontrado.');
      } else if (d.target_type === 'forum_post') {
        const { data } = await supabase.from('forum_posts').select('content').eq('id', d.target_id).maybeSingle();
        setDetailContent(data?.content || 'Post removido ou não encontrado.');
      } else if (d.target_type === 'profile' || d.target_type === 'usuario') {
        const { data } = await supabase.from('profiles').select('display_name, bio, banned_until').eq('id', d.target_id).maybeSingle();
        setDetailContent(data ? `${data.display_name || 'Sem nome'}\n\n${data.bio || '(sem bio)'}${data.banned_until ? `\n\n⛔ Banido até ${new Date(data.banned_until).toLocaleString('pt-BR')}` : ''}` : 'Perfil não encontrado.');
      } else if (d.target_type === 'mensagem') {
        const { data } = await supabase.from('mensagens').select('content').eq('id', d.target_id).maybeSingle();
        setDetailContent(data?.content || 'Mensagem removida ou não encontrada.');
      } else setDetailContent(`Tipo desconhecido: ${d.target_type}`);
    } finally { setLoadingDetail(false); }
  };

  const pendentes = denuncias.filter(d => d.status === 'pending');
  const resolvidas = denuncias.filter(d => d.status === 'resolved');
  const improcedentes = denuncias.filter(d => d.status === 'dismissed');
  const permanentBans = banned.filter(b => new Date(b.banned_until) > new Date('2900-01-01'));

  if (loading) return <div className="p-6 flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /> Moderação</h1><p className="text-muted-foreground text-sm">Denúncias, banimentos e histórico de ações</p></div>

      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Pendentes', value: pendentes.length, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
          { label: 'Resolvidas', value: resolvidas.length, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
          { label: 'Improcedentes', value: improcedentes.length, icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted/30' },
          { label: 'Banidos', value: banned.length, icon: UserX, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Permanentes', value: permanentBans.length, icon: InfinityIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
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
          <TabsTrigger value="banidos"><UserX className="h-4 w-4 mr-1" />Banidos ({banned.length})</TabsTrigger>
          <TabsTrigger value="historico"><History className="h-4 w-4 mr-1" />Histórico ({history.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="denuncias" className="mt-4">
          <Card className="border-border/50"><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="border-border">
                <TableHead>Tipo</TableHead><TableHead>Conteúdo</TableHead><TableHead>Reporter</TableHead>
                <TableHead>Motivo</TableHead><TableHead className="text-center">Status</TableHead>
                <TableHead>Data</TableHead><TableHead className="text-center w-32">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {denuncias.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhuma denúncia</TableCell></TableRow> :
                  denuncias.map(d => (
                    <TableRow key={d.id} className="border-border hover:bg-muted/30">
                      <TableCell><Badge variant="outline" className="text-xs">{targetTypeLabel(d.target_type)}</Badge></TableCell>
                      <TableCell className="text-sm max-w-[240px] truncate font-medium">{d.target_label}</TableCell>
                      <TableCell className="text-sm">{d.reporter_name}</TableCell>
                      <TableCell className="text-sm max-w-[160px] truncate">{d.reason}</TableCell>
                      <TableCell className="text-center"><Badge className={statusBadgeClass(d.status)}>{statusLabel(d.status)}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(d.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-center"><Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openDetail(d)}><Eye className="h-3 w-3 mr-1" />Detalhes</Button></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="banidos" className="mt-4">
          <Card className="border-border/50"><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="border-border">
                <TableHead>Usuário</TableHead><TableHead>Banido até</TableHead><TableHead>Tipo</TableHead><TableHead className="text-center w-32">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {banned.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum usuário banido</TableCell></TableRow> :
                  banned.map(b => {
                    const isPerm = new Date(b.banned_until) > new Date('2900-01-01');
                    return (
                      <TableRow key={b.id} className="border-border hover:bg-muted/30">
                        <TableCell className="text-sm font-medium">{b.display_name || 'Sem nome'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{isPerm ? '∞ Permanente' : new Date(b.banned_until).toLocaleString('pt-BR')}</TableCell>
                        <TableCell><Badge className={isPerm ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}>{isPerm ? 'Permanente' : 'Temporário'}</Badge></TableCell>
                        <TableCell className="text-center"><Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => handleUnban(b.id)}><CheckCircle className="h-3 w-3 mr-1" />Desbanir</Button></TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <Card className="border-border/50"><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow className="border-border">
                <TableHead>Data</TableHead><TableHead>Ação</TableHead><TableHead>Usuário alvo</TableHead>
                <TableHead>Moderador</TableHead><TableHead>Duração</TableHead><TableHead>Motivo</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {history.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma ação registrada</TableCell></TableRow> :
                  history.map(h => (
                    <TableRow key={h.id} className="border-border hover:bg-muted/30">
                      <TableCell className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString('pt-BR')}</TableCell>
                      <TableCell><Badge className={actionColor(h.action)}>{actionLabel(h.action)}</Badge></TableCell>
                      <TableCell className="text-sm font-medium">{h.target_name}</TableCell>
                      <TableCell className="text-sm">{h.moderator_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{h.duration_days ? `${h.duration_days} dias` : (h.action === 'ban_permanent' ? '∞' : '—')}</TableCell>
                      <TableCell className="text-sm max-w-[260px] truncate text-muted-foreground">{h.reason || '—'}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={o => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Flag className="h-5 w-5 text-primary" /> Detalhes da denúncia</DialogTitle>
            <DialogDescription>Reportada por <span className="font-medium text-foreground">{detail?.reporter_name}</span> em {detail && new Date(detail.created_at).toLocaleString('pt-BR')}</DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><Label className="text-xs text-muted-foreground">Tipo do alvo</Label><p className="font-medium">{targetTypeLabel(detail.target_type)}</p></div>
                <div><Label className="text-xs text-muted-foreground">Status</Label><p><Badge className={statusBadgeClass(detail.status)}>{statusLabel(detail.status)}</Badge></p></div>
              </div>
              <div><Label className="text-xs text-muted-foreground">Motivo</Label><p className="text-sm">{detail.reason}</p></div>
              {detail.description && <div><Label className="text-xs text-muted-foreground">Descrição da denúncia</Label><p className="text-sm whitespace-pre-wrap bg-muted/30 rounded-md p-3 border border-border">{detail.description}</p></div>}
              <Separator />
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-2">Conteúdo reportado {loadingDetail && <Loader2 className="h-3 w-3 animate-spin" />}</Label>
                <p className="text-sm whitespace-pre-wrap bg-muted/30 rounded-md p-3 border border-border max-h-48 overflow-y-auto">{loadingDetail ? 'Carregando...' : (detailContent || '(vazio)')}</p>
              </div>
              {detail.status === 'pending' && (
                <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => handleDismiss(detail)}><XCircle className="h-4 w-4 mr-1" />Improcedente</Button>
                  <Button variant="outline" size="sm" onClick={() => handleResolve(detail)}><CheckCircle className="h-4 w-4 mr-1" />Resolver</Button>
                  {detail.target_type !== 'profile' && detail.target_type !== 'usuario' && (
                    <Button variant="outline" size="sm" className="text-purple-400 hover:text-purple-300" onClick={() => handleDeleteContent(detail)}><Trash2 className="h-4 w-4 mr-1" />Remover conteúdo</Button>
                  )}
                  {detail.target_author_id && (
                    <>
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => openBanDialog(detail.target_author_id, detail.target_label, false)}><Ban className="h-4 w-4 mr-1" />Banir temp.</Button>
                      <Button size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => openBanDialog(detail.target_author_id, detail.target_label, true)}><InfinityIcon className="h-4 w-4 mr-1" />Banir permanente</Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ban dialog */}
      <Dialog open={banDialog.open} onOpenChange={o => !o && setBanDialog({ open: false, userId: null, userName: '', permanent: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{banDialog.permanent ? 'Banir permanentemente' : 'Banir temporariamente'}</DialogTitle>
            <DialogDescription>{banDialog.userName && <>Alvo: <span className="font-medium text-foreground">{banDialog.userName}</span></>}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!banDialog.permanent && (
              <div className="space-y-2">
                <Label>Duração (dias)</Label>
                <Input type="number" min="1" value={banDays} onChange={e => setBanDays(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Motivo (visível ao usuário)</Label>
              <Textarea value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Ex: Conteúdo ofensivo recorrente..." rows={3} />
            </div>
            <p className="text-xs text-muted-foreground">{banDialog.permanent ? 'O usuário será impedido de interagir indefinidamente. Esta ação pode ser revertida em "Banidos → Desbanir".' : 'O usuário não poderá publicar anúncios, comentar ou interagir até a data definida.'}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setBanDialog({ open: false, userId: null, userName: '', permanent: false })}>Cancelar</Button>
              <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmBan}>
                <Ban className="h-4 w-4 mr-2" />{banDialog.permanent ? 'Banir permanente' : 'Confirmar banimento'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
