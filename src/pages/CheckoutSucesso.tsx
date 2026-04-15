import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, Package, Home, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CheckoutSucesso() {
  const location = useLocation();
  const orderId = (location.state as any)?.orderId as string | undefined;

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.6 }}>
        <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
          Compra Realizada! <Sparkles className="h-6 w-6 text-accent" />
        </h1>
        <p className="text-muted-foreground mb-2">Seu pedido foi confirmado com sucesso.</p>
        {orderId && (
          <p className="text-sm text-muted-foreground mb-6">
            Pedido: <span className="font-mono text-primary font-semibold">#{orderId.slice(0, 8)}</span>
          </p>
        )}

        <div className="bg-card border border-border rounded-xl p-6 mb-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Seus jogos digitais já estão disponíveis na sua biblioteca. Jogos físicos serão enviados em breve.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/pedidos"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all">
            <Package className="h-4 w-4" /> Ver Meus Pedidos
          </Link>
          <Link to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-foreground font-semibold rounded-lg hover:bg-secondary/80 transition-all">
            <Home className="h-4 w-4" /> Voltar ao Início
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
