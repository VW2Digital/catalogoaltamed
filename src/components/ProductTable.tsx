import { buildWhatsAppLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { formatBRL } from "@/lib/format";

export type ProductTableItem = {
  id?: string;
  code: string;
  name: string;
  brand?: string | null;
  unit: string;
  price: number | string;
  image_url?: string | null;
};

type Props = {
  title: string;
  items: ProductTableItem[];
  whatsappNumber?: string;
  onSelect?: (item: ProductTableItem) => void;
};

export function ProductTable({ title, items, whatsappNumber, onSelect }: Props) {
  return (
    <div className="overflow-hidden rounded-product-card border border-border bg-card shadow-card">
      <div className="bg-gradient-to-r from-primary/80 via-primary to-primary/80 px-4 py-2.5 text-center">
        <h3 className="text-sm font-bold uppercase tracking-wide text-primary-foreground sm:text-base">
          {title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[0.7rem] uppercase tracking-wide text-muted-foreground sm:text-xs">
              <th className="px-3 py-2 text-center font-bold">Cód.</th>
              <th className="px-3 py-2 font-bold">Produtos</th>
              <th className="px-3 py-2 text-center font-bold">Marca</th>
              <th className="px-3 py-2 text-center font-bold">Und</th>
              <th className="px-3 py-2 text-center font-bold">Vlr. Caixa</th>
              <th className="px-3 py-2 text-center font-bold">Consultar</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const waLink = buildWhatsAppLink(whatsappNumber ?? "", p.name, p.image_url);
              return (
                <tr
                  key={p.id ?? p.code}
                  onClick={() => onSelect?.(p)}
                  className="cursor-pointer border-b border-border/60 text-xs transition-colors last:border-0 hover:bg-muted/40 sm:text-sm"
                >
                  <td className="px-3 py-2 text-center text-muted-foreground">{p.code}</td>
                  <td className="px-3 py-2 font-semibold text-foreground">{p.name}</td>
                  <td className="px-3 py-2 text-center font-medium text-foreground/80">
                    {p.brand ?? "-"}
                  </td>
                  <td className="px-3 py-2 text-center text-foreground/80">{p.unit}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-center font-bold text-primary">
                    {Number(p.price) > 0 ? formatBRL(p.price) : "-"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {waLink ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="price-pill inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-[0.675rem] font-semibold"
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5" />
                        Consultar
                      </a>
                    ) : (
                      <span className="text-[0.675rem] text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
