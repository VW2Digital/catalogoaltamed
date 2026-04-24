import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Award, Trash2, X, Check } from "lucide-react";
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

export type Brand = {
  id: string;
  catalog_id: string;
  name: string;
  sort_order: number;
};

type Props = {
  catalogId: string;
  onChange?: () => void;
};

export default function BrandsManager({ catalogId, onChange }: Props) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("catalog_id", catalogId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) toast.error(error.message);
    setBrands((data as Brand[]) ?? []);
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
    const { error } = await supabase.from("brands").insert({
      catalog_id: catalogId,
      name,
      sort_order: brands.length,
    });
    setCreating(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Marca já existe" : error.message);
      return;
    }
    setNewName("");
    toast.success("Marca criada");
    await load();
    onChange?.();
  }

  async function handleRename(b: Brand) {
    const name = editingName.trim();
    if (!name || name === b.name) {
      setEditingId(null);
      return;
    }
    const { error } = await supabase.from("brands").update({ name }).eq("id", b.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Atualiza produtos que usavam o nome antigo
    await supabase
      .from("products")
      .update({ brand: name })
      .eq("catalog_id", catalogId)
      .eq("brand", b.name);
    setEditingId(null);
    toast.success("Marca renomeada");
    await load();
    onChange?.();
  }

  async function handleDelete(b: Brand) {
    const { error } = await supabase.from("brands").delete().eq("id", b.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    // Remove a marca dos produtos
    await supabase
      .from("products")
      .update({ brand: null })
      .eq("catalog_id", catalogId)
      .eq("brand", b.name);
    toast.success("Marca excluída");
    await load();
    onChange?.();
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Award className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Marcas</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Crie e organize as marcas deste catálogo. Os produtos poderão ser vinculados a elas.
      </p>

      <form onSubmit={handleCreate} className="mt-4 flex gap-2">
        <Input
          placeholder="Nome da nova marca"
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
        ) : brands.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
            Nenhuma marca ainda.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {brands.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-1 rounded-full border bg-background pl-3 pr-1 py-1 text-sm shadow-sm"
              >
                {editingId === b.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-7 w-40"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleRename(b);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => handleRename(b)}
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
                    <span className="font-medium">{b.name}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        setEditingId(b.id);
                        setEditingName(b.name);
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
                          <AlertDialogTitle>Excluir marca?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Os produtos desta marca continuarão existindo, mas ficarão sem marca.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(b)}>
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