import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/PublicHeader";
import { ProductCard } from "@/components/ProductCard";
import { ArrowLeft, Loader2, Search, X } from "lucide-react";
import { groupByCategory } from "@/lib/groupByCategory";
import { useWhatsAppNumber } from "@/hooks/useWhatsAppNumber";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Catalog = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type Product = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  brand: string | null;
  unit: string;
  price: number | string;
  image_url: string | null;
};

export default function PublicCatalog() {
  const { slug } = useParams<{ slug: string }>();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { number: whatsappNumber } = useWhatsAppNumber();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");

  const hasActiveFilters =
    search.trim() !== "" || categoryFilter !== "all" || brandFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setBrandFilter("all");
  };

  useEffect(() => {
    (async () => {
      if (!slug) return;
      setLoading(true);
      const { data: cat } = await supabase
        .from("catalogs")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!cat) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCatalog(cat as Catalog);
      const { data: prods } = await supabase
        .from("products")
        .select("*")
        .eq("catalog_id", cat.id)
        .order("category", { ascending: true, nullsFirst: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      setProducts((prods as Product[]) ?? []);
      setLoading(false);
    })();
  }, [slug]);

  // SEO
  useEffect(() => {
    if (catalog) {
      document.title = `${catalog.name} — Catálogo`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta && catalog.description) {
        meta.setAttribute("content", catalog.description.slice(0, 160));
      }
    }
  }, [catalog]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [products]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand && p.brand.trim()) set.add(p.brand.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== "all" && (p.category ?? "") !== categoryFilter) {
        return false;
      }
      if (brandFilter !== "all" && (p.brand ?? "") !== brandFilter) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.brand ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, search, categoryFilter, brandFilter]);

  return (
    <div className="min-h-screen bg-gradient-page">
      <PublicHeader />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Todos os catálogos
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notFound || !catalog ? (
          <div className="mt-12 rounded-2xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground">Catálogo não encontrado.</p>
          </div>
        ) : (
          <>
            <header className="mt-4">
              <h1 className="text-4xl font-bold tracking-tight">{catalog.name}</h1>
              {catalog.description && (
                <p className="mt-3 max-w-2xl text-muted-foreground">
                  {catalog.description}
                </p>
              )}
              <p className="mt-3 text-sm text-muted-foreground">
                {products.length} {products.length === 1 ? "produto" : "produtos"}
              </p>
            </header>

            {products.length > 0 && (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome, código ou marca..."
                    className="pl-9"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="w-full sm:w-56">
                    <SelectValue placeholder="Marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as marcas</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={clearFilters}
                    className="w-full sm:w-auto"
                  >
                    <X className="mr-1.5 h-4 w-4" />
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}

            {products.length === 0 ? (
              <div className="mt-10 rounded-2xl border border-dashed p-12 text-center">
                <p className="text-muted-foreground">
                  Nenhum produto neste catálogo ainda.
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="mt-10 rounded-2xl border border-dashed p-12 text-center">
                <p className="text-muted-foreground">
                  Nenhum produto encontrado para a busca.
                </p>
              </div>
            ) : (
              <div className="mt-10 space-y-14">
                {groupByCategory(filteredProducts).map((group) => (
                  <section key={group.category} aria-labelledby={`cat-${group.category}`}>
                    <h2
                      id={`cat-${group.category}`}
                      className="text-3xl font-bold tracking-tight text-foreground"
                    >
                      {group.category}
                    </h2>
                    <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {group.items.map((p) => (
                        <ProductCard
                          key={p.id}
                          whatsappNumber={whatsappNumber}
                          product={{
                            code: p.code,
                            name: p.name,
                            category: p.category,
                            brand: p.brand,
                            unit: p.unit,
                            price: p.price,
                            image_url: p.image_url,
                          }}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}