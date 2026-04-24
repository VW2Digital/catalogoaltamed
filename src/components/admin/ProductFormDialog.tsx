import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";

export type ProductRow = {
  id: string;
  catalog_id: string;
  code: string;
  name: string;
  category: string | null;
  brand: string | null;
  unit: string;
  price: number | string;
  image_url: string | null;
};

const schema = z.object({
  code: z.string().trim().min(1, "Código obrigatório").max(40),
  name: z.string().trim().min(1, "Nome obrigatório").max(120),
  category: z.string().trim().max(80).optional(),
  brand: z.string().trim().max(80).optional(),
  unit: z.string().trim().min(1).max(10),
  price: z.coerce.number().min(0).max(9999999),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogId: string;
  product: ProductRow | null;
  onSaved: () => void;
};

type CategoryOption = { id: string; name: string };
type BrandOption = { id: string; name: string };

export default function ProductFormDialog({
  open,
  onOpenChange,
  catalogId,
  product,
  onSaved,
}: Props) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState("UND");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);

  useEffect(() => {
    if (open) {
      setCode(product?.code ?? "");
      setName(product?.name ?? "");
      setCategory(product?.category ?? "");
      setBrand(product?.brand ?? "");
      setUnit(product?.unit ?? "UND");
      setPrice(product ? String(product.price) : "");
      setImageUrl(product?.image_url ?? null);
    }
  }, [open, product]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const [{ data: cats }, { data: brs }] = await Promise.all([
        supabase
          .from("categories")
          .select("id,name")
          .eq("catalog_id", catalogId)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true }),
        supabase
          .from("brands")
          .select("id,name")
          .eq("catalog_id", catalogId)
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true }),
      ]);
      setCategories((cats as CategoryOption[]) ?? []);
      setBrands((brs as BrandOption[]) ?? []);
    })();
  }, [open, catalogId]);

  async function handleUpload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem precisa ter menos de 5 MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${catalogId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
      toast.success("Imagem enviada");
    } catch (err: any) {
      toast.error(err.message ?? "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ code, name, category, brand, unit, price });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        catalog_id: catalogId,
        code: parsed.data.code,
        name: parsed.data.name,
        category: parsed.data.category || null,
        brand: parsed.data.brand || null,
        unit: parsed.data.unit,
        price: parsed.data.price,
        image_url: imageUrl,
      };
      if (product) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", product.id);
        if (error) throw error;
        toast.success("Produto atualizado");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast.success("Produto criado");
      }
      onOpenChange(false);
      onSaved();
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
            <DialogDescription>
              Os campos abaixo aparecem exatamente no card.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div>
              <Label>Imagem</Label>
              <div className="mt-2">
                {imageUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={imageUrl}
                      alt="Pré-visualização"
                      className="h-32 w-56 rounded-lg border bg-muted object-contain p-2"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl(null)}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md"
                      aria-label="Remover imagem"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex h-32 w-56 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground"
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <ImagePlus className="h-6 w-6" />
                        <span>Enviar imagem</span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="10387"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade</Label>
                <Input
                  id="unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value.toUpperCase())}
                  placeholder="UND"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pname">Nome do produto</Label>
              <Input
                id="pname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rennova Lift Lido Ser 1Ml"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cat">Categoria</Label>
                <Select
                  value={category || "__none__"}
                  onValueChange={(v) => setCategory(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger id="cat">
                    <SelectValue placeholder="Sem categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem categoria</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                    {category &&
                      !categories.some((c) => c.name === category) && (
                        <SelectItem value={category}>{category}</SelectItem>
                      )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Crie novas categorias na página do catálogo.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Select
                  value={brand || "__none__"}
                  onValueChange={(v) => setBrand(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger id="brand">
                    <SelectValue placeholder="Sem marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem marca</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.name}>
                        {b.name}
                      </SelectItem>
                    ))}
                    {brand &&
                      !brands.some((b) => b.name === brand) && (
                        <SelectItem value={brand}>{brand}</SelectItem>
                      )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Crie novas marcas em Configurações &gt; Marcas.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="195.02"
                required
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || uploading}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar produto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}