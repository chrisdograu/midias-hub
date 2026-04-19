import { Gamepad2, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface StoreInfo { name?: string; email?: string; phone?: string; description?: string }

export default function Footer() {
  const { user } = useAuth();
  const { value: store } = useSiteSettings<StoreInfo>('store_info');

  const name = store?.name || 'MIDIAS';
  const description = store?.description || 'Sua loja de jogos digitais com os melhores preços e ofertas exclusivas.';
  const email = store?.email || 'suporte@midias.com.br';
  const phone = store?.phone;

  return (
    <footer className="border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Gamepad2 className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-bold gradient-text">{name}</span>
            </Link>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">Navegação</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary transition-colors">Início</Link></li>
              <li><Link to="/catalogo" className="hover:text-primary transition-colors">Catálogo</Link></li>
              <li><Link to="/ofertas" className="hover:text-primary transition-colors">Ofertas</Link></li>
              {user && <li><Link to="/biblioteca" className="hover:text-primary transition-colors">Biblioteca</Link></li>}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">Minha Conta</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {user ? (
                <>
                  <li><Link to="/perfil" className="hover:text-primary transition-colors">Perfil</Link></li>
                  <li><Link to="/pedidos" className="hover:text-primary transition-colors">Pedidos</Link></li>
                  <li><Link to="/favoritos" className="hover:text-primary transition-colors">Favoritos</Link></li>
                </>
              ) : (
                <li><Link to="/auth" className="hover:text-primary transition-colors">Entrar / Cadastrar</Link></li>
              )}
              <li><Link to="/faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link to="/contato" className="hover:text-primary transition-colors">Contato</Link></li>
              <li><Link to="/termos" className="hover:text-primary transition-colors">Termos de Uso</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-3">Contato</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-primary" />{email}</li>
              {phone && <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" />{phone}</li>}
            </ul>
            <h4 className="font-semibold text-foreground mt-4 mb-2">Pagamento</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>💳 Cartão de Crédito</li>
              <li>📱 Pix</li>
              <li>🏦 Boleto Bancário</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {name}. Todos os direitos reservados. Preços e ofertas sujeitos a alteração.
        </div>
      </div>
    </footer>
  );
}
