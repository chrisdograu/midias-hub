import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Copy, Sparkles, Gamepad2, Gift, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function PreferencesPanel() {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [redeemInput, setRedeemInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    if (!user || loaded) return;
    (async () => {
      const [{ data: prof }, { data: cats }] = await Promise.all([
        (supabase as any).rpc('get_my_profile'),
        supabase.from('categorias').select('name').order('name'),
      ]);
      const row = Array.isArray(prof) ? prof[0] : prof;
      setCategories((cats || []).map((c: { name: string }) => c.name));
      if (row) {
        setPicked(row.favorite_genres || []);
        setReferralCode(row.referral_code || null);
        setReferredBy(row.referred_by || null);
      }
      setLoaded(true);
    })();
  }, [user, loaded]);

  const toggle = (name: string) => {
    setPicked(prev => {
      if (prev.includes(name)) return prev.filter(x => x !== name);
      if (prev.length >= 3) return prev;
      return [...prev, name];
    });
  };

  const savePrefs = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ favorite_genres: picked }).eq('id', user.id);
    setSaving(false);
    if (error) toast.error('Erro ao salvar preferências');
    else toast.success('Preferências atualizadas');
  };

  const copyCode = async () => {
    if (!referralCode) return;
    await navigator.clipboard.writeText(referralCode);
    toast.success('Código copiado!');
  };

  const redeem = async () => {
    const code = redeemInput.trim().toUpperCase();
    if (!code) return;
    setRedeeming(true);
    const { data, error } = await (supabase as any).rpc('redeem_referral', { _code: code });
    setRedeeming(false);
    if (error) { toast.error('Erro ao resgatar código'); return; }
    if (!data?.ok) {
      const err = data?.error;
      if (err === 'already_redeemed') toast.error('Você já resgatou um código de indicação.');
      else if (err === 'invalid_code') toast.error('Código inválido.');
      else toast.error('Não foi possível resgatar agora.');
      return;
    }
    toast.success('Código resgatado! +100 XP pra você, +200 pra quem te indicou.');
    setReferredBy(data.referrer);
    setRedeemInput('');
  };

  if (!user) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-4 space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-primary" /> Preferências
        </h2>
        <p className="text-xs text-muted-foreground mb-3">Até 3 gêneros favoritos — usados nas recomendações e no radar.</p>
        <div className="flex flex-wrap gap-2">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem categorias cadastradas ainda.</p>
          ) : categories.map(name => {
            const active = picked.includes(name);
            const disabled = !active && picked.length >= 3;
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggle(name)}
                disabled={disabled}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm border transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary text-foreground border-border hover:border-primary/60 disabled:opacity-40'
                }`}
              >
                {active && <Check className="h-3.5 w-3.5" />} {name}
              </button>
            );
          })}
        </div>
        <div className="flex justify-end mt-3">
          <Button size="sm" onClick={savePrefs} disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            Salvar preferências
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
          <Gamepad2 className="h-4 w-4 text-primary" /> Plataformas conectadas
        </h3>
        <p className="text-xs text-muted-foreground mb-3">Puxe sua biblioteca de outras plataformas.</p>
        <button
          type="button"
          disabled
          title="Em breve — a integração ficará disponível numa próxima atualização."
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm border border-border bg-secondary text-muted-foreground cursor-not-allowed"
        >
          <Gamepad2 className="h-4 w-4" /> Conectar Steam
          <span className="ml-1 text-[10px] uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded">em breve</span>
        </button>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-1">
          <Gift className="h-4 w-4 text-primary" /> Indicação
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Compartilhe seu código. Quem entrar e resgatar ganha <strong>100 XP</strong>; você ganha <strong>200 XP</strong> por indicação.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg font-mono text-sm">
            {referralCode ?? '—'}
          </div>
          <Button variant="outline" size="sm" onClick={copyCode} disabled={!referralCode}>
            <Copy className="h-4 w-4 mr-1" /> Copiar
          </Button>
        </div>

        {referredBy ? (
          <p className="text-xs text-muted-foreground">Você já resgatou um código de indicação — obrigado por vir com convite!</p>
        ) : (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tem um código de amigo? Cole aqui:</label>
            <div className="flex items-center gap-2">
              <input
                value={redeemInput}
                onChange={e => setRedeemInput(e.target.value.toUpperCase())}
                placeholder="EX.: A1B2C3D4"
                maxLength={12}
                className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button size="sm" onClick={redeem} disabled={redeeming || !redeemInput.trim()}>
                {redeeming && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                Resgatar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
