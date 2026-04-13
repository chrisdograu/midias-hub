import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export type EmployeePosition = 'admin' | 'gerente' | 'moderador' | 'atendente_marketplace' | 'estoquista' | 'atendente';

// Maps each position to the desktop route segments it can access
export const POSITION_PERMISSIONS: Record<EmployeePosition, string[]> = {
  admin: ['*'], // all sections
  gerente: [
    'produtos', 'funcionarios', 'clientes', 'fornecedores', 'categorias',
    'estoque', 'pedidos', 'relatorios',
  ],
  moderador: [
    'moderacao', 'forum', 'avaliacoes-usuario',
  ],
  atendente_marketplace: [
    'anuncios', 'propostas', 'mensagens', 'notificacoes',
  ],
  estoquista: [
    'estoque', 'produtos', 'fornecedores', 'categorias',
  ],
  atendente: [
    'pedidos', 'clientes', 'certificados',
  ],
};

export const POSITION_LABELS: Record<EmployeePosition, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  moderador: 'Moderador',
  atendente_marketplace: 'Atendente Marketplace',
  estoquista: 'Estoquista',
  atendente: 'Atendente',
};

interface DesktopAuthContextType {
  user: User | null;
  profile: { display_name: string | null; avatar_url: string | null } | null;
  position: EmployeePosition | null;
  isStaff: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  canAccess: (route: string) => boolean;
}

const DesktopAuthContext = createContext<DesktopAuthContextType>({
  user: null,
  profile: null,
  position: null,
  isStaff: false,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  canAccess: () => false,
});

export function DesktopAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [position, setPosition] = useState<EmployeePosition | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStaffData = async (userId: string) => {
    // Get profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', userId)
      .single();
    
    setProfile(profileData);

    // Get role and position
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role, position')
      .eq('user_id', userId)
      .in('role', ['admin', 'atendente'])
      .single();

    if (roleData) {
      const pos = (roleData.position as EmployeePosition) || (roleData.role === 'admin' ? 'admin' : 'atendente');
      setPosition(pos);
      return true;
    }
    return false;
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Use setTimeout to avoid Supabase auth deadlock
        setTimeout(() => {
          fetchStaffData(session.user.id).then(isStaff => {
            if (!isStaff) {
              setPosition(null);
            }
            setLoading(false);
          });
        }, 0);
      } else {
        setUser(null);
        setProfile(null);
        setPosition(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchStaffData(session.user.id).then(isStaff => {
          if (!isStaff) setPosition(null);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    
    if (data.user) {
      const isStaff = await fetchStaffData(data.user.id);
      if (!isStaff) {
        await supabase.auth.signOut();
        return { error: 'Acesso restrito. Conta não autorizada para o backoffice.' };
      }
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setPosition(null);
  };

  const canAccess = (route: string) => {
    if (!position) return false;
    const perms = POSITION_PERMISSIONS[position];
    if (perms.includes('*')) return true;
    // Dashboard is always accessible
    if (route === '' || route === '/desktop') return true;
    return perms.some(p => route.includes(p));
  };

  const isStaff = !!position;

  return (
    <DesktopAuthContext.Provider value={{ user, profile, position, isStaff, loading, signIn, signOut, canAccess }}>
      {children}
    </DesktopAuthContext.Provider>
  );
}

export const useDesktopAuth = () => useContext(DesktopAuthContext);
