import { Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, UserCog, Truck, Tags,
  Warehouse, ClipboardList, Shield, BarChart3,
  Award, LogOut, Gamepad2, ChevronLeft, ChevronRight,
  Megaphone, ArrowLeftRight, MessageSquare, Star, Bell, MessageCircle,
  Sun, Moon, Settings, Loader2, Ticket,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useDesktopAuth, POSITION_LABELS } from '@/hooks/useDesktopAuth';
import { cn } from '@/lib/utils';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navSections = [
  {
    label: 'Geral',
    items: [
      { title: 'Dashboard', url: '/desktop', icon: LayoutDashboard, route: '' },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      { title: 'Produtos', url: '/desktop/produtos', icon: Package, route: 'produtos' },
      { title: 'Funcionários', url: '/desktop/funcionarios', icon: UserCog, route: 'funcionarios' },
      { title: 'Clientes', url: '/desktop/clientes', icon: Users, route: 'clientes' },
      { title: 'Fornecedores', url: '/desktop/fornecedores', icon: Truck, route: 'fornecedores' },
      { title: 'Categorias', url: '/desktop/categorias', icon: Tags, route: 'categorias' },
      { title: 'Cupons', url: '/desktop/cupons', icon: Ticket, route: 'cupons' },
    ],
  },
  {
    label: 'Operacional',
    items: [
      { title: 'Estoque', url: '/desktop/estoque', icon: Warehouse, route: 'estoque' },
      { title: 'Pedidos Online', url: '/desktop/pedidos', icon: ClipboardList, route: 'pedidos' },
    ],
  },
  {
    label: 'Marketplace Mobile',
    items: [
      { title: 'Anúncios', url: '/desktop/anuncios', icon: Megaphone, route: 'anuncios' },
      { title: 'Propostas de Troca', url: '/desktop/propostas', icon: ArrowLeftRight, route: 'propostas' },
      { title: 'Mensagens', url: '/desktop/mensagens', icon: MessageSquare, route: 'mensagens' },
      { title: 'Avaliações Usuários', url: '/desktop/avaliacoes-usuario', icon: Star, route: 'avaliacoes-usuario' },
      { title: 'Notificações', url: '/desktop/notificacoes', icon: Bell, route: 'notificacoes' },
      { title: 'Fórum', url: '/desktop/forum', icon: MessageCircle, route: 'forum' },
    ],
  },
  {
    label: 'Administração',
    items: [
      { title: 'Moderação', url: '/desktop/moderacao', icon: Shield, route: 'moderacao' },
      { title: 'Relatórios', url: '/desktop/relatorios', icon: BarChart3, route: 'relatorios' },
      { title: 'Certificados', url: '/desktop/certificados', icon: Award, route: 'certificados' },
      { title: 'Configurações', url: '/desktop/configuracoes', icon: Settings, route: 'configuracoes' },
    ],
  },
];

export default function DesktopLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, profile, position, isStaff, loading, signOut, canAccess } = useDesktopAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isStaff) {
    return <Navigate to="/desktop/login" replace />;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/desktop/login');
  };

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Usuário';
  const positionLabel = position ? POSITION_LABELS[position] : 'Funcionário';

  // Filter sections based on permissions
  const filteredSections = navSections.map(section => ({
    ...section,
    items: section.items.filter(item => canAccess(item.route || item.url)),
  })).filter(section => section.items.length > 0);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-sidebar transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-[250px]'
        )}
      >
        <div className="flex items-center gap-2 px-4 h-16 border-b border-border shrink-0">
          <Gamepad2 className="h-7 w-7 text-primary shrink-0" />
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight">
              <span className="text-primary">MIDIAS</span>
              <span className="text-accent ml-1 text-sm font-medium">Backoffice</span>
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {filteredSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const link = (
                    <NavLink
                      key={item.title}
                      to={item.url}
                      end={item.url === '/desktop'}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        collapsed && 'justify-center px-2'
                      )}
                      activeClassName="bg-primary/10 text-primary"
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.title} delayDuration={0}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.title}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return link;
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-2 shrink-0 space-y-1">
          {!collapsed && (
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-semibold text-foreground">{displayName}</p>
              <p className="text-[10px] text-muted-foreground">{positionLabel}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn('w-full text-muted-foreground', collapsed ? 'justify-center' : 'justify-start')}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
            {!collapsed && (theme === 'dark' ? 'Modo Claro' : 'Modo Escuro')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn('w-full text-muted-foreground hover:text-destructive', collapsed ? 'justify-center' : 'justify-start')}
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {!collapsed && 'Sair'}
          </Button>
          <Separator className="my-1" />
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-8"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
