import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type TutorialKey =
  | 'web_perfil' | 'web_biblioteca' | 'web_review_completa' | 'web_torneios'
  | 'web_busca_global' | 'web_conversas_opinioes' | 'web_destaques'
  | 'mobile_feed' | 'mobile_marketplace' | 'mobile_forum'
  | 'mobile_chat' | 'mobile_anunciar' | 'mobile_perfil';

export interface TutorialMeta {
  key: TutorialKey;
  title: string;
  description: string;
  replicaRoute: string;
  area: 'web' | 'mobile';
}

export const TUTORIALS: TutorialMeta[] = [
  { key: 'web_perfil',             title: 'Personalizar Perfil',       description: 'Banner, cor do tema, bio, troféus em destaque', replicaRoute: '/tutorial/web_perfil', area: 'web' },
  { key: 'web_biblioteca',         title: 'Sua Biblioteca',            description: 'Status de jogos, horas, platinas, capas customizadas', replicaRoute: '/tutorial/web_biblioteca', area: 'web' },
  { key: 'web_review_completa',    title: 'Review Completa',           description: 'Escrever review longa, anexar screenshots, publicar', replicaRoute: '/tutorial/web_review_completa', area: 'web' },
  { key: 'web_torneios',           title: 'Torneios',                  description: 'Inscrição, chat do torneio, brackets, partidas', replicaRoute: '/tutorial/web_torneios', area: 'web' },
  { key: 'web_busca_global',       title: 'Busca Global',              description: 'Buscar em todo o ecossistema (Mobile + Web)', replicaRoute: '/tutorial/web_busca_global', area: 'web' },
  { key: 'web_conversas_opinioes', title: 'Conversas de Opiniões',     description: 'Como uma opinião vira conversa privada permanente', replicaRoute: '/tutorial/web_conversas_opinioes', area: 'web' },
  { key: 'web_destaques',          title: 'Destaques do Perfil',       description: 'Fixar até 6 itens (jogos, reviews, opiniões) no perfil', replicaRoute: '/tutorial/web_destaques', area: 'web' },
  { key: 'mobile_feed',            title: 'Feed Mobile',               description: 'Como funciona o feed da comunidade', replicaRoute: '/tutorial/mobile_feed', area: 'mobile' },
  { key: 'mobile_marketplace',     title: 'Marketplace C2C',           description: 'Anúncios, filtros, certificado de proteção', replicaRoute: '/tutorial/mobile_marketplace', area: 'mobile' },
  { key: 'mobile_forum',           title: 'Fórum',                     description: 'Tópicos por jogo, likes, respostas', replicaRoute: '/tutorial/mobile_forum', area: 'mobile' },
  { key: 'mobile_chat',            title: 'Chat',                      description: 'Conversas, grupos, denúncias', replicaRoute: '/tutorial/mobile_chat', area: 'mobile' },
  { key: 'mobile_anunciar',        title: 'Anunciar Item',             description: 'Como criar um anúncio passo a passo', replicaRoute: '/tutorial/mobile_anunciar', area: 'mobile' },
  { key: 'mobile_perfil',          title: 'Perfil Mobile',             description: 'Foto, bio, certificação de vendedor', replicaRoute: '/tutorial/mobile_perfil', area: 'mobile' },
];

interface TutorialCtx {
  seen: Set<TutorialKey>;
  markSeen: (key: TutorialKey) => Promise<void>;
  isLoading: boolean;
}

const Ctx = createContext<TutorialCtx>({ seen: new Set(), markSeen: async () => {}, isLoading: true });

export const TutorialProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [seen, setSeen] = useState<Set<TutorialKey>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) { setSeen(new Set()); setIsLoading(false); return; }
    (async () => {
      const { data } = await supabase.from('tutorials_seen').select('tutorial_key').eq('user_id', user.id);
      setSeen(new Set((data ?? []).map(d => d.tutorial_key as TutorialKey)));
      setIsLoading(false);
    })();
  }, [user?.id]);

  const markSeen = async (key: TutorialKey) => {
    if (!user) return;
    await supabase.from('tutorials_seen').upsert({
      user_id: user.id, tutorial_key: key, completed: true,
    } as any, { onConflict: 'user_id,tutorial_key' });
    setSeen(prev => new Set([...prev, key]));
  };

  return <Ctx.Provider value={{ seen, markSeen, isLoading }}>{children}</Ctx.Provider>;
};

export const useTutorial = () => useContext(Ctx);
