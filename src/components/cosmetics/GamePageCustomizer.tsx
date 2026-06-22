// Modal lateral para o dono da biblioteca personalizar a página de um jogo.
// Permite escolher banner/theme/skin/stickers a partir de QUALQUER reward desbloqueado.
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useMyCosmeticInventory, useGamePageLoadout, equipGamePageSlot,
  RewardKind,
} from '@/hooks/useCosmetics';
import { CosmeticPreview } from './CosmeticPreview';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const PAGE_SLOTS: { slot: string; label: string; kinds: RewardKind[] }[] = [
  { slot: 'banner', label: 'Banner da página', kinds: ['profile_banner', 'game_page_theme'] },
  { slot: 'theme', label: 'Tema visual', kinds: ['game_page_theme', 'profile_accent'] },
  { slot: 'card_skin', label: 'Skin do card', kinds: ['game_card_skin'] },
  { slot: 'sticker_1', label: 'Adesivo 1', kinds: ['sticker', 'character_icon'] },
  { slot: 'sticker_2', label: 'Adesivo 2', kinds: ['sticker', 'character_icon'] },
  { slot: 'sticker_3', label: 'Adesivo 3', kinds: ['sticker', 'character_icon'] },
];

export function GamePageCustomizer({
  productId, open, onOpenChange,
}: { productId: string; open: boolean; onOpenChange: (b: boolean) => void }) {
  const { user } = useAuth();
  const { rows: inventory } = useMyCosmeticInventory();
  const { rows: loadout, reload } = useGamePageLoadout(user?.id, productId);
  const [activeSlot, setActiveSlot] = useState<string>('banner');

  const slotMeta = useMemo(() => PAGE_SLOTS.find(s => s.slot === activeSlot)!, [activeSlot]);
  const eligible = inventory.filter(r => slotMeta.kinds.includes(r.reward.kind));
  const equippedId = (slot: string) => loadout.find(l => l.slot === slot)?.reward_id;

  const equip = async (rewardId: string | null) => {
    if (!user) return;
    const cur = equippedId(activeSlot);
    const next = rewardId === cur ? null : rewardId;
    const { error } = await equipGamePageSlot(user.id, productId, activeSlot, next);
    if (error) {
      toast.error('Você precisa ter este jogo na sua biblioteca para personalizar.');
      return;
    }
    reload();
    toast.success(next ? 'Equipado nesta página' : 'Removido');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>🎨 Personalizar esta página</SheetTitle>
          <SheetDescription>
            Escolha cosméticos desbloqueados em <strong>qualquer jogo</strong> para decorar esta página.
          </SheetDescription>
        </SheetHeader>

        <div className="flex gap-1.5 overflow-x-auto py-3 -mx-1 px-1">
          {PAGE_SLOTS.map(s => (
            <button
              key={s.slot}
              onClick={() => setActiveSlot(s.slot)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition ${
                activeSlot === s.slot ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary/50'
              }`}>
              {s.label}
              {equippedId(s.slot) && <span className="ml-1">●</span>}
            </button>
          ))}
        </div>

        {eligible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Você ainda não tem cosméticos compatíveis com este slot.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {eligible.map(({ reward, product_title }) => {
              const isEq = equippedId(activeSlot) === reward.id;
              return (
                <button
                  key={reward.id}
                  onClick={() => equip(reward.id)}
                  className={`p-2 rounded-xl border bg-card flex flex-col items-center gap-1 transition hover:border-primary/60 ${isEq ? 'ring-2 ring-primary' : 'border-border'}`}
                >
                  <CosmeticPreview reward={reward} size={64} />
                  <p className="text-[11px] font-semibold line-clamp-1">{reward.name}</p>
                  <p className="text-[9px] text-muted-foreground line-clamp-1">de {product_title}</p>
                </button>
              );
            })}
          </div>
        )}

        {equippedId(activeSlot) && (
          <button onClick={() => equip(null)} className="mt-3 w-full py-2 rounded-lg border border-destructive/50 text-destructive text-xs font-semibold flex items-center justify-center gap-1">
            <X className="h-3 w-3" /> Remover deste slot
          </button>
        )}
      </SheetContent>
    </Sheet>
  );
}
