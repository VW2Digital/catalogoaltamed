import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, LogIn, ArrowLeft, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/hooks/useBranding";
import { useCart } from "@/hooks/useCart";

export function PublicHeader({ backTo }: { backTo?: string }) {
  const { user, isAdmin } = useAuth();
  const { storeName, logoThumbUrl } = useBranding();
  const { count } = useCart();
  const location = useLocation();
  const isHome = location.pathname === "/";
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-8">
        <div className="flex justify-start">
          {backTo && (
            <Button asChild variant="secondary" size="icon" className="rounded-xl bg-header-button text-header-button-foreground hover:bg-header-button/80">
              <Link to={backTo}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Voltar</span>
              </Link>
            </Button>
          )}
        </div>
        <Link to="/" className="flex items-center justify-center gap-2 font-bold tracking-tight">
          {logoThumbUrl ? (
            <img
              src={logoThumbUrl}
              alt={storeName || "Logo"}
              className="h-8 w-auto max-w-[128px] object-contain"
            />
          ) : (
            <>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-gold shadow-gold">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </span>
              <span className="truncate">{storeName || "Catálogos"}</span>
            </>
          )}
        </Link>
        <div className="flex items-center justify-end gap-1">
          <Button asChild variant="secondary" size="icon" className="relative rounded-xl bg-header-button text-header-button-foreground hover:bg-header-button/80">
            <Link to="/sacola" aria-label="Sacola">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>
          {isHome && (
            <Button asChild variant="secondary" size="sm" className="rounded-xl bg-header-button text-header-button-foreground hover:bg-header-button/80">
              <Link to={user && isAdmin ? "/admin" : "/auth"}>
                <LogIn className="mr-2 h-4 w-4" />
                {user && isAdmin ? "Painel" : "Entrar"}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}