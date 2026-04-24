import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, AlertCircle } from "lucide-react";
import { SettingsPageHeader } from "@/components/admin/SettingsPageHeader";
import { validateWhatsApp, formatWhatsAppDisplay } from "@/lib/validation";

export default function WhatsAppSettings() {
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function handleChange(v: string) {
    // Normalize live: keep digits only
    const digits = v.replace(/\D/g, "").slice(0, 15);
    setNumber(digits);
    if (error) setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const result = validateWhatsApp(number);
    if (!result.ok) {
      const msg = result.error ?? "Número inválido";
      setError(msg);
      toast.error(msg);
      return;
    }
    setSaving(true);
    const { error: dbError } = await supabase
      .from("settings")
      .upsert({ key: "whatsapp_number", value: result.value }, { onConflict: "key" });
    setSaving(false);
    if (dbError) toast.error(dbError.message);
    else {
      toast.success("Número salvo");
      setNumber(result.value);
    }
  }

  return (
    <section className="max-w-2xl space-y-8">
      <SettingsPageHeader
        title="WhatsApp"
        description="Número que receberá as consultas de preço dos produtos."
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4 rounded-2xl border bg-card p-6 shadow-card">
          <div className="space-y-2">
            <Label htmlFor="whatsapp">Número de WhatsApp</Label>
            <Input
              id="whatsapp"
              inputMode="numeric"
              placeholder="Ex.: 5511999999999 (com DDI e DDD)"
              value={number}
              onChange={(e) => handleChange(e.target.value)}
              aria-invalid={!!error}
              aria-describedby={error ? "whatsapp-error" : "whatsapp-help"}
            />
            {error ? (
              <p
                id="whatsapp-error"
                className="flex items-center gap-1.5 text-xs font-medium text-destructive"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </p>
            ) : (
              <p id="whatsapp-help" className="text-xs text-muted-foreground">
                Apenas dígitos. Inclua DDI (55 para Brasil) + DDD + número.
                {number ? ` Pré-visualização: ${formatWhatsAppDisplay(number)}` : ""}
              </p>
            )}
          </div>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      )}
    </section>
  );
}