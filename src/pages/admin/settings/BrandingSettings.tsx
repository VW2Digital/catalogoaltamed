import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save, Upload, Trash2, Image as ImageIcon, AlertCircle } from "lucide-react";
import { SettingsPageHeader } from "@/components/admin/SettingsPageHeader";
import { validateImageFile } from "@/lib/imageValidation";
import {
  validateStoreName,
  validateStoreDescription,
  validateUrl,
} from "@/lib/validation";

const KEYS = ["store_name", "store_description", "logo_url"] as const;
type Key = (typeof KEYS)[number];

export default function BrandingSettings() {
  const [values, setValues] = useState<Record<Key, string>>({
    store_name: "",
    store_description: "",
    logo_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", KEYS as unknown as string[]);
      const next: Record<Key, string> = { store_name: "", store_description: "", logo_url: "" };
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
    const validation = await validateImageFile(file, {
      allowed: ["png", "jpeg", "webp", "svg"],
      maxBytes: 5 * 1024 * 1024,
    });
    if (!validation.ok) {
      toast.error(validation.error ?? "Imagem inválida");
      return;
    }
    setUploading(true);
    try {
      // Use extension + content-type derived from the actual binary signature
      // so a spoofed filename can't poison the storage object metadata.
      const path = `logo-${Date.now()}.${validation.ext}`;
      const { error: uploadError } = await supabase.storage
        .from("branding")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: validation.mime,
        });
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

  function setField(key: Key, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validateAll(): { ok: boolean; normalized?: Record<Key, string> } {
    const name = validateStoreName(values.store_name);
    const desc = validateStoreDescription(values.store_description);
    const url = validateUrl(values.logo_url);
    const next: Partial<Record<Key, string>> = {};
    if (!name.ok && name.error) next.store_name = name.error;
    if (!desc.ok && desc.error) next.store_description = desc.error;
    if (!url.ok && url.error) next.logo_url = url.error;
    setErrors(next);
    if (Object.keys(next).length > 0) return { ok: false };
    return {
      ok: true,
      normalized: {
        store_name: name.value,
        store_description: desc.value,
        logo_url: url.value,
      },
    };
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const result = validateAll();
    if (!result.ok || !result.normalized) {
      toast.error("Corrija os campos destacados.");
      return;
    }
    setSaving(true);
    try {
      await persist("store_name", result.normalized.store_name);
      await persist("store_description", result.normalized.store_description);
      await persist("logo_url", result.normalized.logo_url);
      setValues(result.normalized);
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
              onChange={(e) => setField("logo_url", e.target.value)}
              aria-invalid={!!errors.logo_url}
            />
            {errors.logo_url ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.logo_url}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Preenchido automaticamente ao enviar uma imagem.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="store_name">Nome da loja</Label>
            <Input
              id="store_name"
              placeholder="Ex.: Minha Loja"
              value={values.store_name}
              onChange={(e) => setField("store_name", e.target.value)}
              aria-invalid={!!errors.store_name}
              maxLength={60}
            />
            {errors.store_name && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.store_name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="store_description">Descrição</Label>
            <Textarea
              id="store_description"
              placeholder="Descrição curta exibida no catálogo e em compartilhamentos."
              rows={3}
              value={values.store_description}
              onChange={(e) => setField("store_description", e.target.value)}
              aria-invalid={!!errors.store_description}
              maxLength={160}
            />
            {errors.store_description ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.store_description}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {values.store_description.length}/160 caracteres
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