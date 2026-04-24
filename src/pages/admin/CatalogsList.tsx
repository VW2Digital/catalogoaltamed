import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, FolderOpen, ArrowRight } from "lucide-react";
import { slugify } from "@/lib/format";

type Catalog = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  product_count?: number;
};

const catalogSchema = z.object({
  name: z.string().trim().min(1, "Nome obrigatório").max(80),
  description: z.string().trim().max(500).optional(),
});

export default function CatalogsList() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Catalog | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("catalogs")
      .select("*, products(count)")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar catálogos");
    } else {
      setCatalogs(
        (data ?? []).map((c: any) => ({
          ...c,
          product_count: c.products?.[0]?.count ?? 0,
        }))
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setDescription("");
    setOpen(true);
  }

  function openEdit(c: Catalog) {
    setEditing(c);
    setName(c.name);
    setDescription(c.description ?? "");
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const parsed = catalogSchema.safeParse({ name, description });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("catalogs")
          .update({
            name: parsed.data.name,
            description: parsed.data.description || null,
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Catálogo atualizado");
      } else {
        let slug = slugify(parsed.data.name);
        if (!slug) slug = `catalogo-${Date.now()}`;
        // Make slug unique if needed
        const { data: existing } = await supabase
          .from("catalogs")
          .select("slug")
          .like("slug", `${slug}%`);
        if (existing && existing.some((r) => r.slug === slug)) {
          slug = `${slug}-${Date.now().toString(36)}`;
        }
        const { error } = await supabase.from("catalogs").insert({
          name: parsed.data.name,
          description: parsed.data.description || null,
          slug,
        });
        if (error) throw error;
        toast.success("Catálogo criado");
      }
      setOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: Catalog) {
    const { error } = await supabase.from("catalogs").delete().eq("id", c.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Catálogo excluído");
      load();
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie catálogos e organize seus produtos em cards.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} size="lg">
              <Plus className="mr-2 h-4 w-4" /> Novo catálogo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSave}>
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Editar catálogo" : "Novo catálogo"}
                </DialogTitle>
                <DialogDescription>
                  Dê um nome claro — ele aparecerá no menu público.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cname">Nome</Label>
                  <Input
                    id="cname"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Preenchedores Rennova"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cdesc">Descrição (opcional)</Label>
                  <Textarea
                    id="cdesc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : catalogs.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
            <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <h2 className="mt-4 text-lg font-semibold">Nenhum catálogo ainda</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie seu primeiro catálogo para começar a adicionar produtos.
            </p>
            <Button onClick={openCreate} className="mt-6">
              <Plus className="mr-2 h-4 w-4" /> Criar catálogo
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalogs.map((c) => (
              <div
                key={c.id}
                className="group flex flex-col rounded-2xl border bg-card p-6 shadow-card transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold shadow-gold">
                    <FolderOpen className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(c)}
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Excluir">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir catálogo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Todos os produtos dentro deste catálogo também serão
                            removidos. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(c)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-bold tracking-tight">{c.name}</h3>
                {c.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {c.description}
                  </p>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  {c.product_count} {c.product_count === 1 ? "produto" : "produtos"}
                </p>
                <Link
                  to={`/admin/catalogs/${c.id}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-deep"
                >
                  Gerenciar produtos
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}