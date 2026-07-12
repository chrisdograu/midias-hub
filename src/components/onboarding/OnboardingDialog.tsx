import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Check, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Onboarding leve — só aparece 1x, é pulável, gravado em `profiles.onboarded_at`.
 * Passo 1: escolher no mínimo 3 gêneros (categorias existentes). Sem limite máximo.
 * Passo 2: convite pra ver o tour rápido (leva a /tutoriais). Também pulável.
 * O usuário pode ajustar depois em /perfil → seção "Preferências".
 */
export default function OnboardingDialog() {
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

  const toggle = (name: string) => {
    setPicked(prev => prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]);
  };

  const persist = async (savePrefs: boolean) => {
    if (!user) return false;
    setSaving(true);
    const patch: Record<string, unknown> = { onboarded_at: new Date().toISOString() };
    if (savePrefs) patch.favorite_genres = picked;
    const { error } = await (supabase as any).from('profiles').update(patch).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Não deu pra salvar agora — pode ajustar depois em Configurações.'); return false; }
    if (savePrefs) toast.success('Preferências salvas — vamos ajustar seus destaques 👀');
    return true;
  };

  const savePrefsAndAdvance = async () => {
    if (picked.length < 3) {
      toast.error('Escolha pelo menos 3 gêneros — ou toque em "Pular" pra decidir depois.');
      return;
    }
    const ok = await persist(true);
    if (ok) setStep('tutorial');
  };

  const skipToTutorial = async () => {
    const ok = await persist(false);
    if (ok) setStep('tutorial');
  };

  const closeAndMaybeTutorial = (goTutorial: boolean) => {
    setOpen(false);
    if (goTutorial) navigate('/tutoriais');
  };

  if (!user) return null;

  const canSave = picked.length >= 3;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && step === 'genres') persist(false).then(() => setOpen(false)); else if (!v) setOpen(false); }}>
      <DialogContent className="max-w-lg">
        {step === 'genres' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Escolha seus gêneros favoritos
              </DialogTitle>
              <DialogDescription>
                Selecione <span className="text-foreground font-medium">no mínimo 3</span> — sem limite máximo.
                A gente usa isso pra sugerir jogos e destaques mais alinhados com você.
                Pode pular agora e ajustar depois em <span className="text-foreground">Configurações → Preferências</span>.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap gap-2 py-2 max-h-64 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem categorias cadastradas ainda.</p>
              ) : categories.map(name => {
                const active = picked.includes(name);
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggle(name)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm border transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary text-foreground border-border hover:border-primary/60'
                    }`}
                  >
                    {active && <Check className="h-3.5 w-3.5" />} {name}
                  </button>
                );
              })}
            </div>
            <p className={`text-xs ${canSave ? 'text-muted-foreground' : 'text-amber-500'}`}>
              {picked.length} selecionados {canSave ? '✓' : `— faltam ${3 - picked.length} pra atingir o mínimo`}
            </p>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={skipToTutorial} disabled={saving}>Pular</Button>
              <Button onClick={savePrefsAndAdvance} disabled={saving || !canSave}>
                Salvar e continuar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-accent" /> Quer um tour rápido?
              </DialogTitle>
              <DialogDescription>
                Temos tutoriais interativos curtinhos sobre perfil, biblioteca, torneios, review completa e mais.
                Você pode ver agora ou abrir depois em <span className="text-foreground">Configurações → Tutoriais</span>.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => closeAndMaybeTutorial(false)}>Agora não</Button>
              <Button onClick={() => closeAndMaybeTutorial(true)}>
                <GraduationCap className="h-4 w-4 mr-1" /> Sim, me mostrar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
