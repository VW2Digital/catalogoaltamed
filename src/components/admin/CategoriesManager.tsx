import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { GripVertical, Loader2, Pencil, Plus, Tag, Trash2, X, Check } from "lucide-react";
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

export type Category = {
  id: string;
  catalog_id: string;
  name: string;
  sort_order: number;
};

type Props = {
  catalogId: string;
  onChange?: () => void;
};

export default function CategoriesManager({ catalogId, onChange }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [reordering, setReordering] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("catalog_id", catalogId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) toast.error(error.message);
    setCategories((data as Category[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [catalogId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const { error } = await supabase.from("categories").insert({
      catalog_id: catalogId,
      name,
      sort_order: categories.length,
    });
    setCreating(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Categoria já existe" : error.message);
      return;
    }
    setNewName("");
    toast.success("Categoria criada");
    await load();
    onChange?.();
  }

  async function handleRename(cat: Category) {
    const name = editingName.trim();
    if (!name || name === cat.name) {
      setEditingId(null);
      return;
    }
    const { error } = await supabase
      .from("categories")
      .update({ name })
      .eq("id", cat.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Atualiza produtos que usavam o nome antigo
    await supabase
      .from("products")
      .update({ category: name })
      .eq("catalog_id", catalogId)
      .eq("category", cat.name);
    setEditingId(null);
    toast.success("Categoria renomeada");
    await load();
    onChange?.();
  }

  async function handleDelete(cat: Category) {
    const { error } = await supabase.from("categories").delete().eq("id", cat.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Remove a categoria dos produtos
    await supabase
      .from("products")
      .update({ category: null })
      .eq("catalog_id", catalogId)
      .eq("category", cat.name);
    toast.success("Categoria excluída");
    await load();
    onChange?.();
  }

  async function persistOrder(next: Category[]) {
    setCategories(next);
    setReordering(true);
    const { error } = await supabase.from("categories").upsert(
      next.map((c, i) => ({ ...c, sort_order: i })),
      { onConflict: "id" },
    );
    setReordering(false);
    if (error) {
      toast.error(error.message);
      await load();
      return;
    }
    onChange?.();
  }

  function handleDrop(targetId: string) {
    const fromId = dragId;
    setDragId(null);
    setOverId(null);
    if (!fromId || fromId === targetId) return;
    const from = categories.findIndex((c) => c.id === fromId);
    const to = categories.findIndex((c) => c.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...categories];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persistOrder(next);
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Categorias</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Crie e organize as categorias deste catálogo. Arraste pelo ícone para reordenar — a ordem
        definida aqui é a ordem das seções no catálogo público.
      </p>

      <form onSubmit={handleCreate} className="mt-4 flex gap-2">
        <Input
          placeholder="Nome da nova categoria"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button type="submit" disabled={creating || !newName.trim()}>
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span className="ml-2">Adicionar</span>
        </Button>
      </form>

      <div className="mt-5">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            Nenhuma categoria ainda.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {categories.map((cat) => (
              <li
                key={cat.id}
                draggable={!reordering && editingId !== cat.id}
                onDragStart={() => setDragId(cat.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (overId !== cat.id) setOverId(cat.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(cat.id);
                }}
                className={`flex items-center gap-1 rounded-lg border bg-background pl-1 pr-1 py-1 text-sm shadow-sm transition-colors ${
                  dragId === cat.id ? "opacity-50" : ""
                } ${overId === cat.id && dragId && dragId !== cat.id ? "border-primary bg-accent/40" : ""}`}
              >
                <span
                  className="flex h-7 w-7 cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
                  aria-label="Arrastar para reordenar"
                >
                  <GripVertical className="h-4 w-4" />
                </span>
                {editingId === cat.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-7 w-40"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleRename(cat);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleRename(cat)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{cat.name}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditingName(cat.name);
                      }}
                      aria-label="Renomear"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Os produtos desta categoria continuarão existindo, mas ficarão sem categoria.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(cat)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}