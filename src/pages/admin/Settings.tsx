import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import CategoriesManager from "@/components/admin/CategoriesManager";

type Catalog = { id: string; name: string };

export default function Settings() {
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: setting }, { data: cats }] = await Promise.all([
        supabase
          .from("settings")
          .select("value")
          .eq("key", "whatsapp_number")
          .maybeSingle(),
        supabase.from("catalogs").select("id,name").order("name", { ascending: true }),
      ]);
      setNumber(setting?.value ?? "");
      setCatalogs((cats as Catalog[]) ?? []);
      setLoading(false);
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const digits = number.replace(/\D/g, "");
    const { error } = await supabase
      .from("settings")
      .upsert({ key: "whatsapp_number", value: digits }, { onConflict: "key" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Número de WhatsApp salvo");
      setNumber(digits);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <section className="max-w-3xl space-y-10">
      <div>
      <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gerencie o WhatsApp de contato e as categorias de cada catálogo.
      </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="text-lg font-semibold">WhatsApp</h2>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">Número de WhatsApp</Label>
          <Input
            id="whatsapp"
            placeholder="Ex.: 5511999999999 (com DDI e DDD)"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Inclua o código do país (55 para Brasil) seguido do DDD e número. Apenas dígitos serão salvos.
          </p>
        </div>
        <Button type="submit" disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </form>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categorias por catálogo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada catálogo tem suas próprias categorias.
          </p>
        </div>

        {catalogs.length === 0 ? (
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
      </div>
    </section>
  );
}