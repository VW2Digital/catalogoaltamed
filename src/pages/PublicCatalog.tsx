import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/PublicHeader";
import { ProductCard } from "@/components/ProductCard";
import { ProductTable } from "@/components/ProductTable";
import { Loader2, Search, X } from "lucide-react";
import { LayoutGrid, Rows3, Table2 } from "lucide-react";
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
  descricao_ativo: string | null;
};

export default function PublicCatalog() {
  const { slug } = useParams<{ slug: string }>();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { number: whatsappNumber } = useWhatsAppNumber();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  type ViewMode = "one" | "two" | "list" | "table";
  const [isMobileView, setIsMobileView] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(max-width: 639px)");
    const onChange = () => setIsMobileView(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "two";
    const saved = window.localStorage.getItem("publicCatalog.viewMode");
    return saved === "one" || saved === "two" || saved === "list" || saved === "table"
      ? saved
      : "two";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("publicCatalog.viewMode", viewMode);
    }
  }, [viewMode]);

  const mobileGridClass =
    viewMode === "one" || viewMode === "list" ? "grid-cols-1" : "grid-cols-2";

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
      const { data: cats } = await supabase
        .from("categories")
        .select("name, sort_order")
        .eq("catalog_id", cat.id)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      setCategoryOrder(((cats as { name: string }[]) ?? []).map((c) => c.name));
      const { data: prods } = await supabase
        .from("products_public")
        .select("*")
        .eq("catalog_id", cat.id)
        .eq("is_visible", true)
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
    const rank = (n: string) => {
      const i = categoryOrder.indexOf(n);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    return Array.from(set).sort(
      (a, b) => rank(a) - rank(b) || a.localeCompare(b, "pt-BR"),
    );
  }, [products, categoryOrder]);

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
      <PublicHeader backTo="/" />
      <main className="mx-auto max-w-7xl px-4 pb-12 pt-2 sm:px-6 sm:pt-4 lg:px-8">
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
            <header>
              {catalog.description && (
                <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                  {catalog.description}
                </p>
              )}
            </header>

            {products.length > 0 && (
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex w-full items-center gap-2 sm:flex-1">
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar por nome, código ou marca..."
                      className="pl-9"
                    />
                  </div>
                  <div
                    role="group"
                    aria-label="Modo de visualização"
                    className="inline-flex shrink-0 rounded-full border bg-card p-1 shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setViewMode("two")}
                      aria-pressed={viewMode === "two"}
                      aria-label="Grade"
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                        viewMode === "two"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      aria-pressed={viewMode === "list"}
                      aria-label="Lista"
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors sm:hidden ${
                        viewMode === "list"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Rows3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("table")}
                      aria-pressed={viewMode === "table"}
                      aria-label="Tabela"
                      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                        viewMode === "table"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Table2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:contents">
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
                </div>
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
                {groupByCategory(filteredProducts)
                  .sort((a, b) => {
                    const rank = (n: string) => {
                      const i = categoryOrder.indexOf(n);
                      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
                    };
                    return rank(a.category) - rank(b.category) ||
                      a.category.localeCompare(b.category, "pt-BR");
                  })
                  .map((group) => (
                  viewMode === "table" ? (
                    <ProductTable
                      key={group.category}
                      title={group.category}
                      whatsappNumber={whatsappNumber}
                      items={group.items.map((p) => ({
                        id: p.id,
                        code: p.code,
                        name: p.name,
                        brand: p.brand,
                        unit: p.unit,
                        price: p.price,
                        image_url: p.image_url,
                      }))}
                    />
                  ) : (
                  <section key={group.category} aria-labelledby={`cat-${group.category}`}>
                    <h2
                      id={`cat-${group.category}`}
                      className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
                    >
                      {group.category}
                    </h2>
                    <div
                      className={`mt-6 grid gap-[7px] ${mobileGridClass} sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
                    >
                      {group.items.map((p) => (
                        <ProductCard
                          key={p.id}
                          whatsappNumber={whatsappNumber}
                          layout={isMobileView && viewMode === "list" ? "list" : "grid"}
                          compact={isMobileView && viewMode === "two"}
                          product={{
                            code: p.code,
                            name: p.name,
                            category: p.category,
                            brand: p.brand,
                            unit: p.unit,
                            price: p.price,
                            image_url: p.image_url,
                            descricao_ativo: p.descricao_ativo,
                          }}
                        />
                      ))}
                    </div>
                  </section>
                  )
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}