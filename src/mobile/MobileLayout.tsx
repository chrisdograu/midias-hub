import type { ReactNode } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, MessagesSquare, Send, User, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import NotificationBell from '@/components/NotificationBell';

const ROUTES_WITH_BELL = new Set(['/m', '/m/']);

const tabs = [
  { to: '/m', icon: Home, label: 'Início', end: true },
  { to: '/m/marketplace', icon: ShoppingBag, label: 'Market' },
  { to: '/m/forum', icon: MessagesSquare, label: 'Fórum' },
  { to: '/m/chat', icon: Send, label: 'Chat', badgeKey: 'chat' as const },
  { to: '/m/perfil', icon: User, label: 'Perfil' },
  { to: '/m/config', icon: Settings, label: 'Config' },
];

type MobileLayoutProps = {
  children?: ReactNode;
};

export default function MobileLayout({ children }: MobileLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [unreadChat, setUnreadChat] = useState(0);

  useEffect(() => {
    if (!user) { setUnreadChat(0); return; }
    let mounted = true;
    const load = async () => {
      const { count } = await supabase
        .from('mensagens')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      if (mounted) setUnreadChat(count || 0);
    };
    load();
    const ch = supabase
      .channel('mobile-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensagens', filter: `receiver_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [user]);

  return (
    <div className="h-[100dvh] overflow-hidden bg-background text-foreground flex flex-col">
      {/* Top brand bar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="px-4 py-3 flex items-center justify-between">
          <NavLink to="/m" className="font-display text-xl font-bold gradient-text tracking-wider">
            MIDIAS
          </NavLink>
          <div className="flex items-center gap-2">
            {ROUTES_WITH_BELL.has(location.pathname) && <NotificationBell />}
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">mobile</span>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="min-h-full"
          >
            {children ?? <Outlet />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 backdrop-blur-xl bg-background/80 border-t border-border/60"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="relative grid grid-cols-6 max-w-screen-sm mx-auto">
          {/* Indicador LED deslizante */}
          {(() => {
            const activeIdx = tabs.findIndex(t => t.end ? location.pathname === t.to : location.pathname.startsWith(t.to));
            if (activeIdx < 0) return null;
            return (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute top-0 flex justify-center"
                style={{ width: `${100 / 6}%` }}
                animate={{ left: `${activeIdx * (100 / 6)}%` }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              >
                <span className="block w-8 h-[3px] rounded-b-full bg-gradient-to-r from-primary to-accent shadow-[0_0_10px_hsl(var(--primary)/0.9)]" />
              </motion.div>
            );
          })()}
          {tabs.map(t => {
            const badge = t.badgeKey === 'chat' ? unreadChat : 0;
            return (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.end}
                onTouchStart={() => prefetch(t.to)}
                onMouseEnter={() => prefetch(t.to)}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <div className="relative">
                  <t.icon className="h-5 w-5" />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span>{t.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
