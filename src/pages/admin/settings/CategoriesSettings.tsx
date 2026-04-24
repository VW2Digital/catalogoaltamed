import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import CategoriesManager from "@/components/admin/CategoriesManager";
import { SettingsPageHeader } from "@/components/admin/SettingsPageHeader";

type Catalog = { id: string; name: string };

export default function CategoriesSettings() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <section className="max-w-3xl space-y-8">
      <SettingsPageHeader
        title="Categorias"
        description="Cada catálogo tem suas próprias categorias."
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
        catalogs.map((c) => (
          <div key={c.id} className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {c.name}
            </h3>
            <CategoriesManager catalogId={c.id} />
          </div>
        ))
      )}
    </section>
  );
}