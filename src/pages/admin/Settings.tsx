import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

export default function Settings() {
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "whatsapp_number")
        .maybeSingle();
      setNumber(data?.value ?? "");
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
    <section className="max-w-xl">
      <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Defina o número de WhatsApp que receberá as consultas de preço dos produtos.
      </p>

      <form onSubmit={handleSave} className="mt-8 space-y-4 rounded-2xl border bg-card p-6 shadow-card">
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
    </section>
  );
}