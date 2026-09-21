import { Link } from "react-router-dom";
import { ImageOff, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { PublicHeader } from "@/components/PublicHeader";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { formatBRL } from "@/lib/format";
import { useCart } from "@/hooks/useCart";
import { useWhatsAppNumber } from "@/hooks/useWhatsAppNumber";
import { buildCartWhatsAppLink } from "@/lib/whatsapp";
import { useEffect, useState } from "react";
import { VendorPickerDialog } from "@/components/VendorPickerDialog";
import type { Vendor } from "@/hooks/useVendors";

export default function Bag() {
  const { items, total, count, setQuantity, removeItem, clear } = useCart();
  const { number: whatsappNumber } = useWhatsAppNumber();
  const [pickerOpen, setPickerOpen] = useState(false);
  const waLink = buildCartWhatsAppLink(whatsappNumber, items);

  function handleVendorSelected(vendor: Vendor) {
    const link = buildCartWhatsAppLink(vendor.phone, items) ?? waLink;
    setPickerOpen(false);
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  }

  useEffect(() => {
    document.title = "Sacola — Pedido via WhatsApp";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-page">
      <PublicHeader backTo="/" />
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-2 sm:px-6">
        <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          Minha sacola
        </h1>

        {items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed p-12 text-center">
            <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground/50" aria-hidden />
            <p className="mt-3 text-muted-foreground">Sua sacola está vazia.</p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/">Ver catálogos</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-3 rounded-product-card bg-card p-3 shadow-card"
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ImageOff className="h-6 w-6 text-muted-foreground/40" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Cód.: {item.code}</p>
                    <h2 className="text-sm font-bold leading-tight text-foreground">
                      {item.name}
                    </h2>
                    {item.brand && (
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {item.brand}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-full border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          aria-label="Diminuir quantidade"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-7 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          aria-label="Aumentar quantidade"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.price > 0 && (
                          <span className="text-sm font-bold text-primary">
                            {formatBRL(item.price * item.quantity)}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground"
                          aria-label="Remover item"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 rounded-product-card bg-card p-4 shadow-card">
              <h2 className="text-sm font-bold text-foreground">Resumo do pedido</h2>
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>Itens</span>
                <span className="font-semibold text-foreground">{count}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total estimado</span>
                <span className="text-base font-bold text-primary">{formatBRL(total)}</span>
              </div>
              <button
                type="button"
                onClick={clear}
                className="mt-3 text-xs text-muted-foreground underline underline-offset-4"
              >
                Esvaziar sacola
              </button>
            </div>
          </>
        )}
      </main>

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-3xl gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/">Editar pedido</Link>
            </Button>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="whatsapp-btn inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.01]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Enviar pedido no WhatsApp
            </button>
          </div>
        </div>
      )}

      <VendorPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleVendorSelected}
      />
    </div>
  );
}
