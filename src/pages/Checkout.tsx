import { useState } from 'react';
import { useCart } from '@/lib/cartStore';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, QrCode, Building, ShieldCheck, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

type PaymentMethod = 'credit' | 'pix' | 'boleto';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit');
  const [installments, setInstallments] = useState(1);
  const [processing, setProcessing] = useState(false);

  const installmentOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  const handlePurchase = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      clearCart();
      toast.success('Compra realizada com sucesso! (simulação)');
      navigate('/');
    }, 2000);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-xl text-muted-foreground mb-4">Seu carrinho está vazio.</p>
        <Link to="/catalogo" className="text-primary hover:underline">Ir para o catálogo</Link>
      </div>
    );
  }

  const pixDiscount = total * 0.05;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/carrinho" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar ao carrinho
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">Finalizar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Payment options */}
        <div className="lg:col-span-3 space-y-6">
          {/* Items summary */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h2 className="font-semibold text-foreground">Itens ({items.length})</h2>
            {items.map(item => (
              <div key={item.game.id} className="flex items-center gap-3 text-sm">
                <img src={item.game.image} alt={item.game.title} className="w-10 h-10 rounded object-cover" />
                <span className="flex-1 text-foreground truncate">{item.game.title}</span>
                <span className="text-muted-foreground">x{item.quantity}</span>
                <span className="text-price font-semibold">R$ {(item.game.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Payment method */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <h2 className="font-semibold text-foreground">Método de Pagamento</h2>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'credit' as const, icon: CreditCard, label: 'Cartão' },
                { id: 'pix' as const, icon: QrCode, label: 'Pix' },
                { id: 'boleto' as const, icon: Building, label: 'Boleto' },
              ]).map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-sm font-medium transition-all ${
                    paymentMethod === method.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  <method.icon className="h-5 w-5" />
                  {method.label}
                </button>
              ))}
            </div>

            {paymentMethod === 'credit' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <input placeholder="Número do cartão" className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="MM/AA" className="px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <input placeholder="CVV" className="px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <input placeholder="Nome no cartão" className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Parcelas</label>
                  <select
                    value={installments}
                    onChange={e => setInstallments(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {installmentOptions.map(n => (
                      <option key={n} value={n}>
                        {n}x de R$ {(total / n).toFixed(2)} {n <= 6 ? 'sem juros' : `(${((n - 6) * 1.5 + 100).toFixed(1)}%)`}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {paymentMethod === 'pix' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4 space-y-3">
                <div className="w-40 h-40 mx-auto bg-secondary rounded-xl flex items-center justify-center border border-border">
                  <QrCode className="h-24 w-24 text-muted-foreground" />
                </div>
                <p className="text-sm text-success font-medium">5% de desconto no Pix!</p>
                <p className="text-sm text-muted-foreground">Escaneie o QR Code ou copie o código para pagar</p>
                <div className="bg-secondary p-2 rounded-lg text-xs text-muted-foreground break-all font-mono">
                  00020126580014br.gov.bcb.pix0136...simulação...
                </div>
              </motion.div>
            )}

            {paymentMethod === 'boleto' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <p className="text-sm text-muted-foreground">O boleto será gerado após confirmar a compra. Prazo de pagamento: 3 dias úteis.</p>
                <input placeholder="CPF" className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Order total */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4 sticky top-20">
            <h2 className="text-lg font-bold text-foreground">Total do Pedido</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {total.toFixed(2)}</span></div>
              {paymentMethod === 'pix' && (
                <div className="flex justify-between"><span className="text-muted-foreground">Desconto Pix (5%)</span><span className="text-success">-R$ {pixDiscount.toFixed(2)}</span></div>
              )}
            </div>
            <div className="border-t border-border pt-3 flex justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-price">R$ {(paymentMethod === 'pix' ? total - pixDiscount : total).toFixed(2)}</span>
            </div>
            {paymentMethod === 'credit' && installments > 1 && (
              <p className="text-xs text-muted-foreground">{installments}x de R$ {(total / installments).toFixed(2)}</p>
            )}

            <button
              onClick={handlePurchase}
              disabled={processing}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all glow-primary disabled:opacity-50"
            >
              {processing ? (
                <span className="animate-pulse">Processando...</span>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Confirmar Compra
                </>
              )}
            </button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              Pagamento 100% seguro (simulação)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
