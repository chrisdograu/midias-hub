import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Check, Loader2, Copy, Gamepad2, Gift, Info, X } from 'lucide-react';
import { toast } from 'sonner';

const MIN_GENRES = 3;

/**
 * Espelho mobile do PreferencesPanel (web).
 * Mesmas regras: mínimo 3 gêneros / sem máximo, Steam AFK, código de indicação.
 */
export default function MPreferencesSection() {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [savedPicked, setSavedPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [redeemInput, setRedeemInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const [steamOpen, setSteamOpen] = useState(false);

  const refresh = async () => {
    const [{ data: prof }, { data: cats }] = await Promise.all([
      (supabase as any).rpc('get_my_profile'),
      supabase.from('categorias').select('name').order('name'),
    ]);
    const row = Array.isArray(prof) ? prof[0] : prof;
    setCategories((cats || []).map((c: { name: string }) => c.name));
    if (row) {
      const genres = row.favorite_genres || [];
      setPicked(genres);
      setSavedPicked(genres);
      setReferralCode(row.referral_code || null);
      setReferredBy(row.referred_by || null);
    }
  };

  useEffect(() => {
    if (!user || loaded) return;
    (async () => { await refresh(); setLoaded(true); })();
  }, [user, loaded]);

  const toggle = (name: string) =>
    setPicked(p => p.includes(name) ? p.filter(x => x !== name) : [...p, name]);

  const dirty = JSON.stringify([...picked].sort()) !== JSON.stringify([...savedPicked].sort());
  const canSave = picked.length >= MIN_GENRES && dirty;

  const savePrefs = async () => {
    if (!user) return;
    if (picked.length < MIN_GENRES) { toast.error(`Escolha pelo menos ${MIN_GENRES} gêneros.`); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ favorite_genres: picked }).eq('id', user.id);
    if (error) { setSaving(false); toast.error('Erro ao salvar preferências'); return; }
    await refresh();
    setSaving(false);
    toast.success('Preferências salvas');
  };

  const copyCode = async () => {
    if (!referralCode) return;
    try { await navigator.clipboard.writeText(referralCode); toast.success('Código copiado!'); }
    catch { toast.error('Não deu pra copiar automaticamente.'); }
  };

  const redeem = async () => {
    const code = redeemInput.trim().toUpperCase();
    if (!code) return;
    setRedeeming(true);
    const { data, error } = await (supabase as any).rpc('redeem_referral', { _code: code });
    if (error) { setRedeeming(false); toast.error('Erro ao resgatar código'); return; }
    if (!data?.ok) {
      setRedeeming(false);
      const err = data?.error;
      if (err === 'already_redeemed') toast.error('Você já resgatou um código de indicação.');
      else if (err === 'invalid_code') toast.error('Código inválido.');
      else if (err === 'self_referral') toast.error('Você não pode usar seu próprio código.');
      else toast.error('Não foi possível resgatar agora.');
      return;
    }
    await refresh();
    setRedeeming(false);
    toast.success('Código resgatado! +100 XP pra você, +200 pra quem te indicou.');
    setRedeemInput('');
  };

  if (!user) return null;

  return (
    <div className="glass rounded-2xl p-4 space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-primary" /> Preferências
      </h2>

      <div>
        <p className="text-[11px] text-muted-foreground mb-2">
          Mínimo <strong className="text-foreground">{MIN_GENRES}</strong> gêneros, sem limite máximo — usados nas recomendações.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {categories.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem categorias cadastradas ainda.</p>
          ) : categories.map(name => {
            const active = picked.includes(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => toggle(name)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] border ${
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
        <div className="flex items-center justify-between mt-2 gap-2">
          <p className={`text-[10px] ${picked.length >= MIN_GENRES ? 'text-muted-foreground' : 'text-amber-500'}`}>
            {picked.length} selecionados {picked.length >= MIN_GENRES
              ? (dirty ? '· não salvos' : '✓ salvos')
              : `— faltam ${MIN_GENRES - picked.length}`}
          </p>
          <button
            onClick={savePrefs}
            disabled={saving || !canSave}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3 w-3 animate-spin" />} Salvar
          </button>
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
          <Gamepad2 className="h-3.5 w-3.5 text-primary" /> Plataformas conectadas
        </h3>
        <button
          type="button"
          onClick={() => setSteamOpen(true)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs border border-border bg-secondary text-foreground"
        >
          <Gamepad2 className="h-3.5 w-3.5" /> Conectar Steam
          <span className="ml-1 text-[9px] uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded">em breve</span>
        </button>
      </div>

      <div className="border-t border-border pt-3">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
          <Gift className="h-3.5 w-3.5 text-primary" /> Indicação
        </h3>
        <p className="text-[10px] text-muted-foreground mb-2">
          Compartilhe seu código. Quem resgatar ganha <strong>100 XP</strong>; você ganha <strong>200 XP</strong> por indicação.
        </p>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 px-2.5 py-1.5 bg-secondary border border-border rounded-lg font-mono text-xs">
            {referralCode ?? '—'}
          </div>
          <button
            onClick={copyCode}
            disabled={!referralCode}
            className="px-2.5 py-1.5 rounded-lg border border-border text-xs flex items-center gap-1 disabled:opacity-50"
          >
            <Copy className="h-3 w-3" /> Copiar
          </button>
        </div>
        {referredBy ? (
          <p className="text-[10px] text-muted-foreground">Você já resgatou um código de indicação.</p>
        ) : (
          <div>
            <label className="text-[10px] text-muted-foreground mb-1 block">Tem um código de amigo?</label>
            <div className="flex items-center gap-2">
              <input
                value={redeemInput}
                onChange={e => setRedeemInput(e.target.value.toUpperCase())}
                placeholder="EX.: A1B2C3D4"
                maxLength={12}
                className="flex-1 px-2.5 py-1.5 bg-secondary border border-border rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={redeem}
                disabled={redeeming || !redeemInput.trim()}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                {redeeming && <Loader2 className="h-3 w-3 animate-spin" />} Resgatar
              </button>
            </div>
          </div>
        )}
      </div>

      {steamOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSteamOpen(false)}>
          <div className="w-full max-w-md bg-background border-t border-border rounded-t-2xl p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-primary" /> Steam — em breve
              </h3>
              <button onClick={() => setSteamOpen(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="flex gap-2 items-start rounded-lg border border-amber-500/40 bg-amber-500/10 p-2.5">
              <Info className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-500 mb-0.5">Modo AFK</p>
                <p className="text-[10px] text-muted-foreground">
                  Botão desligado por padrão — reserva o lugar na interface. Nenhum dado seu é enviado à Steam agora.
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1">O que virá:</p>
              <ol className="list-decimal list-inside text-[10px] text-muted-foreground space-y-0.5">
                <li>Login via SteamID / OpenID.</li>
                <li>Import da biblioteca pública + tempo de jogo.</li>
                <li>Jogos aparecem com selo <em>via Steam</em>.</li>
                <li>Desconectar a qualquer momento.</li>
              </ol>
            </div>
            <button onClick={() => setSteamOpen(false)} className="w-full py-2 rounded-lg border border-border text-xs font-semibold">Entendi</button>
          </div>
        </div>
      )}
    </div>
  );
}
