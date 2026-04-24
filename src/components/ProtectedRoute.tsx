import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-page px-6">
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-card">
          <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 text-xl font-bold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta ainda não tem permissão de administrador. Peça ao
            responsável para conceder o papel <code className="rounded bg-muted px-1">admin</code> no banco.
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/">Ver catálogo público</Link>
          </Button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}