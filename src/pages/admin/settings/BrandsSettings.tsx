import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import BrandsManager from "@/components/admin/BrandsManager";
import { SettingsPageHeader } from "@/components/admin/SettingsPageHeader";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Catalog = { id: string; name: string };

const ALL_VALUE = "__all__";

export default function BrandsSettings() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string>(ALL_VALUE);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("catalogs")
        .select("id,name")
        .order("name", { ascending: true });
      setCatalogs((data as Catalog[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const visibleCatalogs =
    selected === ALL_VALUE ? catalogs : catalogs.filter((c) => c.id === selected);

  return (
    <section className="max-w-3xl space-y-8">
      <SettingsPageHeader
        title="Marcas"
        description="Cada catálogo tem suas próprias marcas."
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : catalogs.length === 0 ? (
        <p className="rounded-2xl border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground">
          Nenhum catálogo criado ainda.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2 sm:max-w-xs">
            <Label htmlFor="catalog-filter" className="text-xs uppercase tracking-wide text-muted-foreground">
              Filtrar por catálogo
            </Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger id="catalog-filter">
                <SelectValue placeholder="Selecione um catálogo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Todos os catálogos</SelectItem>
                {catalogs.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {visibleCatalogs.length === 0 ? (
            <p className="rounded-2xl border border-dashed bg-card/50 p-8 text-center text-sm text-muted-foreground">
              Nenhum catálogo selecionado.
            </p>
          ) : (
            visibleCatalogs.map((c) => (
              <div key={c.id} className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {c.name}
                </h3>
                <BrandsManager catalogId={c.id} />
              </div>
            ))
          )}
        </>
      )}
    </section>
  );
}