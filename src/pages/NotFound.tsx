import { Link, useLocation } from "react-router-dom";
import { Home, Smartphone } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="text-center space-y-5 max-w-md">
        <h1 className="text-6xl font-display font-bold gradient-text">404</h1>
        <p className="text-lg text-muted-foreground">
          Não encontramos <code className="text-foreground">{location.pathname}</code>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold glow-primary"
          >
            <Home className="h-4 w-4" /> Página inicial
          </Link>
          <Link
            to="/m"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-accent/30 bg-accent/10 text-accent font-semibold"
          >
            <Smartphone className="h-4 w-4" /> Versão mobile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
