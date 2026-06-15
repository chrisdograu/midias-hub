// Página única que agrega todos os controles de privacidade e segurança do usuário.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Bell, UserX, ArrowLeft, Eye, UserCheck, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PrivacyTab from '@/components/perfil/PrivacyTab';
import NotificationPrefsTab from '@/components/perfil/NotificationPrefsTab';
import BlockedUsersTab from '@/components/perfil/BlockedUsersTab';

export default function PrivacidadeCentral() {
  const { user } = useAuth();
  const [isPrivate, setIsPrivate] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('is_private, require_follow_approval').eq('id', user.id).maybeSingle().then(({ data }) => {
      const d = data as any;
      if (d) { setIsPrivate(!!d.is_private); setRequireApproval(!!d.require_follow_approval); }
      setLoaded(true);
    });
  }, [user?.id]);

  const saveToggle = async (field: 'is_private' | 'require_follow_approval', value: boolean) => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ [field]: value } as any).eq('id', user.id);
    if (error) toast.error('Erro ao salvar'); else toast.success('Atualizado');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link to="/perfil" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4" /> Voltar ao perfil</Link>
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-2"><Shield className="h-6 w-6 text-primary" /> Privacidade e segurança</h1>
      <p className="text-sm text-muted-foreground mb-6">Tudo num só lugar: visibilidade do seu perfil, quem pode te seguir/mensagem, exceções e bloqueios.</p>

      {/* Toggles rápidos */}
      <section className="bg-card border border-border rounded-xl p-5 mb-6 space-y-4">
        <Row icon={<Lock className="h-4 w-4 text-primary" />} title="Perfil privado" desc="Oculta sua biblioteca e atividade para quem não é amigo mútuo.">
          <Switch checked={isPrivate} disabled={!loaded} onCheckedChange={v => { setIsPrivate(v); saveToggle('is_private', v); }} />
        </Row>
        <Row icon={<UserCheck className="h-4 w-4 text-accent" />} title="Aprovar novos seguidores" desc="Cada pedido para te seguir fica pendente até você aprovar (estilo Instagram).">
          <Switch checked={requireApproval} disabled={!loaded} onCheckedChange={v => { setRequireApproval(v); saveToggle('require_follow_approval', v); }} />
        </Row>
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
