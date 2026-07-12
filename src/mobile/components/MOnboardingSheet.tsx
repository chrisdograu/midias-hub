import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Check, GraduationCap, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Onboarding mobile — bottom-sheet equivalente ao OnboardingDialog web.
 * Passo 1: gêneros (mín. 3, sem máx). Passo 2: convite pro tour → /m/tutoriais.
 * Grava `profiles.onboarded_at` — só aparece uma vez.
 */
export default function MOnboardingSheet() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'genres' | 'tutorial'>('genres');
  const [checked, setChecked] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || checked) return;
    let cancelled = false;
    (async () => {
      const [{ data: prof }, { data: cats }] = await Promise.all([
        (supabase as any).rpc('get_my_profile'),
        supabase.from('categorias').select('name').order('name'),
      ]);
      if (cancelled) return;
      const row = Array.isArray(prof) ? prof[0] : prof;
      setChecked(true);
      setCategories((cats || []).map((c: { name: string }) => c.name));
      if (row && !row.onboarded_at) {
        setPicked(row.favorite_genres || []);
        setOpen(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user, checked]);

  const toggle = (name: string) =>
    setPicked(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);

  const persist = async (savePrefs: boolean) => {
    if (!user) return false;
    setSaving(true);
    const patch: Record<string, unknown> = { onboarded_at: new Date().toISOString() };
    if (savePrefs) patch.favorite_genres = picked;
    const { error } = await (supabase as any).from('profiles').update(patch).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Não deu pra salvar agora — ajuste depois em Configurações.'); return false; }
    if (savePrefs) toast.success('Preferências salvas ✨');
    return true;
  };

  const saveAndAdvance = async () => {
    if (picked.length < 3) { toast.error('Escolha pelo menos 3 gêneros.'); return; }
    if (await persist(true)) setStep('tutorial');
  };
  const skipToTutorial = async () => { if (await persist(false)) setStep('tutorial'); };
  const closeSheet = (goTutorial: boolean) => {
    setOpen(false);
    if (goTutorial) navigate('/m/tutoriais');
  };

  if (!user || !open) return null;
  const canSave = picked.length >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-background border-t border-border rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2">
            {step === 'genres'
              ? <><Sparkles className="h-5 w-5 text-primary" /> Seus gêneros favoritos</>
              : <><GraduationCap className="h-5 w-5 text-accent" /> Tour rápido?</>}
          </h2>
          <button onClick={() => closeSheet(false)} className="text-muted-foreground p-1"><X className="h-5 w-5" /></button>
        </div>

        {step === 'genres' ? (
          <>
            <p className="text-xs text-muted-foreground">
              Selecione <strong className="text-foreground">no mínimo 3</strong> — sem limite máximo.
              Ajustável depois em <strong className="text-foreground">Configurações → Preferências</strong>.
            </p>
            <div className="flex flex-wrap gap-2 py-1">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem categorias cadastradas ainda.</p>
              ) : categories.map(name => {
                const active = picked.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggle(name)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs border transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-foreground border-border'
                    }`}
                  >
                    {active && <Check className="h-3 w-3" />} {name}
                  </button>
                );
              })}
            </div>
            <p className={`text-[11px] ${canSave ? 'text-muted-foreground' : 'text-amber-500'}`}>
              {picked.length} selecionados {canSave ? '✓' : `— faltam ${3 - picked.length}`}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={skipToTutorial}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold disabled:opacity-50"
              >Pular</button>
              <button
                onClick={saveAndAdvance}
                disabled={saving || !canSave}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar e continuar
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              Tutoriais interativos curtinhos sobre feed, marketplace, chat, anúncios e perfil.
              Pode ver agora ou abrir depois em <strong className="text-foreground">Configurações → Tutoriais</strong>.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => closeSheet(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold"
              >Agora não</button>
              <button
                onClick={() => closeSheet(true)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1"
              >
                <GraduationCap className="h-4 w-4" /> Sim, me mostrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
