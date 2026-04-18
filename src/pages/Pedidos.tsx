import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePedidos } from '@/hooks/usePedidos';
import { Package, Loader2, ArrowLeft, Eye } from 'lucide-react';
import OrderDetailModal from '@/components/OrderDetailModal';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-warning/20 text-warning' },
  confirmed: { label: 'Confirmado', color: 'bg-primary/20 text-primary' },
  processing: { label: 'Processando', color: 'bg-accent/20 text-accent' },
  shipped: { label: 'Enviado', color: 'bg-success/20 text-success' },
  delivered: { label: 'Entregue', color: 'bg-success/20 text-success' },
  cancelled: { label: 'Cancelado', color: 'bg-destructive/20 text-destructive' },
};

export default function Pedidos() {
  const { pedidos, isLoading } = usePedidos();
  const [selected, setSelected] = useState<any | null>(null);

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-6">Meus Pedidos</h1>

      {pedidos.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Nenhum pedido encontrado.</p>
          <Link to="/catalogo" className="text-primary hover:underline mt-2 inline-block">Explorar catálogo</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map(pedido => {
            const s = statusLabels[pedido.status] || { label: pedido.status, color: 'bg-muted text-muted-foreground' };
            return (
              <button
                key={pedido.id}
                onClick={() => setSelected(pedido)}
                className="w-full text-left bg-card border border-border rounded-xl p-4 space-y-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Pedido #{pedido.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(pedido.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${s.color}`}>{s.label}</span>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                {pedido.itens_pedido?.slice(0, 2).map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <img src={item.produtos?.image_url || '/placeholder.svg'} alt="" className="w-10 h-10 rounded object-cover" />
                    <span className="flex-1 text-foreground truncate">{item.produtos?.title || 'Produto'}</span>
                    <span className="text-muted-foreground">x{item.quantity}</span>
                    <span className="text-price font-semibold">R$ {Number(item.price_at_purchase).toFixed(2)}</span>
                  </div>
                ))}
                {(pedido.itens_pedido?.length || 0) > 2 && (
                  <p className="text-xs text-muted-foreground">+ {(pedido.itens_pedido?.length || 0) - 2} item(ns)</p>
                )}
                <div className="flex justify-between items-center border-t border-border pt-3">
                  <div className="text-xs text-muted-foreground">
                    {pedido.payment_method === 'pix' ? 'Pix' : pedido.payment_method === 'credit' ? `Cartão ${pedido.installments}x` : 'Boleto'}
                    {pedido.coupon_code && ` • Cupom: ${pedido.coupon_code}`}
                  </div>
                  <span className="font-bold text-price">R$ {Number(pedido.total).toFixed(2)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <OrderDetailModal pedido={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
