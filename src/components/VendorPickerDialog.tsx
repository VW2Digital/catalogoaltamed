import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, User } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useVendors, type Vendor } from "@/hooks/useVendors";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (vendor: Vendor) => void;
};

export function VendorPickerDialog({ open, onOpenChange, onSelect }: Props) {
  const { vendors, loading } = useVendors(true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Escolha um vendedor</DialogTitle>
          <DialogDescription>
            Selecione com quem você quer falar para enviar o seu pedido no WhatsApp.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : vendors.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum vendedor disponível no momento.
          </p>
        ) : (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
            {vendors.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => onSelect(v)}
                  className="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/60"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                    {v.avatar_url ? (
                      <img
                        src={v.avatar_url}
                        alt={v.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {v.name}
                    </span>
                    {v.role_title && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {v.role_title}
                      </span>
                    )}
                  </span>
                  <WhatsAppIcon className="h-5 w-5 shrink-0 text-primary" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
