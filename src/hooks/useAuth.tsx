import { createContext, useContext, useEffect, useRef, useState, FC, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: { display_name: string | null; avatar_url: string | null; banned_until: string | null } | null;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null; banned_until: string | null } | null>(null);
  const loadedProfileFor = useRef<string | null>(null);

  const lastUserId = useRef<string | null>(null);
  const applySession = (session: Session | null) => {
    const nextUserId = session?.user?.id ?? null;
    setSession(session);
    if (nextUserId !== lastUserId.current) {
      lastUserId.current = nextUserId;
      setUser(session?.user ?? null);
      if (session?.user) void fetchProfile(session.user.id);
      else { loadedProfileFor.current = null; setProfile(null); }
    }
    setLoading(false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => applySession(session));
    supabase.auth.getSession().then(({ data: { session } }) => applySession(session));
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    if (loadedProfileFor.current === userId) return;
    loadedProfileFor.current = userId;
    const { data } = await supabase.from('profiles').select('display_name, avatar_url, banned_until').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { display_name: displayName },
      },
    });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    loadedProfileFor.current = null;
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error?.message ?? null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, signUp, signIn, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
