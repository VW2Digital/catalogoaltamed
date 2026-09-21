import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, Upload, User } from "lucide-react";
import { SettingsPageHeader } from "@/components/admin/SettingsPageHeader";
import { useVendors, type Vendor } from "@/hooks/useVendors";

type Draft = {
  name: string;
  phone: string;
  role_title: string;
  avatar_url: string;
  is_active: boolean;
};

const emptyDraft: Draft = {
  name: "",
  phone: "",
  role_title: "",
  avatar_url: "",
  is_active: true,
};

export default function VendorsSettings() {
  const { vendors, loading, reload } = useVendors(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadAvatar(file: File): Promise<string | null> {
    if (!file.type.startsWith("image/")) {
      toast.error("Envie um arquivo de imagem.");
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 5MB).");
      return null;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `vendors/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("branding").upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
    });
    if (error) {
      toast.error(error.message);
      return null;
    }
    return supabase.storage.from("branding").getPublicUrl(path).data.publicUrl;
  }

  async function handleAvatarChange(file: File) {
    setUploading(true);
    const url = await uploadAvatar(file);
    if (url) setDraft((d) => ({ ...d, avatar_url: url }));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = draft.name.trim();
    const phone = draft.phone.replace(/\D/g, "");
    if (!name) return toast.error("Informe o nome do vendedor.");
    if (phone.length < 10) return toast.error("Informe um WhatsApp válido com DDD.");
    setSaving(true);
    const { error } = await supabase.from("vendors").insert({
      name,
      phone,
      role_title: draft.role_title.trim() || null,
      avatar_url: draft.avatar_url || null,
      is_active: draft.is_active,
      sort_order: vendors.length,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    setDraft(emptyDraft);
    toast.success("Vendedor adicionado");
    reload();
  }

  async function updateVendor(v: Vendor, patch: Partial<Vendor>) {
    const { error } = await supabase.from("vendors").update(patch).eq("id", v.id);
    if (error) return toast.error(error.message);
    reload();
  }

  async function removeVendor(v: Vendor) {
    const { error } = await supabase.from("vendors").delete().eq("id", v.id);
    if (error) return toast.error(error.message);
    toast.success("Vendedor removido");
    reload();
  }

  async function changeAvatar(v: Vendor, file: File) {
    const url = await uploadAvatar(file);
    if (url) updateVendor(v, { avatar_url: url });
  }

  return (
    <section className="max-w-3xl space-y-8">
      <SettingsPageHeader
        title="Vendedores"
        description="Quem aparece para o cliente escolher ao enviar o pedido no WhatsApp."
      />

      <form onSubmit={handleCreate} className="space-y-4 rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted/40">
            {draft.avatar_url ? (
              <img src={draft.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <User className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAvatarChange(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Foto do vendedor
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="v-name">Nome</Label>
            <Input
              id="v-name"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Ex.: Bruno"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="v-phone">WhatsApp</Label>
            <Input
              id="v-phone"
              value={draft.phone}
              onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
              placeholder="Ex.: 5591999999999"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="v-role">Cargo (opcional)</Label>
            <Input
              id="v-role"
              value={draft.role_title}
              onChange={(e) => setDraft((d) => ({ ...d, role_title: e.target.value }))}
              placeholder="Ex.: Consultor de vendas"
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border p-3">
          <div>
            <p className="text-sm font-medium">Disponível para os clientes</p>
            <p className="text-xs text-muted-foreground">Aparece na escolha do vendedor.</p>
          </div>
          <Switch
            checked={draft.is_active}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, is_active: v }))}
          />
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Adicionar vendedor
        </Button>
      </form>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : vendors.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhum vendedor cadastrado ainda.
          </p>
        ) : (
          vendors.map((v) => <VendorRow key={v.id} vendor={v} onUpdate={updateVendor} onRemove={removeVendor} onAvatar={changeAvatar} />)
        )}
      </div>
    </section>
  );
}

function VendorRow({
  vendor,
  onUpdate,
  onRemove,
  onAvatar,
}: {
  vendor: Vendor;
  onUpdate: (v: Vendor, patch: Partial<Vendor>) => void;
  onRemove: (v: Vendor) => void;
  onAvatar: (v: Vendor, file: File) => void;
}) {
  const [name, setName] = useState(vendor.name);
  const [phone, setPhone] = useState(vendor.phone);
  const [role, setRole] = useState(vendor.role_title ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty =
    name !== vendor.name || phone !== vendor.phone || role !== (vendor.role_title ?? "");

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 shadow-card">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-muted/40"
        aria-label="Trocar foto"
      >
        {vendor.avatar_url ? (
          <img src={vendor.avatar_url} alt={vendor.name} className="h-full w-full object-cover" />
        ) : (
          <User className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onAvatar(vendor, f);
        }}
      />

      <div className="grid min-w-[220px] flex-1 gap-2 sm:grid-cols-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp" />
        <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Cargo" />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={vendor.is_active}
          onCheckedChange={(checked) => onUpdate(vendor, { is_active: checked })}
          aria-label="Disponível"
        />
        {dirty && (
          <Button
            size="icon"
            variant="secondary"
            aria-label="Salvar"
            onClick={() =>
              onUpdate(vendor, {
                name: name.trim(),
                phone: phone.replace(/\D/g, ""),
                role_title: role.trim() || null,
              })
            }
          >
            <Save className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          aria-label="Remover"
          onClick={() => onRemove(vendor)}
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
