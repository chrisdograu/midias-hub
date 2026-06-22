// Grid do inventário de cosméticos do usuário, agrupado por jogo de origem.
// Permite equipar/desequipar nos slots do loadout global de perfil.
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useMyCosmeticInventory, useUserLoadout, equipGlobalSlot,
  RARITY_COLOR, KIND_LABEL, RewardKind,
} from '@/hooks/useCosmetics';
import { CosmeticPreview } from './CosmeticPreview';
import { Loader2, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

const SLOT_FOR_KIND: Partial<Record<RewardKind, string>> = {
  avatar_frame: 'avatar_frame',
  profile_banner: 'profile_banner',
  profile_accent: 'profile_accent',
};

export function CosmeticInventoryGrid() {
  const { user } = useAuth();
  const { rows, loading, reload } = useMyCosmeticInventory();
  const { rows: loadout, reload: reloadLoadout } = useUserLoadout(user?.id);
  const [filter, setFilter] = useState<RewardKind | 'all'>('all');

  const grouped = useMemo(() => {
    const map: Record<string, typeof rows> = {};
    rows.filter(r => filter === 'all' || r.reward.kind === filter).forEach(r => {
      const k = r.product_title || 'Outros';
      (map[k] ||= []).push(r);
    });
    return map;
  }, [rows, filter]);

  const equippedId = (slot: string) => loadout.find(l => l.slot === slot)?.reward_id;

  const handleEquip = async (rewardId: string, kind: RewardKind) => {
    if (!user) return;
    const slot = SLOT_FOR_KIND[kind];
    if (!slot) {
      // sticker: rota livre — pega o primeiro slot livre dentre sticker_1..3
      const stickerSlots = ['sticker_1', 'sticker_2', 'sticker_3'];
      const free = stickerSlots.find(s => !loadout.find(l => l.slot === s)) || 'sticker_1';
      await equipGlobalSlot(user.id, free, rewardId);
    } else {
      const current = equippedId(slot);
      await equipGlobalSlot(user.id, slot, current === rewardId ? null : rewardId);
    }
    reloadLoadout();
    toast.success('Loadout atualizado');
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Ainda nenhum cosmético desbloqueado. Jogue, escreva reviews e participe dos fóruns dos seus jogos para liberar recompensas exclusivas 🎁
      </div>
    );
  }

  const filters: (RewardKind | 'all')[] = ['all','avatar_frame','profile_banner','profile_accent','sticker','character_icon','game_page_theme','game_card_skin'];

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
              filter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary/50'
            }`}>
            {f === 'all' ? 'Todos' : KIND_LABEL[f]}
          </button>
        ))}
      </div>

      {Object.entries(grouped).map(([game, items]) => (
        <section key={game}>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">🎮 {game}</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {items.map(({ reward }) => {
              const slot = SLOT_FOR_KIND[reward.kind];
              const isEquipped = slot ? equippedId(slot) === reward.id : loadout.some(l => l.reward_id === reward.id);
              return (
                <button
                  key={reward.id}
                  onClick={() => handleEquip(reward.id, reward.kind)}
                  className={`p-2 rounded-xl border bg-card flex flex-col items-center gap-1 transition hover:border-primary/60 ${isEquipped ? 'ring-2 ring-primary' : 'border-border'}`}
                >
                  <CosmeticPreview reward={reward} size={56} />
                  <p className={`text-[10px] font-semibold line-clamp-1 ${RARITY_COLOR[reward.rarity].split(' ')[1]}`}>{reward.name}</p>
                  <p className="text-[9px] text-muted-foreground">{KIND_LABEL[reward.kind]}</p>
                  {isEquipped && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] text-primary font-bold">
                      <CheckCircle2 className="h-3 w-3" /> Equipado
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
