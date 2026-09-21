import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/PublicHeader";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  FolderOpen,
  Headset,
  Loader2,
  Sparkles,
  TrendingUp,
  Truck,
} from "lucide-react";

type CatalogSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  product_count: number;
};

const BENEFITS = [
  {
    icon: TrendingUp,
    title: "Até 20% mais economia",
    description: "Redução real de custos em insumos e produtos de alta performance.",
  },
  {
    icon: Truck,
    title: "Entrega em até 24h",
    description: "Logística ultra-rápida para que você nunca perca uma venda.",
  },
  {
    icon: Headset,
    title: "Suporte técnico 24/7",
    description:
      "Equipe especializada pronta para garantir segurança total em seus protocolos.",
  },
] as const;

const Index = () => {
  const [catalogs, setCatalogs] = useState<CatalogSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data }, { data: prods }] = await Promise.all([
        supabase
          .from("catalogs")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("products_public")
          .select("catalog_id")
          .eq("is_visible", true),
      ]);
      const counts = new Map<string, number>();
      (prods ?? []).forEach((p: { catalog_id: string }) => {
        counts.set(p.catalog_id, (counts.get(p.catalog_id) ?? 0) + 1);
      });
      setCatalogs(
        (data ?? []).map((c: Omit<CatalogSummary, "product_count">) => ({
          ...c,
          product_count: counts.get(c.id) ?? 0,
        })),
      );
      setLoading(false);
    })();
  }, []);

  const catalog = catalogs[0];
  const catalogHref = catalog ? `/c/${catalog.slug}` : "/";
  const productCount = catalog?.product_count ?? 180;

  return (
    <div className="min-h-screen bg-gradient-page">
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 top-0 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle_at_center,hsl(36_55%_72%/0.45)_0%,hsl(32_40%_62%/0.18)_42%,transparent_70%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 right-[8%] h-72 w-[28rem] rotate-[-18deg] rounded-[100%] bg-[linear-gradient(120deg,hsl(36_50%_70%/0.28),transparent_70%)] blur-md"
          />

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 lg:px-8 lg:py-16">
            {loading ? (
              <div className="col-span-full flex justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !catalog ? (
              <div className="col-span-full mx-auto max-w-md rounded-2xl border border-dashed bg-card/50 p-8 text-center sm:p-10">
                <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/60" />
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
                  Nenhum catálogo publicado
                </h1>
                <p className="mt-2 text-base text-muted-foreground">
                  Volte em breve — os catálogos aparecerão aqui assim que forem criados.
                </p>
              </div>
            ) : (
              <>
                <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-lg lg:text-left">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                    <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                    + de {productCount} produtos
                  </span>
                  <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
                    Condições especiais para aumentar sua{" "}
                    <span className="text-primary">rentabilidade</span>
                  </h1>
                  <p className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    Até 20% de economia
                  </p>
                  <Button
                    asChild
                    size="lg"
                    className="mt-8 h-12 rounded-full bg-gradient-gold px-7 text-sm font-semibold shadow-gold hover:opacity-95"
                  >
                    <Link to={catalogHref}>
                      Ver catálogo
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                <Link
                  to={catalogHref}
                  aria-label="Abrir catálogo AltaMed"
                  className="relative mx-auto w-full max-w-[560px] lg:max-w-none"
                >
                  <div className="rotate-[1.5deg] rounded-[1.75rem] bg-gradient-to-br from-[#e6d3b0] via-[#c4a06a] to-[#8f6a3c] p-[3px] shadow-[0_28px_60px_-18px_hsl(32_50%_20%/0.45)] transition-transform duration-300 ease-smooth hover:-translate-y-1 sm:rounded-[2rem]">
                    <div className="rounded-[1.55rem] bg-[#2a241c] p-[7px] sm:rounded-[1.8rem] sm:p-2">
                      <div className="overflow-hidden rounded-[1.15rem] bg-background sm:rounded-[1.4rem]">
                        <img
                          src="/hero-catalog.png"
                          alt="Prévia do catálogo AltaMed com produtos e preços"
                          width={1024}
                          height={713}
                          className="aspect-[1024/713] w-full object-cover object-top"
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-7xl px-4 pb-12 sm:mt-14 sm:px-6 sm:pb-16 lg:mt-20 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {BENEFITS.map((item) => (
              <article
                key={item.title}
                className="flex gap-4 rounded-2xl border bg-card p-5 shadow-card sm:p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold tracking-tight text-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
