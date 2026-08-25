import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";

export type ProductRow = {
  id: string;
  catalog_id: string;
  sort_order?: number | null;
  code: string;
  name: string;
  category: string | null;
  brand: string | null;
  unit: string;
  price: number | string;
  image_url: string | null;
  is_visible?: boolean;
  price_visible?: boolean;
  descricao_ativo?: string | null;
  lista?: string | null;
  qtd?: number | string | null;
  preco_unitario?: number | string | null;
  vlr_compra?: number | string | null;
  custo_sem_antecip?: number | string | null;
  custo_com_antecip?: number | string | null;
  fornecedor?: string | null;
  nota_fiscal?: string | null;
  sugestao_cadastro?: string | null;
  vlr_mercado?: number | string | null;
  fornecedor_01?: string | null;
};

const schema = z.object({
  code: z.string().trim().min(1, "Código obrigatório").max(40),
  name: z.string().trim().min(1, "Nome obrigatório").max(200),
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

type Option = { id: string; name: string };

const numOrNull = (v: string) => {
  if (!v.trim()) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

export default function ProductFormDialog({
  open,
  onOpenChange,
  catalogId,
  product,
  onSaved,
}: Props) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [descricaoAtivo, setDescricaoAtivo] = useState("");
  const [lista, setLista] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("UND");
  const [qtd, setQtd] = useState("");
  const [vlrCompra, setVlrCompra] = useState("");
  const [price, setPrice] = useState("");
  const [precoUnitario, setPrecoUnitario] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [notaFiscal, setNotaFiscal] = useState("");
  const [sugestaoCadastro, setSugestaoCadastro] = useState("");
  const [brand, setBrand] = useState("");
  const [vlrMercado, setVlrMercado] = useState("");
  const [fornecedor01, setFornecedor01] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [priceVisible, setPriceVisible] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Option[]>([]);
  const [brands, setBrands] = useState<Option[]>([]);
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  useEffect(() => {
    if (open) {
      setCode(product?.code ?? "");
      setName(product?.name ?? "");
      setDescricaoAtivo(product?.descricao_ativo ?? "");
      setLista(product?.lista ?? "");
      setCategory(product?.category ?? "");
      setUnit(product?.unit ?? "UND");
      setQtd(product?.qtd != null ? String(product.qtd) : "");
      setVlrCompra(product?.vlr_compra != null ? String(product.vlr_compra) : "");
      setPrice(product ? String(product.price) : "");
      setPrecoUnitario(product?.preco_unitario != null ? String(product.preco_unitario) : "");
      setFornecedor(product?.fornecedor ?? "");
      setNotaFiscal(product?.nota_fiscal ?? "");
      setSugestaoCadastro(product?.sugestao_cadastro ?? "");
      setBrand(product?.brand ?? "");
      setVlrMercado(product?.vlr_mercado != null ? String(product.vlr_mercado) : "");
      setFornecedor01(product?.fornecedor_01 ?? "");
      setImageUrl(product?.image_url ?? null);
      setIsVisible(product?.is_visible ?? true);
      setPriceVisible(product?.price_visible ?? true);
    }
  }, [open, product]);

  useEffect(() => {
    if (!open) {
      setOptionsLoaded(false);
      return;
    }
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
      setCategories((cats as Option[]) ?? []);
      setBrands((brs as Option[]) ?? []);
      setOptionsLoaded(true);
    })();
  }, [open, catalogId]);

  const categoryOptions = useMemo(() => {
    const names = categories.map((c) => c.name);
    return category && !names.includes(category) ? [...names, category] : names;
  }, [categories, category]);

  const brandOptions = useMemo(() => {
    const names = brands.map((b) => b.name);
    return brand && !names.includes(brand) ? [...names, brand] : names;
  }, [brands, brand]);

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
        descricao_ativo: descricaoAtivo.trim() || null,
        lista: lista.trim() || null,
        category: parsed.data.category || null,
        unit: parsed.data.unit,
        qtd: numOrNull(qtd),
        vlr_compra: numOrNull(vlrCompra),
        price: parsed.data.price,
        preco_unitario: numOrNull(precoUnitario),
        fornecedor: fornecedor.trim() || null,
        nota_fiscal: notaFiscal.trim() || null,
        sugestao_cadastro: sugestaoCadastro.trim() || null,
        brand: parsed.data.brand || null,
        vlr_mercado: numOrNull(vlrMercado),
        fornecedor_01: fornecedor01.trim() || null,
        image_url: imageUrl,
        is_visible: isVisible,
        price_visible: priceVisible,
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
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
            <DialogDescription>
              Campos correspondentes às colunas da planilha base.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-5">
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

            <fieldset className="space-y-4 rounded-lg border p-4">
              <legend className="px-1 text-sm font-semibold">Identificação</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="code">CÓDIGO</Label>
                  <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="10366" required />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="pname">PRODUTO</Label>
                  <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ativo">DESCRIÇÃO ATIVO</Label>
                <Textarea id="ativo" value={descricaoAtivo} onChange={(e) => setDescricaoAtivo(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="lista">LISTA</Label>
                  <Input id="lista" value={lista} onChange={(e) => setLista(e.target.value)} placeholder="ESTETICA PRINCIPAL" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat">CLASSIFICAÇÃO</Label>
                  {optionsLoaded ? (
                    <Select value={category || "__none__"} onValueChange={(v) => setCategory(v === "__none__" ? "" : v)}>
                      <SelectTrigger id="cat">
                        <SelectValue placeholder="Sem categoria">{category || "Sem categoria"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sem categoria</SelectItem>
                        {categoryOptions.map((name) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input id="cat" value={category || "Sem categoria"} readOnly disabled />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">UND</Label>
                  <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value.toUpperCase())} required />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4 rounded-lg border p-4">
              <legend className="px-1 text-sm font-semibold">Estoque e custos</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="qtd">QTD</Label>
                  <Input id="qtd" type="number" step="any" value={qtd} onChange={(e) => setQtd(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vc">VLR. COMPRA</Label>
                  <Input id="vc" type="number" step="0.01" value={vlrCompra} onChange={(e) => setVlrCompra(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vm">VLR. MERCADO</Label>
                  <Input id="vm" type="number" step="0.01" value={vlrMercado} onChange={(e) => setVlrMercado(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">VLR. CAIXA (preço público)</Label>
                  <Input id="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preco_unitario">VLR. UNIT. (preço público)</Label>
                  <Input id="preco_unitario" type="number" step="0.01" min="0" value={precoUnitario} onChange={(e) => setPrecoUnitario(e.target.value)} placeholder="Opcional" />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4 rounded-lg border p-4">
              <legend className="px-1 text-sm font-semibold">Fornecimento e cadastro</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="forn">FORNECEDOR</Label>
                  <Input id="forn" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nf">NOTA FISCAL</Label>
                  <Input id="nf" value={notaFiscal} onChange={(e) => setNotaFiscal(e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="sug">SUGESTÃO DE CADASTRO</Label>
                  <Input id="sug" value={sugestaoCadastro} onChange={(e) => setSugestaoCadastro(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">MARCA</Label>
                  {optionsLoaded ? (
                    <Select value={brand || "__none__"} onValueChange={(v) => setBrand(v === "__none__" ? "" : v)}>
                      <SelectTrigger id="brand">
                        <SelectValue placeholder="Sem marca">{brand || "Sem marca"}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sem marca</SelectItem>
                        {brandOptions.map((name) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input id="brand" value={brand || "Sem marca"} readOnly disabled />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="f01">FORNECEDOR 01</Label>
                  <Input id="f01" value={fornecedor01} onChange={(e) => setFornecedor01(e.target.value)} />
                </div>
              </div>
            </fieldset>

            <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 p-4">
              <div className="space-y-0.5">
                <Label htmlFor="visible" className="text-sm font-semibold">
                  Visível no catálogo público
                </Label>
                <p className="text-xs text-muted-foreground">
                  Desative para ocultar este produto sem precisar excluí-lo.
                </p>
              </div>
              <Switch id="visible" checked={isVisible} onCheckedChange={setIsVisible} />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/30 p-4">
              <div className="space-y-0.5">
                <Label htmlFor="price-visible" className="text-sm font-semibold">
                  Mostrar preços no catálogo público
                </Label>
                <p className="text-xs text-muted-foreground">
                  Desative para exibir o produto sem os valores (o cliente consulta por WhatsApp).
                </p>
              </div>
              <Switch id="price-visible" checked={priceVisible} onCheckedChange={setPriceVisible} />
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
