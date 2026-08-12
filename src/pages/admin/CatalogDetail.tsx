import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Eye, EyeOff, Loader2, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ProductFormDialog, { ProductRow } from "@/components/admin/ProductFormDialog";
import ImportProductsDialog from "@/components/admin/ImportProductsDialog";
import { ProductCard } from "@/components/ProductCard";
import { groupByCategory } from "@/lib/groupByCategory";
import { useWhatsAppNumber } from "@/hooks/useWhatsAppNumber";

type Catalog = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

export default function CatalogDetail() {
  const { id } = useParams<{ id: string }>();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [importOpen, setImportOpen] = useState(false);
  const { number: whatsappNumber } = useWhatsAppNumber();

  async function load(opts: { showLoader?: boolean } = { showLoader: true }) {
    if (!id) return;
    if (opts.showLoader) setLoading(true);
    const [{ data: cat }, { data: prods }] = await Promise.all([
      supabase.from("catalogs").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("products")
        .select("*")
        .eq("catalog_id", id)
        .order("category", { ascending: true, nullsFirst: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
    ]);
    setCatalog(cat as Catalog | null);
    setProducts((prods as ProductRow[]) ?? []);
    if (opts.showLoader) setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  function handleNew() {
    setEditing(null);
    setOpen(true);
  }

  function handleEdit(p: ProductRow) {
    setEditing(p);
    setOpen(true);
  }

  async function handleDelete(p: ProductRow) {
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) toast.error(error.message);
      else {
        toast.success("Produto excluído");
        load({ showLoader: false });
      }
  }

  async function handleToggleVisibility(p: ProductRow) {
    const next = !(p.is_visible ?? true);
    const { error } = await supabase
      .from("products")
      .update({ is_visible: next })
      .eq("id", p.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(next ? "Produto visível no catálogo" : "Produto oculto do catálogo");
      load({ showLoader: false });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="rounded-2xl border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Catálogo não encontrado.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/admin">Voltar</Link>
        </Button>
      </div>
    );
  }

  const categories = Array.from(
    new Set(
      products
        .map((p) => p.category?.trim())
        .filter((category): category is string => Boolean(category)),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const brands = Array.from(
    new Set(
      products
        .map((p) => p.brand?.trim())
        .filter((brand): brand is string => Boolean(brand)),
    ),
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const hasActiveFilters =
    search.trim() !== "" || categoryFilter !== "all" || brandFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setBrandFilter("all");
  };

  const normalized = search.trim().toLowerCase();
  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== "all" && (p.category ?? "") !== categoryFilter) return false;
    if (brandFilter !== "all" && (p.brand ?? "") !== brandFilter) return false;
    if (!normalized) return true;
    return [p.name, p.code, p.brand, p.category]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(normalized));
  });

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <Link
            to="/admin"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Catálogos
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {catalog.name}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/c/${catalog.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Ver público
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Importar CSV
          </Button>
          <Button onClick={handleNew} size="lg">
            <Plus className="mr-2 h-4 w-4" /> Novo produto
          </Button>
        </div>
      </div>
      {catalog.description && (
        <p className="mt-2 max-w-2xl text-base text-muted-foreground">
          {catalog.description}
        </p>
      )}
      {false && (
        <div>
          <div>
            {null}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/c/${catalog.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Ver público
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Importar CSV
          </Button>
          <Button onClick={handleNew} size="lg">
            <Plus className="mr-2 h-4 w-4" /> Novo produto
          </Button>
        </div>
        </div>
      )}

      <div className="mt-8">
        {products.length > 0 && (
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por nome, código, marca ou categoria"
                className="pl-9"
                aria-label="Pesquisar produtos"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-52" aria-label="Filtrar por categoria">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="w-full sm:w-52" aria-label="Filtrar por marca">
                  <SelectValue placeholder="Marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as marcas</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button type="button" variant="ghost" onClick={clearFilters} className="w-full lg:w-auto">
                <X className="mr-1.5 h-4 w-4" />
                Limpar filtros
              </Button>
            )}
          </div>
        )}
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Nenhum produto ainda
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              Adicione produtos para vê-los aparecer no catálogo público.
            </p>
            <Button onClick={handleNew} className="mt-6">
              <Plus className="mr-2 h-4 w-4" /> Adicionar produto
            </Button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum produto encontrado para “{search}”.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {groupByCategory(filteredProducts).map((group) => (
              <section key={group.category} aria-labelledby={`admin-cat-${group.category}`}>
                <h2
                  id={`admin-cat-${group.category}`}
                  className="text-lg font-bold tracking-tight text-foreground"
                >
                  {group.category}
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                  {group.items.map((p) => (
                    <div key={p.id} className="relative">
                      <div className={(p.is_visible ?? true) ? "" : "opacity-50"}>
                        <ProductCard
                        whatsappNumber={whatsappNumber}
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
                      </div>
                      {!(p.is_visible ?? true) && (
                        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground shadow-card backdrop-blur">
                          <EyeOff className="h-3 w-3" /> Oculto
                        </span>
                      )}
                      <div className="absolute right-3 top-3 flex gap-1 rounded-full bg-background/90 p-1 shadow-card backdrop-blur">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleVisibility(p)}
                          aria-label={(p.is_visible ?? true) ? "Ocultar do catálogo" : "Mostrar no catálogo"}
                          title={(p.is_visible ?? true) ? "Ocultar do catálogo" : "Mostrar no catálogo"}
                        >
                          {(p.is_visible ?? true) ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(p)}
                          aria-label="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(p)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <ProductFormDialog
        open={open}
        onOpenChange={setOpen}
        catalogId={catalog.id}
        product={editing}
        onSaved={() => load({ showLoader: false })}
      />

      <ImportProductsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        catalogId={catalog.id}
        onImported={() => load({ showLoader: false })}
      />
    </section>
  );
}