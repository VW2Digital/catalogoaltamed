import { useEffect, useState } from "react";
import { ImageOff, Minus, Plus, ShoppingBag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatBRL, resolveUnitPrice } from "@/lib/format";
import { useCart, type CartItem } from "@/hooks/useCart";
import { toast } from "sonner";

export type ProductDetail = {
  id: string;
  code: string;
  name: string;
  category?: string | null;
  brand?: string | null;
  unit?: string | null;
  price: number | string;
  qtd?: number | string | null;
  preco_unitario?: number | string | null;
  image_url?: string | null;
  descricao_ativo?: string | null;
  price_visible?: boolean | null;
};

type Props = {
  product: ProductDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProductDetailDialog({ product, open, onOpenChange }: Props) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (open) setQuantity(1);
  }, [open, product?.id]);

  if (!product) return null;
  const showPrices = product.price_visible !== false;

  const handleAdd = () => {
    const item: Omit<CartItem, "quantity"> = {
      id: product.id,
      code: product.code,
      name: product.name,
      brand: product.brand ?? null,
      unit: product.unit ?? null,
      price: Number(product.price) || 0,
      image_url: product.image_url ?? null,
    };
    addItem(item, quantity);
    toast.success("Adicionado à sacola", { description: product.name });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="pr-6 text-base leading-snug">{product.name}</DialogTitle>
          <DialogDescription>Cód.: {product.code}</DialogDescription>
        </DialogHeader>

        <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-product-card bg-white">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <ImageOff className="h-10 w-10 text-muted-foreground/40" aria-hidden />
          )}
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          {product.brand && (
            <div>
              <dt className="text-xs text-muted-foreground">Marca</dt>
              <dd className="font-semibold text-foreground">{product.brand}</dd>
            </div>
          )}
          {product.category && (
            <div>
              <dt className="text-xs text-muted-foreground">Categoria</dt>
              <dd className="font-semibold text-foreground">{product.category}</dd>
            </div>
          )}
          {product.unit && (
            <div>
              <dt className="text-xs text-muted-foreground">Unidade</dt>
              <dd className="font-semibold text-foreground">{product.unit}</dd>
            </div>
          )}
          {showPrices && Number(product.price) > 0 && (
            <div>
              <dt className="text-xs text-muted-foreground">Vlr. Caixa</dt>
              <dd className="font-bold text-primary">{formatBRL(product.price)}</dd>
            </div>
          )}
          {showPrices && resolveUnitPrice(product.price, product.qtd, product.preco_unitario) != null && (
            <div>
              <dt className="text-xs text-muted-foreground">Vlr. Unit.</dt>
              <dd className="font-semibold text-foreground">
                {formatBRL(resolveUnitPrice(product.price, product.qtd, product.preco_unitario)!)}
              </dd>
            </div>
          )}
          {!showPrices && (
            <div>
              <dt className="text-xs text-muted-foreground">Preço</dt>
              <dd className="font-semibold text-primary">Sob consulta</dd>
            </div>
          )}
        </dl>

        {product.descricao_ativo && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.descricao_ativo}
          </p>
        )}

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center rounded-full border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              aria-label="Diminuir quantidade"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              aria-label="Aumentar quantidade"
              onClick={() => setQuantity((q) => q + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button type="button" onClick={handleAdd} className="flex-1">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Adicionar à sacola
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
