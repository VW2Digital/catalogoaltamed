import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
import { ProductCard } from "@/components/ProductCard";

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

  async function load() {
    if (!id) return;
    setLoading(true);
    const [{ data: cat }, { data: prods }] = await Promise.all([
      supabase.from("catalogs").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("products")
        .select("*")
        .eq("catalog_id", id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
    ]);
    setCatalog(cat as Catalog | null);
    setProducts((prods as ProductRow[]) ?? []);
    setLoading(false);
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
      load();
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

  return (
    <section>
      <Link
        to="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Catálogos
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{catalog.name}</h1>
          {catalog.description && (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {catalog.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={`/c/${catalog.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Ver público
            </Link>
          </Button>
          <Button onClick={handleNew} size="lg">
            <Plus className="mr-2 h-4 w-4" /> Novo produto
          </Button>
        </div>
      </div>

      <div className="mt-8">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
            <h2 className="text-lg font-semibold">Nenhum produto ainda</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Adicione produtos para vê-los aparecer no catálogo público.
            </p>
            <Button onClick={handleNew} className="mt-6">
              <Plus className="mr-2 h-4 w-4" /> Adicionar produto
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <div key={p.id} className="relative">
                <ProductCard
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
                <div className="absolute right-3 top-3 flex gap-1 rounded-full bg-background/90 p-1 shadow-card backdrop-blur">
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
        )}
      </div>

      <ProductFormDialog
        open={open}
        onOpenChange={setOpen}
        catalogId={catalog.id}
        product={editing}
        onSaved={load}
      />
    </section>
  );
}