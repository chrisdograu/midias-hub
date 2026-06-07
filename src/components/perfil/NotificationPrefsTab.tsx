import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Bell, Sparkles, Trophy, Users, MessageSquare, Library } from 'lucide-react';
import { toast } from 'sonner';

type Prefs = {
  social_likes: boolean; social_replies: boolean; social_follows: boolean;
  forum_replies: boolean; forum_mentions: boolean; forum_topics: boolean;
  tournament_signup: boolean; tournament_7d: boolean; tournament_1d: boolean;
  tournament_1h: boolean; tournament_match: boolean; tournament_result: boolean;
  library_review_completa: boolean; library_opinion: boolean;
  library_screenshot: boolean; library_activity: boolean;
  midias_especiais: boolean;
};

const GROUPS: { title: string; icon: any; items: { key: keyof Prefs; label: string; hint?: string }[] }[] = [
  { title: 'Social', icon: Users, items: [
    { key: 'social_likes', label: 'Curtidas em meu conteúdo' },
    { key: 'social_replies', label: 'Respostas em meus posts' },
    { key: 'social_follows', label: 'Novos seguidores' },
  ]},
  { title: 'Fórum', icon: MessageSquare, items: [
    { key: 'forum_replies', label: 'Respostas nos meus tópicos' },
    { key: 'forum_mentions', label: 'Menções (@usuario)' },
    { key: 'forum_topics', label: 'Novos tópicos em jogos seguidos' },
  ]},
  { title: 'Torneios', icon: Trophy, items: [
    { key: 'tournament_signup', label: 'Inscrição confirmada' },
    { key: 'tournament_7d', label: 'Lembrete 7 dias antes' },
    { key: 'tournament_1d', label: 'Lembrete 1 dia antes' },
    { key: 'tournament_1h', label: 'Lembrete 1 hora antes' },
    { key: 'tournament_match', label: 'Sua partida vai começar' },
    { key: 'tournament_result', label: 'Resultado de partidas' },
  ]},
  { title: 'Biblioteca social', icon: Library, items: [
    { key: 'library_review_completa', label: 'Amigo publicou Review Completa' },
    { key: 'library_opinion', label: 'Amigo postou uma opinião' },
    { key: 'library_screenshot', label: 'Amigo postou screenshots' },
    { key: 'library_activity', label: 'Amigo atualizou biblioteca' },
  ]},
  { title: 'MIDIAS Especiais', icon: Sparkles, items: [
    { key: 'midias_especiais', label: 'Promoções, eventos e novidades da plataforma' },
  ]},
];

const DEFAULT: Prefs = {
  social_likes: true, social_replies: true, social_follows: true,
  forum_replies: true, forum_mentions: true, forum_topics: true,
  tournament_signup: true, tournament_7d: true, tournament_1d: true,
  tournament_1h: true, tournament_match: true, tournament_result: true,
  library_review_completa: true, library_opinion: true,
  library_screenshot: true, library_activity: true,
  midias_especiais: true,
};

export default function NotificationPrefsTab() {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('notification_preferences').select('*').eq('user_id', user.id).maybeSingle();
      if (data) {
        const { user_id: _u, created_at: _c, updated_at: _up, ...rest } = data as any;
        setPrefs({ ...DEFAULT, ...rest });
      }
      setLoading(false);
    })();
  }, [user?.id]);

  const update = async (key: keyof Prefs, value: boolean) => {
    if (!user) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    const { error } = await supabase.from('notification_preferences').upsert({ user_id: user.id, ...next });
    setSaving(false);
    if (error) { toast.error('Erro ao salvar preferência'); return; }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" /> Notificações
        </h2>
        {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <p className="text-xs text-muted-foreground -mt-3">Escolha o que você quer ser avisado.</p>

      {GROUPS.map((g, gi) => {
        const Icon = g.icon;
        return (
          <div key={g.title} className="space-y-3">
            {gi > 0 && <Separator />}
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 pt-2">
              <Icon className="h-4 w-4 text-primary" /> {g.title}
            </h3>
            <div className="space-y-3 pl-1">
              {g.items.map(it => (
                <div key={it.key} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{it.label}</p>
                    {it.hint && <p className="text-xs text-muted-foreground">{it.hint}</p>}
                  </div>
                  <Switch checked={prefs[it.key]} onCheckedChange={v => update(it.key, v)} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
