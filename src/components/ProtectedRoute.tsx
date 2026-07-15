import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Bypass só existe em builds de desenvolvimento — em produção Vite garante
// import.meta.env.DEV = false, então esse ramo é morto no build final e não pode
// ser ativado por commit acidental de um booleano solto.
const DEV_BYPASS = false && import.meta.env.DEV;

export default function ProtectedRoute({
  children,
  redirectTo = "/auth",
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  const { user, loading } = useAuth();

  if (DEV_BYPASS) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
}
