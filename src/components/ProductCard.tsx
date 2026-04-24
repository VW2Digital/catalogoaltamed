import { formatBRL } from "@/lib/format";
import { ImageOff } from "lucide-react";

export type ProductCardData = {
  code: string;
  name: string;
  category?: string | null;
  brand?: string | null;
  unit: string;
  price: number | string;
  image_url?: string | null;
};

type Props = {
  product: ProductCardData;
  className?: string;
};

export function ProductCard({ product }: Props) {
  return (
    <article className="group relative flex flex-col rounded-2xl bg-card p-5 shadow-card transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-card-hover">
      <p className="text-xs font-medium text-muted-foreground">
        Cód.: <span className="text-foreground/80">{product.code}</span>
      </p>

      <div className="mt-4 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-xl bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain transition-transform duration-500 ease-smooth group-hover:scale-105"
          />
        ) : (
          <ImageOff className="h-10 w-10 text-muted-foreground/40" aria-hidden />
        )}
      </div>

      <div className="mt-5 flex-1">
        <h3 className="text-xl font-bold leading-tight text-foreground">
          {product.name}
        </h3>
        {product.category && (
          <p className="mt-1 text-sm text-muted-foreground">{product.category}</p>
        )}
      </div>

      <div className="price-pill mt-5 flex items-center justify-between rounded-full px-5 py-3 text-sm font-semibold">
        <span className="truncate">{product.brand || "—"}</span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-xs uppercase opacity-80">{product.unit}</span>
          <span className="text-lg font-bold tracking-tight">
            {formatBRL(product.price)}
          </span>
        </span>
      </div>
    </article>
  );
}