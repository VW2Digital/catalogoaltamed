import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { SettingsPageHeader } from "@/components/admin/SettingsPageHeader";
import { FONT_OPTIONS, useThemeSettings } from "@/hooks/useThemeSettings";

export default function FontsSettings() {
  const { settings, loading, preview, resetPreview, save } = useThemeSettings();
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await save({
        font_heading: settings.font_heading,
        font_body: settings.font_body,
      });
      toast.success("Fontes salvas");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="max-w-2xl space-y-8">
        <SettingsPageHeader title="Fontes" description="Fonte dos títulos e do corpo do texto." />
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-2xl space-y-8">
      <SettingsPageHeader
        title="Fontes"
        description="As alterações são aplicadas em tempo real em toda a interface."
      />

      <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="heading-font">Fonte dos títulos</Label>
            <Select
              value={settings.font_heading}
              onValueChange={(v) => preview({ font_heading: v })}
            >
              <SelectTrigger id="heading-font">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => (
                  <SelectItem key={f} value={f} style={{ fontFamily: `'${f}'` }}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="body-font">Fonte do corpo</Label>
            <Select
              value={settings.font_body}
              onValueChange={(v) => preview({ font_body: v })}
            >
              <SelectTrigger id="body-font">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => (
                  <SelectItem key={f} value={f} style={{ fontFamily: `'${f}'` }}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
          <Button type="button" variant="outline" onClick={resetPreview} disabled={saving}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Descartar
          </Button>
        </div>
      </div>

      {/* Live preview panel */}
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          Pré-visualização
        </Label>
        <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-card">
          <h1 className="text-3xl font-bold tracking-tight">Título principal da loja</h1>
          <h2 className="text-xl font-semibold">Subtítulo de seção</h2>
          <p className="text-base text-muted-foreground">
            Este é um parágrafo de exemplo usando a fonte do corpo. Permite avaliar legibilidade,
            espaçamento e o ritmo do texto em telas de catálogo, descrições de produto e
            confirmações de pedido.
          </p>
          <p className="text-sm">
            Números: <span className="font-semibold">R$ 1.299,00</span> · Código: PROD-00123
          </p>
        </div>
      </div>
    </section>
  );
}