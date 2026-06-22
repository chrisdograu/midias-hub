// Renderiza um preview visual de uma recompensa cosmética.
// Usa asset_url quando existir; senão renderiza um placeholder CSS/SVG
// baseado no `kind`, `payload.color` e `payload.emoji`.
import { GameReward, RARITY_COLOR, KIND_EMOJI } from '@/hooks/useCosmetics';

export function CosmeticPreview({ reward, size = 64 }: { reward: GameReward; size?: number }) {
  const color = reward.payload?.color || '#14B8A6';
  const emoji = reward.payload?.emoji || KIND_EMOJI[reward.kind];
  const rarityRing = RARITY_COLOR[reward.rarity].split(' ')[0];

  if (reward.asset_url) {
    return (
      <div
        className={`rounded-xl overflow-hidden border-2 ${rarityRing} bg-card`}
        style={{ width: size, height: size }}
      >
        <img src={reward.asset_url} alt={reward.name} className="w-full h-full object-cover" loading="lazy" />
      </div>
    );
  }

  if (reward.kind === 'profile_banner' || reward.kind === 'game_page_theme') {
    return (
      <div
        className={`rounded-xl border-2 ${rarityRing} relative overflow-hidden`}
        style={{ width: size * 2, height: size, background: `linear-gradient(135deg, ${color}, ${color}40)` }}
      >
        <div className="absolute inset-0 opacity-50 mix-blend-overlay"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,.4), transparent 40%)' }} />
        <span className="absolute bottom-1 right-2 text-lg">{emoji}</span>
      </div>
    );
  }

  if (reward.kind === 'profile_accent') {
    return (
      <div className={`rounded-full border-2 ${rarityRing} flex items-center justify-center`}
        style={{ width: size, height: size, background: color }}>
        <span className="text-2xl">{emoji}</span>
      </div>
    );
  }

  // avatar_frame, character_icon, sticker, game_card_skin (default)
  return (
    <div
      className={`rounded-xl border-2 ${rarityRing} flex items-center justify-center bg-card`}
      style={{ width: size, height: size, boxShadow: `0 0 20px ${color}55 inset` }}
    >
      <span className="text-3xl">{emoji}</span>
    </div>
  );
}
