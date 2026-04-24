import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/hooks/useBranding";

export function PublicHeader() {
  const { user, isAdmin } = useAuth();
  const { storeName, logoThumbUrl } = useBranding();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-gradient-gold shadow-gold">
            {logoThumbUrl ? (
              <img
                src={logoThumbUrl}
                alt={storeName || "Logo"}
                className="h-full w-full object-contain"
              />
            ) : (
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            )}
          </span>
          <span className="truncate">{storeName || "Catálogos"}</span>
        </Link>
        <Button asChild variant="ghost" size="sm">
          <Link to={user && isAdmin ? "/admin" : "/auth"}>
            <LogIn className="mr-2 h-4 w-4" />
            {user && isAdmin ? "Painel" : "Entrar"}
          </Link>
        </Button>
      </div>
    </header>
  );
}