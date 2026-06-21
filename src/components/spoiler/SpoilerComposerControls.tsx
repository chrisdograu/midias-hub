// Controles compartilhados pro composer: spoiler manual + spoiler vinculado a conquista.
// Quando productId existe, busca conquistas únicas (achievement_name) já registradas em
// user_achievements pra esse jogo e oferece como dropdown.
import { useEffect, useState } from 'react';
import { AlertTriangle, Trophy, ChevronDown, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  isSpoiler: boolean;
  onIsSpoilerChange: (v: boolean) => void;
  achievementName: string | null;
  onAchievementNameChange: (v: string | null) => void;
  productId?: string | null;
  className?: string;
}

export default function SpoilerComposerControls({
  isSpoiler,
  onIsSpoilerChange,
  achievementName,
  onAchievementNameChange,
  productId,
  className = '',
}: Props) {
  const [achievements, setAchievements] = useState<string[]>([]);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    if (!productId) { setAchievements([]); return; }
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from('user_achievements')
        .select('achievement_name')
        .eq('product_id', productId)
        .limit(200);
      if (cancel) return;
      const uniq = Array.from(new Set((data || []).map((r: any) => r.achievement_name).filter(Boolean))).sort();
      setAchievements(uniq);
    })();
    return () => { cancel = true; };
  }, [productId]);

  const setName = (v: string | null) => {
    onAchievementNameChange(v);
    if (v) onIsSpoilerChange(false);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        type="button"
        onClick={() => { onIsSpoilerChange(!isSpoiler); if (!isSpoiler) onAchievementNameChange(null); }}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${
          isSpoiler
            ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
            : 'bg-card border-border text-muted-foreground hover:border-amber-500/40'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5" />
          Marcar como spoiler (todos precisam revelar)
        </span>
        <span className={`h-4 w-7 rounded-full transition-colors ${isSpoiler ? 'bg-amber-400' : 'bg-muted'}`}>
          <span className={`block h-4 w-4 rounded-full bg-background border border-border transition-transform ${isSpoiler ? 'translate-x-3' : ''}`} />
        </span>
      </button>

      {productId && (
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Trophy className="h-3 w-3 text-yellow-500" />
            Spoiler de conquista (opcional)
          </label>

          {!customMode ? (
            <div className="relative">
              <select
                value={achievementName || ''}
                onChange={e => setName(e.target.value || null)}
                className={`w-full pl-3 pr-8 py-2 rounded-lg border text-xs appearance-none cursor-pointer ${
                  achievementName
                    ? 'bg-destructive/15 border-destructive/60 text-destructive-foreground'
                    : 'bg-card border-border text-muted-foreground'
                }`}
              >
                <option value="">— Nenhuma —</option>
                {achievements.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <ChevronDown className="h-3.5 w-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>
          ) : (
            <div className="flex gap-1.5">
              <input
                value={customValue}
                onChange={e => setCustomValue(e.target.value)}
                placeholder="Nome da conquista"
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-xs"
                maxLength={120}
              />
              <button
                type="button"
                onClick={() => { if (customValue.trim()) setName(customValue.trim()); setCustomMode(false); }}
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
              >OK</button>
              <button type="button" onClick={() => setCustomMode(false)} className="p-2 rounded-lg bg-secondary text-muted-foreground"><X className="h-3 w-3" /></button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setCustomMode(m => !m)}
            className="text-[10px] text-primary hover:underline"
          >
            {customMode ? 'Usar lista de conquistas' : 'Digitar nome de outra conquista'}
          </button>
          {achievementName && (
            <p className="text-[10px] text-muted-foreground">
              Quem já tiver "<b className="text-foreground">{achievementName}</b>" verá o conteúdo direto, com badge dourado. Quem não tiver vê alerta intenso.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
