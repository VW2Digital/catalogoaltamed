import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw, Check } from "lucide-react";
import { SettingsPageHeader } from "@/components/admin/SettingsPageHeader";
import {
  COLOR_PRESETS,
  hexToHsl,
  hslToHex,
  useThemeSettings,
} from "@/hooks/useThemeSettings";

export default function ThemeSettings() {
  const { settings, loading, preview, resetPreview, save } = useThemeSettings();
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await save({ primary_hsl: settings.primary_hsl });
      toast.success("Cor salva");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="max-w-2xl space-y-8">
        <SettingsPageHeader title="Cores do Tema" description="Cor primária e identidade visual." />
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </section>
    );
  }

  const currentHex = hslToHex(settings.primary_hsl);

  return (
    <section className="max-w-2xl space-y-8">
      <SettingsPageHeader
        title="Cores do Tema"
        description="As alterações são aplicadas em tempo real em toda a interface."
      />

      <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-card">
        <div className="space-y-3">
          <Label>Predefinições</Label>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {COLOR_PRESETS.map((p) => {
              const active = p.hsl === settings.primary_hsl;
              return (
                <button
                  key={p.hsl}
                  type="button"
                  onClick={() => preview({ primary_hsl: p.hsl })}
                  className={`group relative flex h-12 w-full items-center justify-center rounded-xl border transition-all hover:scale-105 ${
                    active ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
                  }`}
                  style={{ backgroundColor: `hsl(${p.hsl})` }}
                  title={p.name}
                >
                  {active && <Check className="h-4 w-4 text-white drop-shadow" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
          <div className="space-y-2">
            <Label htmlFor="color-picker">Cor personalizada</Label>
            <input
              id="color-picker"
              type="color"
              value={currentHex}
              onChange={(e) => preview({ primary_hsl: hexToHsl(e.target.value) })}
              className="h-10 w-20 cursor-pointer rounded-md border bg-transparent"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hsl-input">Valor HSL</Label>
            <Input
              id="hsl-input"
              value={settings.primary_hsl}
              onChange={(e) => preview({ primary_hsl: e.target.value })}
              placeholder="36 55% 50%"
            />
            <p className="text-xs text-muted-foreground">Formato: matiz saturação% luminosidade%</p>
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
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Pré-visualização</Label>
        <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-card">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Botão primário</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secundário</Button>
            <Badge>Etiqueta</Badge>
          </div>
          <div className="rounded-xl bg-gradient-gold p-5 text-primary-foreground shadow-gold">
            <p className="text-xs uppercase tracking-wider opacity-80">Destaque</p>
            <p className="text-2xl font-bold">R$ 1.299,00</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Texto do corpo de exemplo com{" "}
            <a href="#" className="font-medium text-primary underline-offset-4 hover:underline">
              link primário
            </a>{" "}
            para verificar contraste.
          </p>
        </div>
      </div>
    </section>
  );
}