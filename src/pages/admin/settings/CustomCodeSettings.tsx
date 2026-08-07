import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Save, AlertTriangle } from "lucide-react";
import { SettingsPageHeader } from "@/components/admin/SettingsPageHeader";

const HEAD_KEY = "custom_code_head";
const BODY_KEY = "custom_code_body";
const MAX = 20000;

export default function CustomCodeSettings() {
  const [headCode, setHeadCode] = useState("");
  const [bodyCode, setBodyCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("key,value")
        .in("key", [HEAD_KEY, BODY_KEY]);
      setHeadCode(data?.find((d) => d.key === HEAD_KEY)?.value ?? "");
      setBodyCode(data?.find((d) => d.key === BODY_KEY)?.value ?? "");
      setLoading(false);
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (headCode.length > MAX || bodyCode.length > MAX) {
      toast.error(`Cada bloco deve ter no máximo ${MAX} caracteres`);
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("settings").upsert(
      [
        { key: HEAD_KEY, value: headCode },
        { key: BODY_KEY, value: bodyCode },
      ],
      { onConflict: "key" }
    );
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Códigos salvos. Recarregue a loja para ver o efeito.");
  }

  return (
    <section className="max-w-3xl space-y-8">
      <SettingsPageHeader
        title="Códigos Personalizados"
        description="Injete tags no <head> e antes do </body> da loja (Google Analytics, Meta Pixel, scripts de terceiros, etc.)."
      />

      <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-foreground/80">
          Os códigos inseridos aqui são executados no navegador dos visitantes.
          Cole apenas snippets de fontes confiáveis — código malicioso pode
          comprometer a segurança da sua loja.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form
          onSubmit={handleSave}
          className="space-y-6 rounded-2xl border bg-card p-6 shadow-card"
        >
          <div className="space-y-2">
            <Label htmlFor="head-code">Código do &lt;head&gt;</Label>
            <Textarea
              id="head-code"
              value={headCode}
              onChange={(e) => setHeadCode(e.target.value)}
              placeholder={`<!-- Ex.: Google Analytics -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXX"></script>`}
              className="min-h-[180px] font-sans text-xs"
              maxLength={MAX}
            />
            <p className="text-xs text-muted-foreground">
              Ideal para tags de analytics, verificação de domínio e meta tags.
              {" "}
              <span className="tabular-nums">
                {headCode.length}/{MAX}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body-code">Código antes do &lt;/body&gt;</Label>
            <Textarea
              id="body-code"
              value={bodyCode}
              onChange={(e) => setBodyCode(e.target.value)}
              placeholder={`<!-- Ex.: Chat / Pixel noscript fallback -->`}
              className="min-h-[180px] font-sans text-xs"
              maxLength={MAX}
            />
            <p className="text-xs text-muted-foreground">
              Ideal para widgets de chat, pixels com fallback &lt;noscript&gt; e
              scripts pesados.{" "}
              <span className="tabular-nums">
                {bodyCode.length}/{MAX}
              </span>
            </p>
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
