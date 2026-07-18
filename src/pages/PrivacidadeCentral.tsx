// Central de Privacidade — inclui itens 91/92/93 (motivo de banimento, contestação, exclusão de conta).
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Bell, UserX, ArrowLeft, Eye, UserCheck, Lock, Download, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import PrivacyTab from '@/components/perfil/PrivacyTab';
import NotificationPrefsTab from '@/components/perfil/NotificationPrefsTab';
import BlockedUsersTab from '@/components/perfil/BlockedUsersTab';

export default function PrivacidadeCentral() {
  const { user, signOut } = useAuth();
  const [isPrivate, setIsPrivate] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [bannedUntil, setBannedUntil] = useState<string | null>(null);
  const [appealReason, setAppealReason] = useState<'nao_concordo' | 'conta_invadida'>('nao_concordo');
  const [appealText, setAppealText] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles')
      .select('is_private, require_follow_approval, ban_reason_public, banned_until')
      .eq('id', user.id).maybeSingle().then(({ data }) => {
        const d = data as any;
        if (d) {
          setIsPrivate(!!d.is_private);
          setRequireApproval(!!d.require_follow_approval);
          setBanReason(d.ban_reason_public || null);
          setBannedUntil(d.banned_until || null);
        }
        setLoaded(true);
      });
  }, [user?.id]);

  const saveToggle = async (field: 'is_private' | 'require_follow_approval', value: boolean) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ [field]: value } as any).eq('id', user.id);
    if (error) toast.error('Erro ao salvar'); else toast.success('Atualizado');
  };

  const exportData = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [prof, lib, aval, ped, msg] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('biblioteca_usuario').select('*').eq('user_id', user.id),
        supabase.from('avaliacoes').select('*').eq('user_id', user.id),
        supabase.from('pedidos').select('*, itens_pedido(*)').eq('user_id', user.id),
        supabase.from('mensagens').select('*').eq('sender_id', user.id),
      ]);
      const bundle = {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        profile: prof.data, library: lib.data, reviews: aval.data,
        orders: ped.data, messages_sent: msg.data,
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `midias-meus-dados-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Arquivo gerado — verifique seus downloads.');
    } catch {
      toast.error('Não foi possível gerar o arquivo agora.');
    } finally { setExporting(false); }
  };

  const submitAppeal = async () => {
    if (appealText.trim().length < 10) return toast.error('Descreva com pelo menos 10 caracteres.');
    setSubmittingAppeal(true);
    const { error } = await supabase.rpc('submit_ban_appeal' as any, {
      _reason: appealReason, _description: appealText,
    });
    setSubmittingAppeal(false);
    if (error) return toast.error(error.message);
    setAppealText('');
    toast.success('Contestação enviada — vamos analisar em breve.');
  };

  const deleteAccount = async () => {
    setDeleting(true);
    const { error } = await supabase.rpc('delete_my_account' as any);
    if (error) { setDeleting(false); return toast.error(error.message); }
    toast.success('Conta anonimizada. Sentimos sua saída.');
    await signOut();
  };

  const isBanned = bannedUntil && new Date(bannedUntil) > new Date();

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link to="/perfil" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4" /> Voltar ao perfil</Link>
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-2"><Shield className="h-6 w-6 text-primary" /> Privacidade e segurança</h1>
      <p className="text-sm text-muted-foreground mb-6">Tudo num só lugar: visibilidade do seu perfil, quem pode te seguir/mensagem, exceções e bloqueios.</p>

      {/* 91: motivo de banimento + 93: contestação */}
      {isBanned && (
        <section className="border border-destructive/50 bg-destructive/5 rounded-xl p-5 mb-6 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">Sua conta está suspensa até {new Date(bannedUntil!).toLocaleString('pt-BR')}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">Motivo:</span> {banReason || 'Não informado — entre em contato com o suporte.'}
              </p>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">Contestar penalidade</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Contestar suspensão</DialogTitle></DialogHeader>
              <RadioGroup value={appealReason} onValueChange={(v: any) => setAppealReason(v)} className="space-y-2">
                <div className="flex items-start gap-2 border border-border rounded-lg p-3">
                  <RadioGroupItem value="nao_concordo" id="r1" />
                  <div className="flex-1">
                    <Label htmlFor="r1" className="font-medium">Não concordo com a penalidade</Label>
                    <p className="text-xs text-muted-foreground">Você reconhece a ação, mas discorda da decisão da moderação.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 border border-border rounded-lg p-3">
                  <RadioGroupItem value="conta_invadida" id="r2" />
                  <div className="flex-1">
                    <Label htmlFor="r2" className="font-medium">Minha conta foi acessada por outra pessoa</Label>
                    <p className="text-xs text-muted-foreground">A ação penalizada não foi feita por você.</p>
                  </div>
                </div>
              </RadioGroup>
              <Textarea rows={5} value={appealText} onChange={e => setAppealText(e.target.value)} placeholder="Explique com o máximo de detalhe possível (mínimo 10 caracteres)." />
              <DialogFooter>
                <Button onClick={submitAppeal} disabled={submittingAppeal}>
                  {submittingAppeal && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Enviar contestação
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>
      )}

      {/* Toggles rápidos */}
      <section className="bg-card border border-border rounded-xl p-5 mb-6 space-y-4">
        <Row icon={<Lock className="h-4 w-4 text-primary" />} title="Perfil privado" desc="Oculta sua biblioteca e atividade para quem não é amigo mútuo.">
          <Switch checked={isPrivate} disabled={!loaded} onCheckedChange={v => { setIsPrivate(v); saveToggle('is_private', v); }} />
        </Row>
        <Row icon={<UserCheck className="h-4 w-4 text-accent" />} title="Aprovar novos seguidores" desc="Cada pedido para te seguir fica pendente até você aprovar (estilo Instagram).">
          <Switch checked={requireApproval} disabled={!loaded} onCheckedChange={v => { setRequireApproval(v); saveToggle('require_follow_approval', v); }} />
        </Row>
      </section>

      <section className="bg-card border border-border rounded-xl p-5 mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold flex items-center gap-1.5"><Download className="h-4 w-4 text-primary" /> Baixar meus dados</p>
          <p className="text-xs text-muted-foreground">Arquivo JSON com seu perfil, biblioteca, avaliações, pedidos e mensagens enviadas.</p>
        </div>
        <Button size="sm" variant="outline" onClick={exportData} disabled={exporting || !user}>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="h-4 w-4 mr-1" /> Exportar</>}
        </Button>
      </section>

      {/* 92: exclusão/anonimização */}
      <section className="bg-card border border-destructive/40 rounded-xl p-5 mb-6 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold flex items-center gap-1.5 text-destructive"><Trash2 className="h-4 w-4" /> Excluir minha conta</p>
          <p className="text-xs text-muted-foreground">Seu perfil (nome, e-mail, CPF, telefone) é anonimizado. Reviews e posts ficam com identificação "usuário removido".</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive" disabled={!user}>Excluir</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação anonimiza permanentemente seu perfil. Sua biblioteca, reviews e histórico permanecem, mas ligados a "usuário removido". Você será desconectado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={deleteAccount} disabled={deleting}>
                {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Sim, excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      <Tabs defaultValue="visibilidade">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="visibilidade"><Eye className="h-4 w-4 mr-1.5" />Visibilidade</TabsTrigger>
          <TabsTrigger value="notif"><Bell className="h-4 w-4 mr-1.5" />Notificações</TabsTrigger>
          <TabsTrigger value="bloq"><UserX className="h-4 w-4 mr-1.5" />Bloqueios</TabsTrigger>
        </TabsList>

        <TabsContent value="visibilidade" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-5"><PrivacyTab /></div>
        </TabsContent>
        <TabsContent value="notif" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-5"><NotificationPrefsTab /></div>
        </TabsContent>
        <TabsContent value="bloq" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-5"><BlockedUsersTab /></div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <div className="mt-0.5">{icon}</div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
