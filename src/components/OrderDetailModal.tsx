import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-warning/20 text-warning' },
  confirmed: { label: 'Confirmado', color: 'bg-primary/20 text-primary' },
  processing: { label: 'Processando', color: 'bg-accent/20 text-accent' },
  shipped: { label: 'Enviado', color: 'bg-success/20 text-success' },
  delivered: { label: 'Entregue', color: 'bg-success/20 text-success' },
  cancelled: { label: 'Cancelado', color: 'bg-destructive/20 text-destructive' },
};

interface OrderDetailModalProps {
  pedido: any | null;
  onClose: () => void;
}

export default function OrderDetailModal({ pedido, onClose }: OrderDetailModalProps) {
  if (!pedido) return null;
  const s = statusLabels[pedido.status] || { label: pedido.status, color: 'bg-muted text-muted-foreground' };

  return (
    <Dialog open={!!pedido} onOpenChange={o => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pedido #{pedido.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{new Date(pedido.created_at).toLocaleString('pt-BR')}</span>
            <Badge className={s.color}>{s.label}</Badge>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Itens</p>
            {pedido.itens_pedido?.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <img src={item.produtos?.image_url || '/placeholder.svg'} alt="" className="w-10 h-10 rounded object-cover" />
                <span className="flex-1 text-foreground truncate">{item.produtos?.title || 'Produto'}</span>
                <span className="text-muted-foreground">x{item.quantity}</span>
                <span className="text-price font-semibold">R$ {Number(item.price_at_purchase).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>R$ {Number(pedido.subtotal || 0).toFixed(2)}</span>
            </div>
            {Number(pedido.discount_amount) > 0 && (
              <div className="flex justify-between text-success">
                <span>Desconto {pedido.coupon_code ? `(${pedido.coupon_code})` : ''}</span>
                <span>- R$ {Number(pedido.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-price">R$ {Number(pedido.total).toFixed(2)}</span>
            </div>
            <div className="text-xs text-muted-foreground pt-2">
              Pagamento: {pedido.payment_method === 'pix' ? 'Pix' : pedido.payment_method === 'credit' ? `Cartão ${pedido.installments}x` : 'Boleto'}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
