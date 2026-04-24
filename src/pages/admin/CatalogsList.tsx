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
import { Plus, Pencil, Trash2, Loader2, FolderOpen, ArrowRight, Upload, X } from "lucide-react";
import { slugify } from "@/lib/format";

type Catalog = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  icon_url: string | null;
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
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
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
    setCoverUrl(null);
    setIconUrl(null);
    setOpen(true);
  }

  function openEdit(c: Catalog) {
    setEditing(c);
    setName(c.name);
    setDescription(c.description ?? "");
    setCoverUrl(c.cover_url ?? null);
    setIconUrl(c.icon_url ?? null);
    setOpen(true);
  }

  async function handleUpload(
    file: File,
    kind: "cover" | "icon",
  ): Promise<string | null> {
    const setUploading = kind === "cover" ? setUploadingCover : setUploadingIcon;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${kind}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("catalog-assets")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("catalog-assets").getPublicUrl(path);
      return data.publicUrl;
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao enviar imagem");
      return null;
    } finally {
      setUploading(false);
    }
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
            cover_url: coverUrl,
            icon_url: iconUrl,
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
          cover_url: coverUrl,
          icon_url: iconUrl,
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
                    placeholder="Aparece no rodapé do card. Ex: Linha completa de preenchedores."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Cover */}
                  <div className="space-y-2">
                    <Label>Foto de capa (opcional)</Label>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-accent">
                      {coverUrl ? (
                        <>
                          <img
                            src={coverUrl}
                            alt="Capa"
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setCoverUrl(null)}
                            className="absolute right-1.5 top-1.5 rounded-full bg-foreground/80 p-1 text-background hover:bg-foreground"
                            aria-label="Remover capa"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                          {uploadingCover ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              <span>Enviar foto</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              const url = await handleUpload(f, "cover");
                              if (url) setCoverUrl(url);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="space-y-2">
                    <Label>Ícone (opcional)</Label>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted">
                      {iconUrl ? (
                        <>
                          <div className="flex h-full w-full items-center justify-center bg-gradient-gold p-4">
                            <img
                              src={iconUrl}
                              alt="Ícone"
                              className="h-12 w-12 object-contain"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setIconUrl(null)}
                            className="absolute right-1.5 top-1.5 rounded-full bg-foreground/80 p-1 text-background hover:bg-foreground"
                            aria-label="Remover ícone"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                          {uploadingIcon ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              <span>PNG / SVG</span>
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/png,image/svg+xml,image/webp"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              const url = await handleUpload(f, "icon");
                              if (url) setIconUrl(url);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving || uploadingCover || uploadingIcon}>
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {catalogs.map((c) => (
              <article
                key={c.id}
                className="group flex flex-col rounded-2xl border bg-card p-2 shadow-card transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-card-hover"
              >
                {/* Hero */}
                <section
                  className="relative overflow-hidden rounded-xl bg-accent p-6"
                  style={
                    c.cover_url
                      ? {
                          backgroundImage: `linear-gradient(180deg, hsl(0 0% 0% / 0.15) 0%, hsl(0 0% 0% / 0.55) 100%), url(${c.cover_url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                >
                  <header className="flex items-center justify-between gap-3">
                    <span
                      className={`text-sm font-bold ${
                        c.cover_url ? "text-white/90" : "text-foreground/80"
                      }`}
                    >
                      {c.product_count}{" "}
                      {c.product_count === 1 ? "produto" : "produtos"}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${
                          c.cover_url
                            ? "text-white/90 hover:bg-white/15 hover:text-white"
                            : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
                        }`}
                        onClick={() => openEdit(c)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${
                              c.cover_url
                                ? "text-white/90 hover:bg-destructive/80 hover:text-white"
                                : "text-foreground/70 hover:bg-destructive/10 hover:text-destructive"
                            }`}
                            aria-label="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
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
                  </header>
                  <h3
                    className={`mt-8 mb-2 pr-6 text-2xl font-semibold leading-tight tracking-tight line-clamp-2 ${
                      c.cover_url ? "text-white drop-shadow-sm" : ""
                    }`}
                  >
                    {c.name}
                  </h3>
                </section>

                {/* Footer */}
                <footer className="flex flex-col items-start gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    {c.icon_url ? (
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-gold shadow-gold">
                        <img
                          src={c.icon_url}
                          alt=""
                          className="h-5 w-5 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-gold shadow-gold">
                        <FolderOpen className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <p className="text-sm font-bold leading-tight line-clamp-2">
                      {c.name}
                    </p>
                  </div>
                  <Link
                    to={`/admin/catalogs/${c.id}`}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
                  >
                    Abrir
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </footer>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}