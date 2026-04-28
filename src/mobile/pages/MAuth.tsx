import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { z } from 'zod';
import { toast } from 'sonner';

const signUpSchema = z.object({
  displayName: z.string().trim().min(2, 'Nome muito curto').max(60),
  email: z.string().trim().email('E-mail inválido').max(255),
  password: z.string().min(6, 'Mínimo 6 caracteres').max(72),
});
const signInSchema = z.object({
  email: z.string().trim().email('E-mail inválido').max(255),
  password: z.string().min(1).max(72),
});

export default function MAuth() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/m" replace />;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = mode === 'in' ? signInSchema : signUpSchema;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const { error } = mode === 'in'
      ? await signIn(form.email, form.password)
      : await signUp(form.email, form.password, form.displayName);
    setLoading(false);
    if (error) { toast.error(error); return; }
    toast.success(mode === 'in' ? '✨ Bem-vindo de volta!' : '🎮 Conta criada! Verifique seu e-mail.');
    if (mode === 'in') navigate('/m');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, hsl(var(--glow-primary) / 0.18) 0%, transparent 50%), radial-gradient(circle at 80% 70%, hsl(var(--glow-accent) / 0.18) 0%, transparent 50%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold gradient-text tracking-widest mb-1">MIDIAS</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">comunidade gamer mobile</p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-4 shadow-2xl">
          <div className="flex gap-2 p-1 bg-secondary/50 rounded-lg">
            <button
              type="button" onClick={() => setMode('in')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'in' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >🎮 Entrar</button>
            <button
              type="button" onClick={() => setMode('up')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${mode === 'up' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >✨ Criar conta</button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {mode === 'up' && (
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })}
                  placeholder="Seu nome de exibição"
                  className="w-full pl-10 pr-3 py-2.5 bg-background/60 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-3 py-2.5 bg-background/60 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Sua senha"
                className="w-full pl-10 pr-3 py-2.5 bg-background/60 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all glow-primary"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'in' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Ao continuar você concorda com os termos da plataforma.
        </p>
      </motion.div>
    </div>
  );
}
