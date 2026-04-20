import { useEffect, useState } from 'react';
import { Settings, Store, Bell, Shield, Globe, Palette, Sun, Moon, User, Loader2, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/hooks/useTheme';
import { useDesktopAuth, POSITION_LABELS, POSITION_PERMISSIONS } from '@/hooks/useDesktopAuth';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function Configuracoes() {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, position } = useDesktopAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [seedingData, setSeedingData] = useState(false);
  const isAdmin = position === 'admin';

  // Settings hooks (persistem no banco)
  const storeInfo = useSiteSettings<{ name: string; email: string; phone: string; address: string; cnpj?: string }>('store_info');
  const salePolicies = useSiteSettings<{ pix_discount_percent: number; max_installments: number; auto_send_keys?: boolean; require_email_confirm?: boolean }>('sale_policies');
  const emailNotif = useSiteSettings<{ new_order: boolean; order_status_change: boolean; low_stock: boolean; new_user: boolean; new_report?: boolean; new_certificate?: boolean }>('email_notifications');
  const marketplace = useSiteSettings<{ allow_trades: boolean; require_certificate: boolean; manual_approval?: boolean; commission_percent?: number }>('marketplace');
  const security = useSiteSettings<{ session_timeout_minutes: number; require_2fa?: boolean; access_log?: boolean }>('security');

  // Local form state
  const [storeForm, setStoreForm] = useState({ name: '', email: '', phone: '', address: '', cnpj: '' });
  const [policiesForm, setPoliciesForm] = useState({ pix_discount_percent: 5, max_installments: 12, auto_send_keys: true, require_email_confirm: false });
  const [notifForm, setNotifForm] = useState({ new_order: true, order_status_change: true, low_stock: true, new_user: false, new_report: true, new_certificate: false });
  const [marketForm, setMarketForm] = useState({ allow_trades: true, require_certificate: true, manual_approval: false, commission_percent: 5 });
  const [secForm, setSecForm] = useState({ session_timeout_minutes: 60, require_2fa: false, access_log: true });

  useEffect(() => { if (storeInfo.value) setStoreForm({ name: '', email: '', phone: '', address: '', cnpj: '', ...storeInfo.value }); }, [storeInfo.value]);
  useEffect(() => { if (salePolicies.value) setPoliciesForm({ pix_discount_percent: 5, max_installments: 12, auto_send_keys: true, require_email_confirm: false, ...salePolicies.value }); }, [salePolicies.value]);
  useEffect(() => { if (emailNotif.value) setNotifForm({ new_order: true, order_status_change: true, low_stock: true, new_user: false, new_report: true, new_certificate: false, ...emailNotif.value }); }, [emailNotif.value]);
  useEffect(() => { if (marketplace.value) setMarketForm({ allow_trades: true, require_certificate: true, manual_approval: false, commission_percent: 5, ...marketplace.value }); }, [marketplace.value]);
  useEffect(() => { if (security.value) setSecForm({ session_timeout_minutes: 60, require_2fa: false, access_log: true, ...security.value }); }, [security.value]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('id', user.id);
    setSavingProfile(false);
    if (error) toast.error('Erro ao salvar perfil');
    else toast.success('Perfil atualizado!');
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) { toast.error('A senha deve ter no mínimo 6 caracteres'); return; }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) toast.error('Erro ao alterar senha');
    else { toast.success('Senha alterada com sucesso!'); setNewPassword(''); }
  };

  const positionLabel = position ? POSITION_LABELS[position] : 'N/A';
  const permissions = position ? POSITION_PERMISSIONS[position] : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Configurações
        </h1>
        <p className="text-muted-foreground text-sm">Configurações gerais do sistema e conta</p>
      </div>

      <Tabs defaultValue="conta">
        <TabsList className="flex-wrap">
          <TabsTrigger value="conta"><User className="h-4 w-4 mr-1" />Minha Conta</TabsTrigger>
          <TabsTrigger value="loja"><Store className="h-4 w-4 mr-1" />Loja</TabsTrigger>
          <TabsTrigger value="aparencia"><Palette className="h-4 w-4 mr-1" />Aparência</TabsTrigger>
          <TabsTrigger value="notificacoes"><Bell className="h-4 w-4 mr-1" />Notificações</TabsTrigger>
          <TabsTrigger value="seguranca"><Shield className="h-4 w-4 mr-1" />Segurança</TabsTrigger>
          <TabsTrigger value="marketplace"><Globe className="h-4 w-4 mr-1" />Marketplace</TabsTrigger>
        </TabsList>

        {/* Minha Conta */}
        <TabsContent value="conta" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Dados Pessoais</CardTitle>
              <CardDescription>Informações da sua conta de acesso ao backoffice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome de Exibição</Label>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value={user?.email || ''} disabled className="opacity-70" />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : 'Salvar Perfil'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Cargo e Permissões</CardTitle>
              <CardDescription>Seu nível de acesso no backoffice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm px-3 py-1">{positionLabel}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Seções com acesso:</p>
                <div className="flex flex-wrap gap-1.5">
                  {permissions.includes('*') ? (
                    <Badge className="bg-primary/20 text-primary text-xs">Acesso Total</Badge>
                  ) : (
                    permissions.map(p => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-base">Alterar Senha</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="max-w-sm space-y-2">
                <Label>Nova Senha</Label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <Button onClick={handleChangePassword} disabled={savingPassword || !newPassword}>
                {savingPassword ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Alterando...</> : 'Alterar Senha'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loja */}
        <TabsContent value="loja" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Informações da Loja</CardTitle>
              <CardDescription>Dados básicos exibidos no site e marketplace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {storeInfo.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Nome da Loja</Label><Input value={storeForm.name} onChange={e => setStoreForm({ ...storeForm, name: e.target.value })} /></div>
                    <div className="space-y-2"><Label>E-mail de Contato</Label><Input value={storeForm.email} onChange={e => setStoreForm({ ...storeForm, email: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Telefone</Label><Input value={storeForm.phone} onChange={e => setStoreForm({ ...storeForm, phone: e.target.value })} /></div>
                    <div className="space-y-2"><Label>CNPJ</Label><Input value={storeForm.cnpj} onChange={e => setStoreForm({ ...storeForm, cnpj: e.target.value })} /></div>
                  </div>
                  <Separator />
                  <div className="space-y-2"><Label>Endereço</Label><Input value={storeForm.address} onChange={e => setStoreForm({ ...storeForm, address: e.target.value })} /></div>
                  <Button onClick={() => storeInfo.save(storeForm)} disabled={storeInfo.saving}>
                    {storeInfo.saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar Alterações
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-base">Políticas de Venda</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Desconto Pix (%)</Label><Input type="number" value={policiesForm.pix_discount_percent} onChange={e => setPoliciesForm({ ...policiesForm, pix_discount_percent: Number(e.target.value) })} /></div>
                <div className="space-y-2"><Label>Parcelamento Máximo</Label><Input type="number" value={policiesForm.max_installments} onChange={e => setPoliciesForm({ ...policiesForm, max_installments: Number(e.target.value) })} /></div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Envio automático de chaves digitais</p><p className="text-xs text-muted-foreground">Chaves enviadas após confirmação de pagamento</p></div>
                <Switch checked={policiesForm.auto_send_keys} onCheckedChange={v => setPoliciesForm({ ...policiesForm, auto_send_keys: v })} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Exigir confirmação de e-mail</p><p className="text-xs text-muted-foreground">Bloqueia compras sem e-mail confirmado</p></div>
                <Switch checked={policiesForm.require_email_confirm} onCheckedChange={v => setPoliciesForm({ ...policiesForm, require_email_confirm: v })} />
              </div>
              <Button onClick={() => salePolicies.save(policiesForm)} disabled={salePolicies.saving}>
                {salePolicies.saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aparência */}
        <TabsContent value="aparencia" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Tema do Backoffice</CardTitle>
              <CardDescription>Escolha entre modo claro e escuro</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <button onClick={() => theme !== 'dark' && toggleTheme()} className={`flex-1 p-4 rounded-lg border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`}>
                  <Moon className="h-8 w-8 mx-auto mb-2 text-foreground" /><p className="text-sm font-medium text-center">Modo Escuro</p>
                </button>
                <button onClick={() => theme !== 'light' && toggleTheme()} className={`flex-1 p-4 rounded-lg border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`}>
                  <Sun className="h-8 w-8 mx-auto mb-2 text-foreground" /><p className="text-sm font-medium text-center">Modo Claro</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notificacoes" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Notificações por E-mail</CardTitle>
              <CardDescription>Configure quais eventos disparam e-mails para a equipe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'new_order' as const, title: 'Novo pedido recebido', desc: 'Receber e-mail a cada novo pedido' },
                { key: 'order_status_change' as const, title: 'Mudança de status', desc: 'Quando um pedido mudar de status' },
                { key: 'low_stock' as const, title: 'Estoque baixo', desc: 'Alertar quando produtos atingirem limite mínimo' },
                { key: 'new_report' as const, title: 'Nova denúncia', desc: 'Alertar sobre denúncias no marketplace' },
                { key: 'new_certificate' as const, title: 'Novo certificado solicitado', desc: 'Quando um usuário solicitar certificado' },
                { key: 'new_user' as const, title: 'Novo usuário cadastrado', desc: 'A cada novo cadastro na plataforma' },
              ].map((n, i, arr) => (
                <div key={n.key}>
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm font-medium">{n.title}</p><p className="text-xs text-muted-foreground">{n.desc}</p></div>
                    <Switch checked={Boolean(notifForm[n.key])} onCheckedChange={v => setNotifForm({ ...notifForm, [n.key]: v })} />
                  </div>
                  {i < arr.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
              <Button onClick={() => emailNotif.save(notifForm)} disabled={emailNotif.saving}>
                {emailNotif.saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar Preferências
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Segurança */}
        <TabsContent value="seguranca" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Controle de Acesso</CardTitle>
              <CardDescription>Gerencie permissões e sessões</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Exigir 2FA para administradores</p><p className="text-xs text-muted-foreground">Autenticação de dois fatores obrigatória</p></div>
                <Switch checked={secForm.require_2fa} onCheckedChange={v => setSecForm({ ...secForm, require_2fa: v })} />
              </div>
              <Separator />
              <div className="flex items-center gap-4">
                <div className="flex-1"><p className="text-sm font-medium">Tempo limite de sessão</p><p className="text-xs text-muted-foreground">Encerrar sessão após inatividade</p></div>
                <Input className="w-24 text-center" type="number" value={secForm.session_timeout_minutes} onChange={e => setSecForm({ ...secForm, session_timeout_minutes: Number(e.target.value) })} />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Log de acessos</p><p className="text-xs text-muted-foreground">Registrar todas as ações dos funcionários</p></div>
                <Switch checked={secForm.access_log} onCheckedChange={v => setSecForm({ ...secForm, access_log: v })} />
              </div>
              <Button onClick={() => security.save(secForm)} disabled={security.saving}>
                {security.saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketplace */}
        <TabsContent value="marketplace" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Marketplace Mobile</CardTitle>
              <CardDescription>Configurações do marketplace C2C</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Permitir trocas</p><p className="text-xs text-muted-foreground">Habilitar propostas de troca entre usuários</p></div>
                <Switch checked={marketForm.allow_trades} onCheckedChange={v => setMarketForm({ ...marketForm, allow_trades: v })} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Aprovação manual de anúncios</p><p className="text-xs text-muted-foreground">Anúncios precisam ser aprovados antes de aparecer</p></div>
                <Switch checked={marketForm.manual_approval} onCheckedChange={v => setMarketForm({ ...marketForm, manual_approval: v })} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div><p className="text-sm font-medium">Certificado de Proteção obrigatório</p><p className="text-xs text-muted-foreground">Exigir certificado para vendas C2C</p></div>
                <Switch checked={marketForm.require_certificate} onCheckedChange={v => setMarketForm({ ...marketForm, require_certificate: v })} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Comissão do marketplace (%)</Label>
                <Input className="w-32" type="number" value={marketForm.commission_percent} onChange={e => setMarketForm({ ...marketForm, commission_percent: Number(e.target.value) })} />
              </div>
              <Button onClick={() => marketplace.save(marketForm)} disabled={marketplace.saving}>
                {marketplace.saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
