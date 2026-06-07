import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { EyeOff, Eye } from 'lucide-react';
import { toast } from 'sonner';

type Scope = 'feed' | 'social_library' | 'both';

interface Props {
  productId: string;
  scope?: Scope;
  className?: string;
  size?: 'sm' | 'md';
  initialMuted?: boolean;
}

export default function MuteGameButton({ productId, scope = 'both', className = '', size = 'sm', initialMuted = false }: Props) {
  const { user } = useAuth();
  const [muted, setMuted] = useState(initialMuted);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const toggle = async () => {
    setLoading(true);
    if (muted) {
      await supabase.from('user_game_mutes' as any).delete().match({ user_id: user.id, product_id: productId });
      setMuted(false);
      toast.success('Conteúdo deste jogo voltou a aparecer');
    } else {
      const { error } = await supabase.from('user_game_mutes' as any).upsert(
        { user_id: user.id, product_id: productId, scope } as any,
        { onConflict: 'user_id,product_id' }
      );
      if (error) { toast.error('Erro ao silenciar'); setLoading(false); return; }
      setMuted(true);
      toast.success('Você não verá mais conteúdo deste jogo');
    }
    setLoading(false);
  };

  const Icon = muted ? Eye : EyeOff;
  const label = muted ? 'Mostrar este jogo' : 'Não mostrar mais este jogo';
  const px = size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-3 py-2 text-xs';

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 ${px} rounded-md bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted transition disabled:opacity-50 ${className}`}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}
