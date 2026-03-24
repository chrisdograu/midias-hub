import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { CartItem } from '@/lib/cartContext';

export interface Pedido {
  id: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  total: number;
  payment_method: string | null;
  installments: number | null;
  coupon_code: string | null;
  created_at: string;
  itens_pedido?: {
    id: string;
    product_id: string;
    quantity: number;
    price_at_purchase: number;
    produtos?: { title: string; image_url: string | null };
  }[];
}

export function usePedidos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pedidos = [], ...query } = useQuery({
    queryKey: ['pedidos', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, itens_pedido(*, produtos:product_id(title, image_url))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as Pedido[];
    },
    enabled: !!user,
  });

  const criarPedido = useMutation({
    mutationFn: async ({
      items, subtotal, discountAmount, total, paymentMethod, installments, couponCode,
    }: {
      items: CartItem[];
      subtotal: number;
      discountAmount: number;
      total: number;
      paymentMethod: string;
      installments: number;
      couponCode: string | null;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          user_id: user.id,
          subtotal,
          discount_amount: discountAmount,
          total,
          payment_method: paymentMethod,
          installments,
          coupon_code: couponCode,
          status: 'confirmed',
        })
        .select()
        .single();
      if (pedidoError) throw pedidoError;

      const itens = items.map(item => ({
        order_id: pedido.id,
        product_id: item.game.id,
        quantity: item.quantity,
        price_at_purchase: item.game.price,
      }));
      const { error: itensError } = await supabase.from('itens_pedido').insert(itens);
      if (itensError) throw itensError;

      return pedido;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pedidos'] }),
  });

  return { pedidos, criarPedido, isLoading: query.isLoading };
}
