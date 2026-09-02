import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogIn, ArrowLeft, ShoppingBag, MoreVertical } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBranding } from "@/hooks/useBranding";
import { useCart } from "@/hooks/useCart";

const headerBtnClass =
  "rounded-xl bg-header-button text-header-button-foreground hover:bg-header-button/80";

export function PublicHeader({ backTo }: { backTo?: string }) {
  const { user, isAdmin } = useAuth();
  const { storeName, logoThumbUrl } = useBranding();
  const { count } = useCart();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const authHref = user && isAdmin ? "/admin" : "/auth";
  const authLabel = user && isAdmin ? "Painel" : "Entrar";

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-8">
        <div className="flex justify-start">
          {backTo && (
            <Button asChild variant="secondary" size="icon" className={headerBtnClass}>
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
            <span className="truncate">{storeName || "Catálogos"}</span>
          )}
        </Link>
        <div className="flex items-center justify-end gap-1">
          {isHome ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-xl bg-transparent text-header-button-foreground shadow-none hover:bg-header-button hover:text-header-button-foreground data-[state=open]:bg-header-button"
                  aria-label="Menu"
                >
                  <MoreVertical className="h-5 w-5" />
                  {count > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-bold text-primary-foreground">
                      {count}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-xl">
                <DropdownMenuItem asChild>
                  <Link to="/sacola" className="cursor-pointer">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Sacola
                    {count > 0 && (
                      <span className="ml-auto text-xs font-semibold text-muted-foreground">
                        {count}
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={authHref} className="cursor-pointer">
                    <LogIn className="mr-2 h-4 w-4" />
                    {authLabel}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="secondary" size="icon" className={`relative ${headerBtnClass}`}>
              <Link to="/sacola" aria-label="Sacola">
                <ShoppingBag className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.625rem] font-bold text-primary-foreground">
                    {count}
                  </span>
                )}
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}