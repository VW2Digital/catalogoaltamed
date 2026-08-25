import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Loader2, Save } from "lucide-react";
import { SettingsPageHeader } from "@/components/admin/SettingsPageHeader";
import {
  applyTitleCaseToDocument,
  useProductTitleCase,
  type TitleCase,
} from "@/hooks/useProductTitleCase";

const OPTIONS: { value: TitleCase; label: string; sample: string }[] = [
  { value: "none", label: "Original", sample: "Ácido Hialurônico 1ml" },
  { value: "uppercase", label: "CAIXA ALTA", sample: "ÁCIDO HIALURÔNICO 1ML" },
  { value: "lowercase", label: "caixa baixa", sample: "ácido hialurônico 1ml" },
  { value: "capitalize", label: "Primeira Maiúscula", sample: "Ácido Hialurônico 1ml" },
];

export default function ProductTitlesSettings() {
  const { value, loading, save } = useProductTitleCase();
  const [selected, setSelected] = useState<TitleCase>("none");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) setSelected(value);
  }, [loading, value]);

  function handleSelect(next: TitleCase) {
    setSelected(next);
    applyTitleCaseToDocument(next); // prévia imediata
  }

  async function handleSave() {
    setSaving(true);
    try {
      await save(selected);
      toast.success("Estilo dos títulos salvo");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
      applyTitleCaseToDocument(value);
      setSelected(value);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="max-w-2xl space-y-8">
      <SettingsPageHeader
        title="Títulos dos Produtos"
        description="Padronize a exibição dos nomes dos produtos no catálogo público."
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-card">
          <div className="grid gap-3 sm:grid-cols-2">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors ${
                  selected === opt.value
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/60"
                }`}
                aria-pressed={selected === opt.value}
              >
                <span className="flex w-full items-center justify-between text-sm font-semibold">
                  {opt.label}
                  {selected === opt.value && <Check className="h-4 w-4 text-primary" />}
                </span>
                <span className="text-xs text-muted-foreground">{opt.sample}</span>
              </button>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving || selected === value}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      )}
    </section>
  );
}
