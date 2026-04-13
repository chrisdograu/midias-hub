import { Settings, Store, Users, Bell, Shield, Globe, Palette, Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

export default function Configuracoes() {
  const { theme, toggleTheme } = useTheme();

  const handleSave = () => toast.success('Configurações salvas com sucesso!');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Configurações
        </h1>
        <p className="text-muted-foreground text-sm">Configurações gerais do sistema</p>
      </div>

      <Tabs defaultValue="loja">
        <TabsList>
          <TabsTrigger value="loja"><Store className="h-4 w-4 mr-1" />Loja</TabsTrigger>
          <TabsTrigger value="aparencia"><Palette className="h-4 w-4 mr-1" />Aparência</TabsTrigger>
          <TabsTrigger value="notificacoes"><Bell className="h-4 w-4 mr-1" />Notificações</TabsTrigger>
          <TabsTrigger value="seguranca"><Shield className="h-4 w-4 mr-1" />Segurança</TabsTrigger>
          <TabsTrigger value="marketplace"><Globe className="h-4 w-4 mr-1" />Marketplace</TabsTrigger>
        </TabsList>

        {/* Loja */}
        <TabsContent value="loja" className="mt-4 space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Informações da Loja</CardTitle>
              <CardDescription>Dados básicos da loja exibidos no site e marketplace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome da Loja</Label>
                  <Input defaultValue="MIDIAS" />
                </div>
                <div className="space-y-2">
                  <Label>E-mail de Contato</Label>
                  <Input defaultValue="contato@midias.com.br" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input defaultValue="(11) 99999-0000" />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input defaultValue="12.345.678/0001-99" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Endereço da Loja Física</Label>
                <Input defaultValue="Rua dos Jogos, 123 - São Paulo, SP" />
              </div>
              <Button onClick={handleSave}>Salvar Alterações</Button>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Políticas de Venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Permitir compras de usuários sem verificação de e-mail</p>
                  <p className="text-xs text-muted-foreground">Desativado requer confirmação de e-mail antes da compra</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Envio automático de chaves digitais</p>
                  <p className="text-xs text-muted-foreground">Chaves são enviadas automaticamente após confirmação de pagamento</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Permitir parcelamento</p>
                  <p className="text-xs text-muted-foreground">Até 12x no cartão de crédito</p>
                </div>
                <Switch defaultChecked />
              </div>
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
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <button
                  onClick={() => theme !== 'dark' && toggleTheme()}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`}
                >
                  <Moon className="h-8 w-8 mx-auto mb-2 text-foreground" />
                  <p className="text-sm font-medium text-center">Modo Escuro</p>
                </button>
                <button
                  onClick={() => theme !== 'light' && toggleTheme()}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`}
                >
                  <Sun className="h-8 w-8 mx-auto mb-2 text-foreground" />
                  <p className="text-sm font-medium text-center">Modo Claro</p>
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
              <CardDescription>Configure quais notificações o admin recebe por e-mail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: 'Novo pedido recebido', desc: 'Receber e-mail a cada novo pedido', on: true },
                { title: 'Estoque baixo', desc: 'Alertar quando produtos atingirem o limite mínimo', on: true },
                { title: 'Nova denúncia', desc: 'Alertar sobre denúncias no marketplace', on: true },
                { title: 'Novo certificado solicitado', desc: 'Quando um usuário solicitar certificado de proteção', on: false },
                { title: 'Nova avaliação de usuário', desc: 'Quando houver novas avaliações entre usuários', on: false },
              ].map((n, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                    </div>
                    <Switch defaultChecked={n.on} />
                  </div>
                  {i < 4 && <Separator className="mt-4" />}
                </div>
              ))}
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
                <div>
                  <p className="text-sm font-medium">Exigir 2FA para administradores</p>
                  <p className="text-xs text-muted-foreground">Autenticação de dois fatores obrigatória</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Tempo limite de sessão</p>
                  <p className="text-xs text-muted-foreground">Encerrar sessão após inatividade</p>
                </div>
                <Input className="w-24 text-center" defaultValue="60" type="number" />
                <span className="text-xs text-muted-foreground">minutos</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Log de acessos</p>
                  <p className="text-xs text-muted-foreground">Registrar todas as ações dos funcionários</p>
                </div>
                <Switch defaultChecked />
              </div>
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
                <div>
                  <p className="text-sm font-medium">Marketplace ativo</p>
                  <p className="text-xs text-muted-foreground">Permitir que usuários criem anúncios</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Aprovação manual de anúncios</p>
                  <p className="text-xs text-muted-foreground">Anúncios precisam ser aprovados antes de aparecer</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Certificado de Proteção obrigatório</p>
                  <p className="text-xs text-muted-foreground">Exigir certificado para transações acima de R$ 200</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Taxa do marketplace (%)</Label>
                <Input className="w-32" defaultValue="5" type="number" />
                <p className="text-xs text-muted-foreground">Percentual cobrado em cada transação C2C</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
