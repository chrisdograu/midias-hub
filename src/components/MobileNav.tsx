import { Link, useLocation } from 'react-router-dom';
import { Home, Sparkles, ShoppingBag, MessageCircle, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/reviews', icon: Sparkles, label: 'Reviews' },
  { to: '/marketplace', icon: ShoppingBag, label: 'Market' },
  { to: '/mensagens', icon: MessageCircle, label: 'Chat' },
  { to: '/perfil', icon: User, label: 'Perfil' },
];

export default function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass border-t border-border">
      <div className="flex items-center justify-around h-14">
        {navItems.map(item => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to));
          const needsAuth = item.to === '/mensagens' || item.to === '/perfil';
          const target = needsAuth && !user ? '/auth' : item.to;

          return (
            <Link key={item.to} to={target}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
