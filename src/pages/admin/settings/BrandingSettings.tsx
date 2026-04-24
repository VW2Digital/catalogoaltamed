import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, Upload, Trash2, Image as ImageIcon } from "lucide-react";
import { SettingsPageHeader } from "@/components/admin/SettingsPageHeader";

const KEYS = ["store_name", "logo_url"] as const;
type Key = (typeof KEYS)[number];

export default function BrandingSettings() {
  const [values, setValues] = useState<Record<Key, string>>({
    store_name: "",
    logo_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", KEYS as unknown as string[]);
      const next: Record<Key, string> = { store_name: "", logo_url: "" };
      data?.forEach((row) => {
        if ((KEYS as readonly string[]).includes(row.key)) {
          next[row.key as Key] = row.value ?? "";
        }
      });
      setValues(next);
      setLoading(false);
    })();
  }, []);

  async function persist(key: Key, value: string) {
    const { error } = await supabase
      .from("settings")
      .upsert({ key, value }, { onConflict: "key" });
    if (error) throw error;
  }

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("branding")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from("branding").getPublicUrl(path);
      const url = pub.publicUrl;

      await persist("logo_url", url);
      setValues((v) => ({ ...v, logo_url: url }));
      toast.success("Logo enviado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar logo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveLogo() {
    try {
      const url = values.logo_url;
      if (url) {
        const marker = "/branding/";
        const idx = url.indexOf(marker);
        if (idx !== -1) {
          const path = url.slice(idx + marker.length);
          await supabase.storage.from("branding").remove([path]);
        }
      }
      await persist("logo_url", "");
      setValues((v) => ({ ...v, logo_url: "" }));
      toast.success("Logo removido");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover logo");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await persist("store_name", values.store_name);
      await persist("logo_url", values.logo_url);
      toast.success("Identidade salva");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="max-w-2xl space-y-8">
      <SettingsPageHeader
        title="Logo & Identidade"
        description="Configure o logo e o nome da loja."
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 rounded-2xl border bg-card p-6 shadow-card">
          <div className="space-y-3">
            <Label>Logo da loja</Label>
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/40">
                {values.logo_url ? (
                  <img
                    src={values.logo_url}
                    alt="Logo da loja"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {uploading ? "Enviando..." : values.logo_url ? "Trocar logo" : "Enviar logo"}
                  </Button>
                  {values.logo_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleRemoveLogo}
                      disabled={uploading}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remover
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG ou SVG. Máximo 5MB. Recomendado: fundo transparente.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo_url">URL do logo</Label>
            <Input
              id="logo_url"
              placeholder="https://..."
              value={values.logo_url}
              onChange={(e) => setValues((v) => ({ ...v, logo_url: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Preenchido automaticamente ao enviar uma imagem.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="store_name">Nome da loja</Label>
            <Input
              id="store_name"
              placeholder="Ex.: Minha Loja"
              value={values.store_name}
              onChange={(e) => setValues((v) => ({ ...v, store_name: e.target.value }))}
            />
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