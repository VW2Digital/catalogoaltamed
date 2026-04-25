import { ImageOff } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { formatBRL } from "@/lib/format";

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
  whatsappNumber?: string;
  layout?: "grid" | "list";
  compact?: boolean;
};

export function ProductCard({ product, whatsappNumber, layout = "grid", compact = false }: Props) {
  const waLink = buildWhatsAppLink(whatsappNumber ?? "", product.name, product.image_url);
  const ctaLabel = compact ? "Consultar" : "Consultar Disponibilidade";

  if (layout === "list") {
    return (
      <article className="group relative flex gap-4 rounded-2xl bg-card p-4 shadow-card transition-all duration-300 ease-smooth hover:shadow-card-hover">
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
          {Number(product.price) > 0 && (
            <p className="mt-1 text-base font-bold text-primary">
              {formatBRL(product.price)}
            </p>
          )}

          <div className="mt-2">
            {waLink ? (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="price-pill inline-flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-transform hover:scale-[1.02]"
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
                <span className="tracking-tight font-semibold text-[0.675rem]">{ctaLabel}</span>
              </a>
            ) : (
              <div
                className="price-pill inline-flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold opacity-80"
                title="Configure o número de WhatsApp no admin"
              >
                <span className="shrink-0 tracking-tight font-semibold text-[0.675rem]">{ctaLabel}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex flex-col rounded-2xl bg-card p-5 shadow-card transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-card-hover">
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
        <h3 className="text-sm font-bold leading-tight text-foreground">
          {product.name}
        </h3>
        {product.category && (
          <p className="mt-1 text-sm text-muted-foreground">{product.category}</p>
        )}
        {Number(product.price) > 0 && (
          <p className="mt-2 text-lg font-bold text-primary">
            {formatBRL(product.price)}
          </p>
        )}
      </div>

      {waLink ? (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="price-pill mt-5 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-transform hover:scale-[1.02]"
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
          <span className="tracking-tight font-semibold text-[0.675rem]">{ctaLabel}</span>
        </a>
      ) : (
        <div
          className="price-pill mt-5 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold opacity-80"
          title="Configure o número de WhatsApp no admin"
        >
          <span className="shrink-0 tracking-tight font-semibold text-[0.675rem]">{ctaLabel}</span>
        </div>
      )}
    </article>
  );
}