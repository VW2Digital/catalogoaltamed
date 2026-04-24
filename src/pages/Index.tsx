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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {catalogs.map((c) => (
                <Link
                  key={c.id}
                  to={`/c/${c.slug}`}
                  className="group flex flex-col rounded-2xl border bg-card p-6 shadow-card transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-card-hover"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
                    <FolderOpen className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="mt-4 text-xl font-bold tracking-tight">
                    {c.name}
                  </h3>
                  {c.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {c.description}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">
                    {c.product_count}{" "}
                    {c.product_count === 1 ? "produto" : "produtos"}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    Ver catálogo
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
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
