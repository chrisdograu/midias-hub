import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function Auth() {
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'forgot') {
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) { toast.error(error); return; }
      toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setMode('login');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) { setLoading(false); toast.error('A senha deve ter no mínimo 6 caracteres'); return; }
      const { error } = await signUp(email, password, name);
      setLoading(false);
      if (error) { toast.error(error); return; }
      toast.success('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
      return;
    }

    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { toast.error('E-mail ou senha incorretos'); return; }
    toast.success('Login realizado com sucesso!');
    navigate('/');
  };

  const titles = {
    login: { h1: 'Entrar na sua conta', sub: 'Bem-vindo de volta!' },
    signup: { h1: 'Criar uma conta', sub: 'Junte-se à comunidade Midias' },
    forgot: { h1: 'Recuperar senha', sub: 'Enviaremos um link para seu e-mail' },
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Gamepad2 className="h-8 w-8 text-primary" />
            <span className="font-display text-2xl font-bold gradient-text">MIDIAS</span>
          </Link>
          <h1 className="text-xl font-bold text-foreground">{titles[mode].h1}</h1>
          <p className="text-sm text-muted-foreground mt-1">{titles[mode].sub}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Nome</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" required
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            {mode !== 'forgot' && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="text-right">
                <button type="button" onClick={() => setMode('forgot')} className="text-xs text-primary hover:underline">Esqueceu a senha?</button>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all glow-primary disabled:opacity-50">
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar Conta' : 'Enviar Link'}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === 'login' ? (
              <>Não tem conta? <button onClick={() => setMode('signup')} className="text-primary hover:underline font-medium">Criar conta</button></>
            ) : (
              <>Já tem conta? <button onClick={() => setMode('login')} className="text-primary hover:underline font-medium">Fazer login</button></>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
