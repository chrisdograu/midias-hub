import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const DEV_BYPASS = false; // autenticação ativa

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (DEV_BYPASS) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}
