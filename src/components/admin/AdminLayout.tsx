import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LayoutGrid, LogOut, Sparkles, ExternalLink } from "lucide-react";

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/auth", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-page">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/admin" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-gold shadow-gold">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </span>
            <span>Catálogos</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <LayoutGrid className="h-4 w-4" />
              Catálogos
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/" target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Ver site</span>
              </Link>
            </Button>
            <span className="hidden text-xs text-muted-foreground lg:inline">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}