import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRadarDelta } from '@/hooks/useRadarDelta';
import { useMutualFriends } from '@/hooks/useFriendActivity';

import GameCard from '@/components/GameCard';
import { mapProdutoToGame, type Game } from '@/lib/gameData';
import { Percent, Rocket, Target, Sparkles, ChevronRight } from 'lucide-react';

interface Shelf {
  id: string;
  title: string;
  icon: React.ReactNode;
  evidence: string;
  games: Game[];
  weight: number;
}

async function fetchByIds(ids: string[]): Promise<Game[]> {
  if (!ids.length) return [];
  const { data } = await supabase
    .from('produtos')
    .select('*')
    .in('id', ids)
    .eq('is_active', true)
    .gt('stock', 0);
  const map = new Map((data || []).map((r: any) => [r.id, mapProdutoToGame(r)]));
  return ids.map(id => map.get(id)).filter((g): g is Game => !!g);
}

export default function OpportunityCenter() {
  const { user } = useAuth();
  const { data: radar = [] } = useRadarDelta(8);
  const { data: friendIds = [] } = useMutualFriends();


  // Big deals
  const dealsQ = useQuery({
    queryKey: ['opp-deals'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from('produtos')
        .select('*')
        .eq('is_active', true)
        .gt('stock', 0)
        .gt('discount', 0)
        .order('discount', { ascending: false })
        .limit(8);
      return (data || []).map((r: any) => mapProdutoToGame(r));
    },
  });

  // Movement (from radar)
  const movementQ = useQuery({
    queryKey: ['opp-movement', radar.map(r => r.product_id).join(',')],
    enabled: radar.length > 0,
    staleTime: 5 * 60_000,
    queryFn: () => fetchByIds(radar.map(r => r.product_id)),
  });

  // Próximos da sua órbita: jogos populares entre amigos mútuos (reusa cache de `useMutualFriends`)
  const orbitQ = useQuery({
    queryKey: ['opp-orbit', user?.id, friendIds.length],
    enabled: !!user && friendIds.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const [{ data: libs }, { data: mine }] = await Promise.all([
        supabase.from('biblioteca_usuario').select('product_id').in('user_id', friendIds).limit(40),
        supabase.from('biblioteca_usuario').select('product_id').eq('user_id', user!.id),
      ]);
      const owned = new Set((mine || []).map((r: any) => r.product_id));
      const counts = new Map<string, number>();
      (libs || []).forEach((r: any) => {
        if (owned.has(r.product_id)) return;
        counts.set(r.product_id, (counts.get(r.product_id) || 0) + 1);
      });
      const ids = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id]) => id);
      return fetchByIds(ids);
    },
  });


  // Fora da sua bolha: rating >= 4.25, categorias fora do histórico
  const bubbleQ = useQuery({
    queryKey: ['opp-outside', user?.id],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      let excludedCats: string[] = [];
      if (user) {
        const { data: lib } = await supabase
          .from('biblioteca_usuario')
          .select('product_id')
          .eq('user_id', user.id)
          .limit(30);
        const ids = (lib || []).map((r: any) => r.product_id);
        if (ids.length) {
          const { data: cats } = await supabase.from('produtos').select('category').in('id', ids);
          excludedCats = [...new Set((cats || []).map((r: any) => r.category).filter(Boolean))];
        }
      }
      let q = supabase
        .from('produtos')
        .select('*')
        .eq('is_active', true)
        .gt('stock', 0)
        .gte('rating', 4.25)
        .order('rating', { ascending: false })
        .limit(8);
      if (excludedCats.length) q = q.not('category', 'in', `(${excludedCats.map(c => `"${c}"`).join(',')})`);
      const { data } = await q;
      return (data || []).map((r: any) => mapProdutoToGame(r));
    },
  });

  const shelves = useMemo<Shelf[]>(() => {
    const arr: Shelf[] = [];
    if (dealsQ.data?.length) {
      const top = Math.max(...dealsQ.data.map(g => g.discount));
      arr.push({
        id: 'deals', title: '💰 Grandes Oportunidades', icon: <Percent className="h-4 w-4 text-price" />,
        evidence: `Maior desconto agora: −${top}%`, games: dealsQ.data, weight: dealsQ.data.length * 1.5,
      });
    }
    if (movementQ.data?.length) {
      arr.push({
        id: 'move', title: '🚀 Em Movimento', icon: <Rocket className="h-4 w-4 text-primary" />,
        evidence: `Calor recente em ${movementQ.data.length} jogos (24–72h)`,
        games: movementQ.data, weight: movementQ.data.length * 2,
      });
    }
    if (orbitQ.data?.length) {
      arr.push({
        id: 'orbit', title: '🎯 Próximos da Sua Órbita', icon: <Target className="h-4 w-4 text-accent" />,
        evidence: `Jogos populares entre seus amigos próximos`,
        games: orbitQ.data, weight: orbitQ.data.length * 1.2,
      });
    }
    if (bubbleQ.data?.length) {
      arr.push({
        id: 'bubble', title: '✨ Fora da Sua Bolha', icon: <Sparkles className="h-4 w-4 text-accent" />,
        evidence: `Aclamados (≥4.25★) em categorias que você não costuma jogar`,
        games: bubbleQ.data, weight: bubbleQ.data.length,
      });
    }
    return arr.sort((a, b) => b.weight - a.weight);
  }, [dealsQ.data, movementQ.data, orbitQ.data, bubbleQ.data]);

  const anyLoading = dealsQ.isLoading || movementQ.isLoading || orbitQ.isLoading || bubbleQ.isLoading;

  if (!anyLoading && shelves.length === 0) {
    return (
      <section className="container mx-auto px-4 pt-8">
        <div className="rounded-xl border border-border/60 bg-card/50 p-5 text-sm text-muted-foreground italic text-center">
          🛰️ Sem oportunidades quentes agora. Volte mais tarde.
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-10">
      {shelves.map(shelf => (
        <section key={shelf.id} className="container mx-auto px-4">
          <header className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">{shelf.icon}{shelf.title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{shelf.evidence}</p>
            </div>
            <Link to="/catalogo" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver mais <ChevronRight className="h-4 w-4" />
            </Link>
          </header>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {shelf.games.slice(0, 6).map((g, i) => <GameCard key={g.id} game={g} index={i} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
