import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Onboarding leve — só aparece 1x, é pulável, gravado em `profiles.onboarded_at`.
 * O usuário escolhe até 3 gêneros (categorias existentes). Pode ajustar depois em
 * /perfil → seção "Preferências".
 */
export default function OnboardingDialog() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
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

  const finish = async (savePrefs: boolean) => {
    if (!user) return;
    if (savePrefs && picked.length < 3) {
      toast.error('Escolha pelo menos 3 gêneros — ou toque em "Pular" pra decidir depois.');
      return;
    }
    setSaving(true);
    const patch: Record<string, unknown> = { onboarded_at: new Date().toISOString() };
    if (savePrefs) patch.favorite_genres = picked;
    const { error } = await (supabase as any).from('profiles').update(patch).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Não deu pra salvar agora — pode ajustar depois em Configurações.'); return; }
    if (savePrefs) toast.success('Preferências salvas — vamos ajustar seus destaques 👀');
    setOpen(false);
  };

  if (!user) return null;

  const canSave = picked.length >= 3;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish(false); }}>
      <DialogContent className="max-w-lg">
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
          <Button variant="ghost" onClick={() => finish(false)} disabled={saving}>Pular</Button>
          <Button onClick={() => finish(true)} disabled={saving || !canSave}>
            Salvar preferências
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
