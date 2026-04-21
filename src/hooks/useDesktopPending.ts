import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PendingCounts {
  denuncias: number;
  certificados: number;
  pedidos: number;
  propostas: number;
}

const initial: PendingCounts = { denuncias: 0, certificados: 0, pedidos: 0, propostas: 0 };

/**
 * Consulta contagens de itens pendentes para mostrar como badges no menu lateral.
 * Atualiza em tempo real via Supabase Realtime quando algo muda.
 */
export function useDesktopPending(enabled: boolean) {
  const [counts, setCounts] = useState<PendingCounts>(initial);

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    const fetchAll = async () => {
      const [denuncias, certificados, pedidos, propostas] = await Promise.all([
        supabase.from('denuncias').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('certificados').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('pedidos').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('trade_proposals').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      if (!active) return;
      setCounts({
        denuncias: denuncias.count || 0,
        certificados: certificados.count || 0,
        pedidos: pedidos.count || 0,
        propostas: propostas.count || 0,
      });
    };

    fetchAll();

    // Realtime: refetch quando qualquer uma das tabelas mudar
    const channel = supabase
      .channel('desktop-pending-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'denuncias' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'certificados' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trade_proposals' }, fetchAll)
      .subscribe();

    // Refresh a cada 60s como fallback caso Realtime não esteja habilitado
    const interval = setInterval(fetchAll, 60_000);

    return () => {
      active = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [enabled]);

  return counts;
}
