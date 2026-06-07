import { Link, useLocation } from 'react-router-dom';
import { User, Store } from 'lucide-react';

/**
 * Barra/aba no topo do perfil para alternar entre @usuario (pessoal) e $vendedor (seller).
 * NÃO é um toggle de modo — são duas páginas diferentes. Esta barra apenas linka entre elas.
 */
export default function SellerProfileSwitcher({
  userId,
  personalHandle,
  sellerHandle,
  hasSeller,
  isOwn,
}: {
  userId?: string;
  personalHandle?: string | null;
  sellerHandle?: string | null;
  hasSeller: boolean;
  isOwn?: boolean;
}) {
  const { pathname } = useLocation();
  const onSeller = pathname.startsWith('/vendedor/') || pathname.startsWith('/v/');
  const personalUrl = userId ? `/perfil/${userId}` : '/perfil';
  const sellerUrl = sellerHandle ? `/vendedor/${sellerHandle}` : null;

  return (
    <div className="flex items-center gap-1 p-1 bg-card border border-border rounded-xl mb-6">
      <Link
        to={personalUrl}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          !onSeller ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
        }`}
      >
        <User className="h-4 w-4" />
        <span className="truncate">@{personalHandle || 'pessoal'}</span>
      </Link>
      {sellerUrl ? (
        <Link
          to={sellerUrl}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            onSeller ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Store className="h-4 w-4" />
          <span className="truncate">${sellerHandle}</span>
        </Link>
      ) : isOwn ? (
        <Link
          to="/vendedor/criar"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-accent border border-dashed border-accent/40 hover:bg-accent/10"
        >
          <Store className="h-4 w-4" />
          Criar $vendedor
        </Link>
      ) : (
        <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs text-muted-foreground">
          Sem perfil vendedor
        </div>
      )}
    </div>
  );
}
