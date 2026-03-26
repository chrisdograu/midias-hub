import { Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Gamepad2 className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-bold gradient-text">MIDIAS</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Sua loja de jogos digitais com os melhores preços e ofertas exclusivas.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">Navegação</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary transition-colors">Início</Link></li>
              <li><Link to="/catalogo" className="hover:text-primary transition-colors">Catálogo</Link></li>
              <li><Link to="/ofertas" className="hover:text-primary transition-colors">Ofertas</Link></li>
              <li><Link to="/reviews" className="hover:text-primary transition-colors">Reviews</Link></li>
              <li><Link to="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">Suporte</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link to="/contato" className="hover:text-primary transition-colors">Contato</Link></li>
              <li><Link to="/termos" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">Pagamento</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>💳 Cartão de Crédito</li>
              <li>📱 Pix</li>
              <li>🏦 Boleto Bancário</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © 2024 Midias. Todos os direitos reservados. Preços e ofertas sujeitos a alteração.
        </div>
      </div>
    </footer>
  );
}
