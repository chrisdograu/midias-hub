import { useState, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Hook que retorna `requireAuth(action)`: executa `action()` se logado,
 * caso contrário abre o modal de "precisa estar logado".
 *
 * Uso:
 *   const { requireAuth, gate } = useLoginGate();
 *   <button onClick={() => requireAuth(() => doStuff())} />
 *   {gate}
 */
export function useLoginGate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const requireAuth = useCallback(
    (action?: () => void) => {
      if (user) {
        action?.();
        return true;
      }
      setOpen(true);
      return false;
    },
    [user]
  );

  const goLogin = () => {
    setOpen(false);
    const redirect = location.pathname.startsWith('/m') ? '/m/auth' : '/auth';
    navigate(redirect);
  };

  const gate: ReactNode = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm glass rounded-2xl p-6 text-center border border-primary/30"
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent mx-auto flex items-center justify-center mb-3 glow-primary">
              <LogIn className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="font-display text-lg font-bold gradient-text">
              Você precisa estar logado
            </h3>
            <p className="text-sm text-muted-foreground mt-1.5 mb-5">
              Entre na sua conta MIDIAS para continuar.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2.5 rounded-lg bg-secondary text-sm font-semibold"
              >
                Agora não
              </button>
              <button
                onClick={goLogin}
                className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5"
              >
                <LogIn className="h-4 w-4" /> Ir para login
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return { requireAuth, gate, isAuthed: !!user };
}
