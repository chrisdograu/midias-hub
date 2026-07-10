// Aplica banner e accent do loadout global de um perfil de usuário.
// Mostra um botão flutuante para alternar entre versão customizada e padrão.
import { useEffect, useState } from 'react';
import { useUserLoadout } from '@/hooks/useCosmetics';
import { Sparkles, EyeOff } from 'lucide-react';

interface Props {
  ownerId: string | null | undefined;
  /** Esconde o botão flutuante (útil se o pai já controla). */
  hideToggle?: boolean;
  /** Quando true, força o modo padrão. */
  forceDefault?: boolean;
}

export function ProfileCosmeticOverlay({ ownerId, hideToggle, forceDefault }: Props) {
  const { rows } = useUserLoadout(ownerId);
  const [visible, setVisible] = useState(true);

  useEffect(() => { if (forceDefault) setVisible(false); }, [forceDefault]);

  const banner = rows.find(r => r.slot === 'profile_banner')?.reward;
  const accent = rows.find(r => r.slot === 'profile_accent')?.reward;
  const stickers = rows.filter(r => r.slot.startsWith('sticker_')).map(r => r.reward).filter(Boolean);

  if (!banner && !accent && stickers.length === 0) return null;

  return (
    <>
      {!hideToggle && (
        <button
          onClick={() => setVisible(v => !v)}
          className="fixed left-3 bottom-20 sm:bottom-4 z-50 px-3 py-2 rounded-full bg-card/95 backdrop-blur border border-border shadow-lg text-xs font-semibold flex items-center gap-1.5 hover:border-primary transition"
          title={visible ? 'Ver perfil sem customização' : 'Ver customização'}
        >
          {visible ? <><EyeOff className="h-3.5 w-3.5" /> Versão padrão</> : <><Sparkles className="h-3.5 w-3.5 text-primary" /> Customização</>}
        </button>
      )}

      {visible && banner && (
        <div
          className="fixed inset-x-0 top-0 h-40 z-0 pointer-events-none opacity-60"
          style={{
            background: banner.asset_url
              ? `center/cover url(${banner.asset_url})`
              : `linear-gradient(135deg, ${banner.payload?.color || '#A855F7'}, transparent)`,
            maskImage: 'linear-gradient(to bottom, black, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
          }}
        />
      )}

      {visible && accent?.payload?.color && isValidHex(accent.payload.color) && isValidUuid(ownerId) && (
        <style dangerouslySetInnerHTML={{ __html: `
          [data-profile-cosmetic="${ownerId}"] { --primary: ${hexToHsl(accent.payload.color)}; }
        `}} />
      )}

      {visible && stickers.length > 0 && (
        <div className="fixed right-3 top-24 z-30 space-y-2 pointer-events-none">
          {stickers.slice(0, 3).map((s, i) => (
            <div key={s!.id} className="w-12 h-12 rounded-xl bg-card/80 backdrop-blur border border-border flex items-center justify-center text-2xl shadow"
              style={{ transform: `rotate(${(i - 1) * 6}deg)` }}>
              {s!.asset_url ? <img src={s!.asset_url} alt="" className="w-full h-full object-cover rounded-xl" /> : (s!.payload?.emoji || '✨')}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function hexToHsl(hex: string): string {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m) return '174 72% 41%';
  const [r, g, b] = m.map(x => parseInt(x, 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
