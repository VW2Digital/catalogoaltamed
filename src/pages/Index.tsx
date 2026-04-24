import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/PublicHeader";
import { ArrowRight, FolderOpen, Loader2, Sparkles } from "lucide-react";

type CatalogSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  icon_url: string | null;
  product_count: number;
};

const Index = () => {
  const [catalogs, setCatalogs] = useState<CatalogSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("catalogs")
        .select("*, products(count)")
        .order("created_at", { ascending: false });
      setCatalogs(
        (data ?? []).map((c: any) => ({
          ...c,
          product_count: c.products?.[0]?.count ?? 0,
        }))
      );
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-page">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <Sparkles className="h-3 w-3" /> Catálogos premium
          </span>
          <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Conheça nossos catálogos
          </h1>
          <p className="mt-4 text-balance text-muted-foreground">
            Selecione um catálogo abaixo para ver todos os produtos com fotos,
            códigos e preços atualizados.
          </p>
        </section>

        <section className="mt-12">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : catalogs.length === 0 ? (
            <div className="mx-auto max-w-md rounded-2xl border border-dashed bg-card/50 p-12 text-center">
              <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <h2 className="mt-4 text-lg font-semibold">
                Nenhum catálogo publicado
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Volte em breve — os catálogos aparecerão aqui assim que forem criados.
              </p>
            </div>
          ) : (
            <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {catalogs.map((c) => (
                <Link
                  key={c.id}
                  to={`/c/${c.slug}`}
                  className="group flex h-full flex-col rounded-2xl border bg-card p-2 shadow-card transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <section
                    className="relative flex min-h-[180px] flex-1 flex-col overflow-hidden rounded-xl bg-accent p-6 sm:min-h-[240px] lg:min-h-[280px]"
                    style={
                      c.cover_url
                        ? {
                            backgroundImage: `url(${c.cover_url})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  >
                    <header className="flex shrink-0 items-start justify-between gap-3">
                      <span
                        className={`inline-flex items-center text-sm font-bold leading-none ${
                          c.cover_url ? "text-white/90" : "text-foreground/80"
                        }`}
                      >
                        {c.product_count}{" "}
                        {c.product_count === 1 ? "produto" : "produtos"}
                      </span>
                    </header>
                  </section>
                  <footer className="flex flex-row items-center justify-between gap-2 p-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      {c.icon_url ? (
                        <div className="relative m-0 flex aspect-square h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-transparent p-0">
                          <img
                            src={c.icon_url}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="m-0 block h-full w-full object-contain object-center"
                          />
                        </div>
                      ) : (
                        <div className="m-0 flex aspect-square h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-gold p-0 shadow-gold">
                          <FolderOpen className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                      <p className="min-w-0 truncate text-sm font-bold leading-tight">
                        {c.name}
                      </p>
                    </div>
                    <span className="inline-flex flex-shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors group-hover:bg-primary/90">
                      Ver catálogo
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </footer>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
