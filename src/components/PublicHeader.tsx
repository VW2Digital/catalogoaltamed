import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, LogIn, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBranding, LOGO_IMG_CLASS } from "@/hooks/useBranding";

export function PublicHeader({ backTo }: { backTo?: string }) {
  const { user, isAdmin } = useAuth();
  const { storeName, logoThumbUrl } = useBranding();
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-8">
        <div className="flex justify-start">
          {backTo && (
            <Button asChild variant="ghost" size="sm">
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
              className={LOGO_IMG_CLASS}
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
        <div className="flex justify-end">
          <Button asChild variant="ghost" size="sm">
            <Link to={user && isAdmin ? "/admin" : "/auth"}>
              <LogIn className="mr-2 h-4 w-4" />
              {user && isAdmin ? "Painel" : "Entrar"}
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}