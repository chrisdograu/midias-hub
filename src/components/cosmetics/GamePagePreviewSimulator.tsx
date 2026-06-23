// Simulador de página de jogo para o Admin de recompensas.
// Mostra como o GameDetail ficaria com banner/theme/skin/stickers aplicados,
// sem precisar navegar para a página real.
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GameReward } from '@/hooks/useCosmetics';
import { CosmeticPreview } from './CosmeticPreview';

const SLOT_OPTIONS: { slot: string; label: string; kinds: GameReward['kind'][] }[] = [
  { slot: 'banner', label: 'Banner', kinds: ['profile_banner', 'game_page_theme'] },
  { slot: 'theme', label: 'Tema', kinds: ['game_page_theme', 'profile_accent'] },
  { slot: 'card_skin', label: 'Card skin', kinds: ['game_card_skin'] },
  { slot: 'sticker_1', label: 'Adesivo 1', kinds: ['sticker', 'character_icon'] },
  { slot: 'sticker_2', label: 'Adesivo 2', kinds: ['sticker', 'character_icon'] },
];

interface Props { productId: string; rewards: GameReward[]; }

export function GamePagePreviewSimulator({ productId, rewards }: Props) {
  const [product, setProduct] = useState<{ title: string; image_url: string | null; publisher: string | null } | null>(null);
  const [picks, setPicks] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!productId) return;
    supabase.from('produtos').select('title,image_url,publisher').eq('id', productId).maybeSingle()
      .then(({ data }) => setProduct(data as any));
  }, [productId]);

  const slotPick = (slot: string) => rewards.find(r => r.id === picks[slot]) || null;
  const banner = slotPick('banner');
  const theme = slotPick('theme');
  const stickers = ['sticker_1', 'sticker_2'].map(slotPick).filter(Boolean) as GameReward[];

  const themeColor = theme?.payload?.color || '#14B8A6';

  const optionsFor = (slot: typeof SLOT_OPTIONS[number]) =>
    rewards.filter(r => slot.kinds.includes(r.kind) && r.is_active);

  if (!productId) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-bold flex items-center gap-2">🖼️ Simulador da página do jogo</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Escolha recompensas para ver como ficaria o GameDetail sem sair daqui.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
          {SLOT_OPTIONS.map(s => {
            const opts = optionsFor(s);
            return (
              <div key={s.slot}>
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</label>
                <select
                  value={picks[s.slot] || ''}
                  onChange={e => setPicks(p => ({ ...p, [s.slot]: e.target.value }))}
                  className="w-full mt-0.5 px-2 py-1.5 bg-background border border-border rounded-md text-xs"
                >
                  <option value="">— vazio —</option>
                  {opts.map(o => <option key={o.id} value={o.id}>{o.name} ({o.rarity})</option>)}
                </select>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mock GameDetail */}
      <div className="relative" style={{ minHeight: 280 }}>
        {/* Banner overlay */}
        {banner && (
          <div
            className="absolute inset-x-0 top-0 h-40 pointer-events-none opacity-70"
            style={{
              background: banner.asset_url
                ? `center/cover url(${banner.asset_url})`
                : `linear-gradient(135deg, ${banner.payload?.color || themeColor}, transparent)`,
              maskImage: 'linear-gradient(to bottom, black, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
            }}
          />
        )}

        {/* Stickers */}
        {stickers.length > 0 && (
          <div className="absolute right-3 top-3 space-y-2 z-10 pointer-events-none">
            {stickers.map((s, i) => (
              <div key={s.id} className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur border border-border flex items-center justify-center text-xl shadow"
                style={{ transform: `rotate(${(i - 1) * 6}deg)` }}>
                {s.asset_url ? <img src={s.asset_url} alt="" className="w-full h-full object-cover rounded-xl" /> : (s.payload?.emoji || '✨')}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="relative p-5 flex gap-4 items-start z-[1]">
          {/* Cover with optional card skin tint */}
          <div className="relative w-28 h-40 rounded-lg overflow-hidden border-2 shrink-0"
            style={{ borderColor: themeColor }}>
            {product?.image_url
              ? <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-muted" />}
            {slotPick('card_skin') && (
              <div className="absolute inset-0 pointer-events-none mix-blend-overlay"
                style={{ background: `linear-gradient(135deg, ${slotPick('card_skin')?.payload?.color || themeColor}66, transparent 60%)` }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5"
              style={{ background: `${themeColor}22`, color: themeColor }}>
              ✨ preview ao vivo
            </div>
            <h4 className="text-lg font-display font-bold truncate">{product?.title || 'Jogo'}</h4>
            <p className="text-xs text-muted-foreground truncate">{product?.publisher || '—'}</p>
            <div className="mt-3 inline-flex px-3 py-1.5 rounded-md text-xs font-semibold"
              style={{ background: themeColor, color: '#fff' }}>
              Comprar
            </div>
          </div>
        </div>

        {/* Equipped chips */}
        {(banner || theme || stickers.length > 0 || slotPick('card_skin')) && (
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {[banner, theme, slotPick('card_skin'), ...stickers].filter(Boolean).map((r, i) => (
              <div key={(r as GameReward).id + i} className="flex items-center gap-1.5 text-[10px] bg-secondary/60 px-2 py-1 rounded-full">
                <CosmeticPreview reward={r as GameReward} size={18} />
                {(r as GameReward).name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
