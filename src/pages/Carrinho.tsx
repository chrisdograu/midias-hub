import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Carrinho() {
  const { items, removeItem, updateQuantity, total, itemCount } = useCart();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Carrinho vazio</h1>
        <p className="text-muted-foreground mb-6">Adicione jogos ao seu carrinho para continuar.</p>
        <Link to="/catalogo" className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all inline-block">
          Ver Catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/catalogo" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Continuar comprando
      </Link>

      <h1 className="text-2xl font-bold text-foreground mb-6">Carrinho ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence>
            {items.map(item => (
              <motion.div
                key={item.game.id}
                layout
                exit={{ opacity: 0, x: -20 }}
                className="flex gap-4 bg-card border border-border rounded-xl p-4"
              >
                <Link to={`/jogo/${item.game.id}`} className="shrink-0">
                  <img src={item.game.image} alt={item.game.title} className="w-20 h-20 rounded-lg object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/jogo/${item.game.id}`}>
                    <h3 className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate">{item.game.title}</h3>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.game.platform.join(', ')}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.game.id, item.quantity - 1)} className="p-1 rounded bg-secondary hover:bg-secondary/80 transition-colors">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.game.id, item.quantity + 1)} className="p-1 rounded bg-secondary hover:bg-secondary/80 transition-colors">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => removeItem(item.game.id)} className="p-1 rounded hover:bg-destructive/20 transition-colors ml-2">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                    <span className="text-price font-bold">R$ {(item.game.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="bg-card border border-border rounded-xl p-6 h-fit sticky top-20 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Resumo do Pedido</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {total.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Desconto</span><span className="text-success">- R$ 0,00</span></div>
          </div>
          <div className="border-t border-border pt-3 flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-price">R$ {total.toFixed(2)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            ou até 12x de R$ {(total / 12).toFixed(2)} sem juros
          </p>
          <Link
            to="/checkout"
            className="block w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg text-center hover:opacity-90 transition-all glow-primary"
          >
            Finalizar Compra
          </Link>
        </div>
      </div>
    </div>
  );
}
