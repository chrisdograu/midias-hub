import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface TitleRow { id: string; name: string; source: string }

interface Particle { id: number; px: number; py: number; left: number; top: number }

export default function ActiveTitleSelector({ userId }: { userId: string }) {
  const [titles, setTitles] = useState<TitleRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [burstKey, setBurstKey] = useState<string | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: ts }, { data: p }] = await Promise.all([
        supabase.from('user_titles' as any).select('id, name, source').eq('user_id', userId).order('awarded_at', { ascending: false }),
        supabase.from('profiles').select('active_title_id').eq('id', userId).maybeSingle(),
      ]);
      setTitles((ts as any) || []);
      setActiveId((p as any)?.active_title_id || null);
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
          {titles.map(t => (
            <button
              key={t.id}
              disabled={saving}
              onClick={() => updateTitle(t.id)}
              className={`relative overflow-visible w-full text-left px-3 py-2 rounded-lg border text-sm transition-all flex items-center justify-between ${activeId === t.id ? 'border-primary bg-gradient-to-r from-primary/15 to-accent/15 text-foreground' : 'border-border bg-secondary/30 hover:border-primary/40'}`}
            >
              <span className={`font-medium gradient-text ${activeId === t.id && burstKey === t.id ? 'chromatic-pulse inline-block' : ''}`}>{t.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.source === 'achievement' ? 'Conquista' : 'XP'}</span>
              {renderParticles(t.id)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
