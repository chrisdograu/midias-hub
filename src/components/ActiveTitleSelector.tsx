import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TitleRow {
  id: string;
  name: string;
  source: string;
  unlock_rule: any | null;
}

interface Particle { id: number; px: number; py: number; left: number; top: number }

function ruleLabel(rule: any): string {
  if (!rule || rule.type === 'none') return 'Liberado';
  if (rule.type === 'achievement') return `Conquista "${rule.achievement_name}" necessária`;
  if (rule.type === 'achievement_id') return 'Conquista específica necessária';
  if (rule.type === 'playtime') return `${rule.min_hours ?? 0}h jogadas necessárias`;
  if (rule.type === 'xp') return `${rule.min_xp ?? 0} XP necessários`;
  return 'Bloqueado';
}

export default function ActiveTitleSelector({ userId }: { userId: string }) {
  const [titles, setTitles] = useState<TitleRow[]>([]);
  const [allowed, setAllowed] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [burstKey, setBurstKey] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: ts }, { data: p }] = await Promise.all([
        supabase.from('user_titles' as any).select('id, name, source, unlock_rule').eq('user_id', userId).order('awarded_at', { ascending: false }),
        supabase.from('profiles').select('active_title_id').eq('id', userId).maybeSingle(),
      ]);
      const list = ((ts as any) || []) as TitleRow[];
      setTitles(list);
      setActiveId((p as any)?.active_title_id || null);

      const checks = await Promise.all(
        list.map(t =>
          supabase
            .rpc('can_equip_title' as any, { _user: userId, _title: t.id })
            .then(({ data, error }) => [t.id, error ? !t.unlock_rule : Boolean(data)] as const)
            .catch(() => [t.id, !t.unlock_rule] as const),
        ),
      );
      setAllowed(Object.fromEntries(checks));
      setLoading(false);
    })();
  }, [userId]);

  const triggerBurst = (key: string) => {
    setBurstKey(key);
    const parts: Particle[] = Array.from({ length: 5 }).map((_, i) => {
      const angle = (i / 5) * Math.PI * 2 + Math.random() * 0.6;
      const dist = 40 + Math.random() * 30;
      return {
        id: Date.now() + i,
        px: Math.cos(angle) * dist,
        py: Math.sin(angle) * dist,
        left: 50 + (Math.random() * 20 - 10),
        top: 50,
      };
    });
    setParticles(parts);
    window.setTimeout(() => { setParticles([]); setBurstKey(null); }, 750);
  };

  const updateTitle = async (newId: string | null) => {
    if (newId && allowed[newId] === false) {
      toast.error('Título bloqueado — complete os requisitos para desbloquear');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ active_title_id: newId } as any).eq('id', userId);
    setSaving(false);
    if (error) { toast.error('Erro ao salvar título'); return; }
    setActiveId(newId);
    triggerBurst(newId ?? '__none__');
    toast.success(newId ? 'Título atualizado!' : 'Título removido');
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;

  const renderParticles = (key: string) => {
    if (burstKey !== key) return null;
    return (
      <>
        {particles.map(p => (
          <span
            key={p.id}
            className="particle-burst absolute w-1.5 h-1.5 rounded-full pointer-events-none"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              background: 'hsl(var(--primary))',
              boxShadow: '0 0 8px hsl(var(--primary)), 0 0 16px hsl(var(--accent))',
              ['--px' as any]: `${p.px}px`,
              ['--py' as any]: `${p.py}px`,
            }}
          />
        ))}
      </>
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Título de conquista exibido
        </div>
        {titles.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Você ainda não conquistou nenhum título. Vença torneios ou acumule XP para desbloquear.</p>
        ) : (
          <div className="space-y-2">
            <button
              disabled={saving}
              onClick={() => updateTitle(null)}
              className={`relative overflow-visible w-full text-left px-3 py-2 rounded-lg border text-sm transition-all ${activeId === null ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-secondary/30 text-muted-foreground hover:border-primary/40'}`}
            >
              <span className={activeId === null && burstKey === '__none__' ? 'chromatic-pulse inline-block' : ''}>Nenhum título</span>
              {renderParticles('__none__')}
            </button>
            {titles.map(t => {
              const isLocked = allowed[t.id] === false;
              const inner = (
                <button
                  disabled={saving || isLocked}
                  onClick={() => updateTitle(t.id)}
                  className={`relative overflow-visible w-full text-left px-3 py-2 rounded-lg border text-sm transition-all flex items-center justify-between ${
                    isLocked
                      ? 'border-border bg-secondary/20 opacity-60 cursor-not-allowed'
                      : activeId === t.id
                        ? 'border-primary bg-gradient-to-r from-primary/15 to-accent/15 text-foreground'
                        : 'border-border bg-secondary/30 hover:border-primary/40'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    {isLocked && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    <span className={`font-medium truncate ${isLocked ? 'text-muted-foreground' : 'gradient-text'} ${activeId === t.id && burstKey === t.id ? 'chromatic-pulse inline-block' : ''}`}>{t.name}</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0 ml-2">{t.source === 'achievement' ? 'Conquista' : 'XP'}</span>
                  {renderParticles(t.id)}
                </button>
              );
              if (!isLocked) return <div key={t.id}>{inner}</div>;
              return (
                <Tooltip key={t.id}>
                  <TooltipTrigger asChild>
                    <div>{inner}</div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    🔒 {ruleLabel(t.unlock_rule)}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
