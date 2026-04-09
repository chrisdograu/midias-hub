import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, UserCog, Truck, Tags,
  Warehouse, ClipboardList, Shield, BarChart3,
  Award, LogOut, Gamepad2, ChevronLeft, ChevronRight,
  Megaphone, ArrowLeftRight, MessageSquare, Star, Bell,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { NavLink } from '@/components/NavLink';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navSections = [
  {
    label: 'Geral',
    items: [
      { title: 'Dashboard', url: '/desktop', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Cadastros',
    adminOnly: true,
    items: [
      { title: 'Produtos', url: '/desktop/produtos', icon: Package },
      { title: 'Funcionários', url: '/desktop/funcionarios', icon: UserCog },
      { title: 'Clientes', url: '/desktop/clientes', icon: Users },
      { title: 'Fornecedores', url: '/desktop/fornecedores', icon: Truck },
      { title: 'Categorias', url: '/desktop/categorias', icon: Tags },
    ],
  },
  {
    label: 'Operacional',
    items: [
      { title: 'Estoque', url: '/desktop/estoque', icon: Warehouse },
      { title: 'Pedidos Online', url: '/desktop/pedidos', icon: ClipboardList },
    ],
  },
  {
    label: 'Marketplace Mobile',
    adminOnly: true,
    items: [
      { title: 'Anúncios', url: '/desktop/anuncios', icon: Megaphone },
      { title: 'Propostas de Troca', url: '/desktop/propostas', icon: ArrowLeftRight },
      { title: 'Mensagens', url: '/desktop/mensagens', icon: MessageSquare },
      { title: 'Avaliações Usuários', url: '/desktop/avaliacoes-usuario', icon: Star },
      { title: 'Notificações', url: '/desktop/notificacoes', icon: Bell },
    ],
  },
  {
    label: 'Administração',
    adminOnly: true,
    items: [
      { title: 'Moderação', url: '/desktop/moderacao', icon: Shield },
      { title: 'Relatórios', url: '/desktop/relatorios', icon: BarChart3 },
      { title: 'Certificados', url: '/desktop/certificados', icon: Award },
    ],
  },
];

export default function DesktopLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-border bg-sidebar transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-[250px]'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-16 border-b border-border shrink-0">
          <Gamepad2 className="h-7 w-7 text-primary shrink-0" />
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight">
              <span className="text-primary">MIDIAS</span>
              <span className="text-accent ml-1 text-sm font-medium">Backoffice</span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {navSections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = item.url === '/desktop'
                    ? location.pathname === '/desktop'
                    : location.pathname.startsWith(item.url);

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

        {/* Bottom */}
        <div className="border-t border-border p-2 shrink-0 space-y-1">
          {!collapsed && (
            <div className="px-3 py-2 mb-1">
              <p className="text-xs font-semibold text-foreground">Carlos Silva</p>
              <p className="text-[10px] text-muted-foreground">Administrador</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn('w-full text-muted-foreground hover:text-destructive', collapsed ? 'justify-center' : 'justify-start')}
            onClick={() => navigate('/desktop/login')}
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

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
