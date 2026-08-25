import { ImageOff, ShoppingBag } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { formatBRL, resolveUnitPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";

export type ProductCardData = {
  code: string;
  name: string;
  category?: string | null;
  brand?: string | null;
  unit: string;
  price: number | string;
  qtd?: number | string | null;
  preco_unitario?: number | string | null;
  image_url?: string | null;
  descricao_ativo?: string | null;
  price_visible?: boolean | null;
};

type Props = {
  product: ProductCardData;
  className?: string;
  whatsappNumber?: string;
  layout?: "grid" | "list";
  compact?: boolean;
  onSelect?: () => void;
};

export function ProductCard({ product, whatsappNumber, layout = "grid", onSelect }: Props) {
  const unitValue = resolveUnitPrice(product.price, product.qtd, product.preco_unitario);
  const showPrices = product.price_visible !== false;
  const waLink = buildWhatsAppLink(whatsappNumber ?? "", product.name, product.image_url);
  const selectProps = onSelect
    ? { onClick: onSelect, role: "button" as const, tabIndex: 0 }
    : {};

  const actions = (
    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-stretch">
      {onSelect && (
        <Button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="h-10 min-w-0 w-full sm:w-auto sm:flex-1"
        >
          <ShoppingBag className="h-4 w-4 shrink-0" />
          <span className="truncate">Adicionar</span>
        </Button>
      )}
      {waLink ? (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          aria-label="Consultar disponibilidade no WhatsApp"
          title="Consultar disponibilidade"
          className="inline-flex h-10 min-w-0 w-full items-center justify-center gap-2 rounded-md border border-primary/40 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 sm:w-auto sm:flex-1"
        >
          <WhatsAppIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">Consultar</span>
        </a>
      ) : (
        <span
          aria-label="WhatsApp não configurado"
          title="Configure o número de WhatsApp no admin"
          className="inline-flex h-10 min-w-0 w-full items-center justify-center gap-2 rounded-md border border-muted text-sm font-semibold text-muted-foreground opacity-60 sm:w-auto sm:flex-1"
        >
          <WhatsAppIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">Consultar</span>
        </span>
      )}
    </div>
  );

  if (layout === "list") {
    return (
      <article
        {...selectProps}
        className={`group relative flex gap-4 rounded-product-card bg-card p-4 shadow-card transition-all duration-300 ease-smooth hover:shadow-card-hover ${onSelect ? "cursor-pointer" : ""}`}
      >
        <div className="flex aspect-square h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-contain"
            />
          ) : (
            <ImageOff className="h-8 w-8 text-muted-foreground/40" aria-hidden />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-xs font-medium text-muted-foreground">
            Cód.: <span className="text-foreground/80">{product.code}</span>
          </p>
          {product.brand && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary">
              {product.brand}
            </p>
          )}
          <h3 className="mt-1 text-base font-bold leading-tight text-foreground line-clamp-2">
            {product.name}
          </h3>
          {product.category && (
            <p className="mt-1 text-sm text-muted-foreground">{product.category}</p>
          )}
          {showPrices && Number(product.price) > 0 && (
            <p className="mt-1 text-base font-bold text-primary">{formatBRL(product.price)}</p>
          )}
          {showPrices && unitValue != null && (
            <p className="text-xs text-muted-foreground">
              Unit.: <span className="font-semibold text-foreground/80">{formatBRL(unitValue)}</span>
            </p>
          )}
          {!showPrices && (
            <p className="mt-1 text-sm font-semibold text-primary">Preço sob consulta</p>
          )}
          {actions}
        </div>
      </article>
    );
  }

  return (
    <article
      {...selectProps}
      className={`group relative flex flex-col rounded-product-card bg-card p-5 shadow-card transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-card-hover ${onSelect ? "cursor-pointer" : ""}`}
    >
      <p className="text-xs font-medium text-muted-foreground">
        Cód.: <span className="text-foreground/80">{product.code}</span>
      </p>

      <div className="mt-4 flex aspect-[16/9] items-center justify-center overflow-hidden rounded-xl bg-white">
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
        {product.brand && (
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {product.brand}
          </p>
        )}
        <h3 className="product-title text-sm font-bold leading-tight text-foreground">{product.name}</h3>
        {product.category && (
          <p className="mt-1 text-sm text-muted-foreground">{product.category}</p>
        )}
        {showPrices && Number(product.price) > 0 && (
          <p className="mt-2 text-lg font-bold text-primary">{formatBRL(product.price)}</p>
        )}
        {showPrices && unitValue != null && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            Unit.: <span className="font-semibold text-foreground/80">{formatBRL(unitValue)}</span>
          </p>
        )}
        {!showPrices && (
          <p className="mt-2 text-sm font-semibold text-primary">Preço sob consulta</p>
        )}
      </div>

      {actions}
    </article>
  );
}