import { Link } from "react-router-dom";
import { ArrowRight, FolderOpen } from "lucide-react";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";

type Scale = {
  id: "sm" | "base" | "lg";
  label: string;
  description: string;
  catalogTitle: string;
  catalogMeta: string;
  productOverrides: string;
};

const SCALES: Scale[] = [
  {
    id: "sm",
    label: "Pequeno (sm)",
    description: "Versão compacta — mais densidade na página.",
    catalogTitle: "text-base",
    catalogMeta: "text-xs",
    productOverrides:
      "[&_h3]:!text-base [&_p.text-muted-foreground]:!text-xs [&_p.text-primary]:!text-base",
  },
  {
    id: "base",
    label: "Base (atual)",
    description: "Tamanho atualmente em produção.",
    catalogTitle: "text-lg",
    catalogMeta: "text-sm",
    productOverrides:
      "[&_h3]:!text-xl [&_p.text-muted-foreground]:!text-lg [&_p.text-primary]:!text-lg",
  },
  {
    id: "lg",
    label: "Grande (lg)",
    description: "Mais legível — bom para clientes mobile.",
    catalogTitle: "text-2xl",
    catalogMeta: "text-base",
    productOverrides:
      "[&_h3]:!text-2xl [&_p.text-muted-foreground]:!text-xl [&_p.text-primary]:!text-2xl",
  },
];

const MOCK_CATALOG = {
  name: "Catálogo Altamed Aesthetics",
  product_count: 42,
};

const MOCK_PRODUCT: ProductCardData = {
  code: "ALT-001",
  name: "Ácido Hialurônico Premium 2ml",
  category: "Preenchedores",
  brand: "Altamed",
  unit: "un",
  price: 890,
  image_url: null,
};

function CatalogCardPreview({ scale }: { scale: Scale }) {
  return (
    <Link
      to="#"
      onClick={(e) => e.preventDefault()}
      className="group flex h-full flex-col rounded-2xl border bg-card p-2 shadow-card transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-card-hover"
    >
      <section className="relative flex min-h-[180px] flex-1 flex-col overflow-hidden rounded-xl bg-accent p-6">
        <header className="flex shrink-0 items-start justify-between gap-3">
          <span
            className={`inline-flex items-center font-bold leading-none text-foreground/80 ${scale.catalogMeta}`}
          >
            {MOCK_CATALOG.product_count} produtos
          </span>
        </header>
      </section>
      <footer className="flex flex-col items-stretch gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="m-0 flex aspect-square h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-gold p-0 shadow-gold">
            <FolderOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <p
            className={`min-w-0 font-bold leading-tight [text-wrap:balance] break-words ${scale.catalogTitle}`}
          >
            {MOCK_CATALOG.name}
          </p>
        </div>
        <span className="inline-flex w-full flex-shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-2xl bg-primary px-3 py-2 text-xs font-medium text-primary-foreground sm:w-auto">
          Ver catálogo
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </footer>
    </Link>
  );
}

function ScaledProductCard({ scale }: { scale: Scale }) {
  return (
    <div className={scale.productOverrides}>
      <ProductCard product={MOCK_PRODUCT} />
    </div>
  );
}

export default function TypographyPreview() {
  return (
    <section>
      <header>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Preview de tipografia
        </h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">
          Compare lado a lado os cards de catálogo e de produto em três escalas
          tipográficas para validar rapidamente qual prefere.
        </p>
      </header>

      <div className="mt-10 space-y-14">
        {SCALES.map((scale) => (
          <section key={scale.id} aria-labelledby={`scale-${scale.id}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2
                id={`scale-${scale.id}`}
                className="text-3xl font-bold tracking-tight text-foreground"
              >
                {scale.label}
              </h2>
              <p className="text-sm text-muted-foreground">{scale.description}</p>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-medium text-muted-foreground">
                  Card de catálogo (Index)
                </p>
                <CatalogCardPreview scale={scale} />
              </div>
              <div>
                <p className="mb-3 text-sm font-medium text-muted-foreground">
                  Card de produto (Catálogo público)
                </p>
                <ScaledProductCard scale={scale} />
              </div>
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}