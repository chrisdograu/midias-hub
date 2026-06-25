// Central de desbloqueios cosméticos. Botão com sino + sheet listando últimos
// itens desbloqueados pelo usuário, com link direto para a tela de Customização.
// Emite toast com link "Ver" quando um novo cosmético é desbloqueado em realtime.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Sparkles } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CosmeticPreview } from './CosmeticPreview';
import { GameReward, RARITY_COLOR, KIND_LABEL } from '@/hooks/useCosmetics';
import { toast } from 'sonner';

interface UnlockRow { unlocked_at: string; reward: GameReward; product_title?: string | null }

interface Props {
  /** Para onde levar quando o usuário clicar em "Ir para customização". */
  customizationHref?: string;
  /** Estilo botão (compact = ícone só). */
  variant?: 'compact' | 'full';
}

export function CosmeticUnlocksCenter({ customizationHref = '/perfil', variant = 'compact' }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<UnlockRow[]>([]);
  const [newCount, setNewCount] = useState(0);
  const firstLoadRef = useRef(true);
  const seenKey = user ? `cosmetic-unlocks-seen:${user.id}` : '';

  const reload = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_game_rewards' as any)
      .select('unlocked_at, reward:game_rewards(*, produtos(title))')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false })
      .limit(30);
    const list: UnlockRow[] = (data || []).map((r: any) => ({
      unlocked_at: r.unlocked_at,
      reward: r.reward as GameReward,
      product_title: r.reward?.produtos?.title ?? null,
    }));
    setRows(list);
    const lastSeen = (typeof localStorage !== 'undefined' && seenKey) ? localStorage.getItem(seenKey) : null;
    const nu = lastSeen ? list.filter(l => l.unlocked_at > lastSeen).length : list.length;
    setNewCount(nu);
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [user?.id]);

  // realtime para inserts em user_game_rewards
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`ugr-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_game_rewards', filter: `user_id=eq.${user.id}` },
        async (payload: any) => {
          await reload();
          // Toast só para inserts realtime, não no carregamento inicial
          const rewardId = payload?.new?.reward_id;
          if (!rewardId) return;
          const { data: r } = await supabase
            .from('game_rewards' as any)
            .select('name, kind, rarity')
            .eq('id', rewardId)
            .maybeSingle();
          if (!r) return;
          toast.success(`🎁 Novo cosmético desbloqueado: ${(r as any).name}`, {
            description: `Tipo: ${KIND_LABEL[(r as any).kind] || (r as any).kind}`,
            action: { label: 'Ver', onClick: () => setOpen(true) },
          });
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.id]);

  const markSeen = () => {
    if (rows[0] && seenKey) { localStorage.setItem(seenKey, rows[0].unlocked_at); setNewCount(0); }
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => { setOpen(true); markSeen(); }}
        className={`relative inline-flex items-center gap-1.5 ${variant === 'full' ? 'px-3 py-2 rounded-lg bg-card border border-border text-xs font-semibold hover:border-primary' : 'p-2 rounded-full hover:bg-card/60'}`}
        aria-label="Central de cosméticos desbloqueados"
        title="Desbloqueios de cosméticos"
      >
        <Gift className="h-4 w-4 text-primary" />
        {variant === 'full' && <span>Cosméticos</span>}
        {newCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
            {newCount > 9 ? '9+' : newCount}
          </span>
        )}
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Desbloqueios recentes</SheetTitle>
            <SheetDescription>Cosméticos liberados pelos seus jogos.</SheetDescription>
          </SheetHeader>

          <Link
            to={customizationHref}
            onClick={() => setOpen(false)}
            className="mt-3 mb-4 block py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold text-center text-sm"
          >
            🎨 Ir para customização
          </Link>

          {rows.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-10">
              Ainda nenhum cosmético desbloqueado.
            </div>
          ) : (
            <ul className="space-y-2">
              {rows.map((u, i) => (
                <li key={u.reward.id + i} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card">
                  <CosmeticPreview reward={u.reward} size={48} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${RARITY_COLOR[u.reward.rarity].split(' ')[1]}`}>{u.reward.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {KIND_LABEL[u.reward.kind]} · de {u.product_title || 'jogo'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{new Date(u.unlocked_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
