import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogId: string;
  onImported: () => void;
};

const EXPECTED_HEADERS = [
  "CÓDIGO","PRODUTO","DESCRIÇÃO ATIVO","LISTA","CLASSIFICAÇÃO","UND","QTD",
  "VLR. COMPRA","CUSTO S/ ANTECIP","CUSTO C/ ANTECIP","VLR. VENDA",
  "FORNECEDOR","NOTA FISCAL","SUGESTÃO DE CADASTRO","MARCA","VLR MERCADO","FORNECEDOR 01",
];

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        cur.push(field); field = "";
        if (cur.some((v) => v.trim() !== "")) rows.push(cur);
        cur = [];
      } else field += c;
    }
  }
  if (field !== "" || cur.length) {
    cur.push(field);
    if (cur.some((v) => v.trim() !== "")) rows.push(cur);
  }
  return rows;
}

function parseMoneyStrict(v: string): { value: number | null; error?: string } {
  if (!v || !v.trim()) return { value: null };
  const cleaned = v.replace(/R\$\s?/gi, "").replace(/\./g, "").replace(",", ".").trim();
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return { value: null, error: `valor inválido "${v}"` };
  if (n < 0) return { value: null, error: `valor negativo "${v}"` };
  return { value: n };
}

function parseNumStrict(v: string): { value: number | null; error?: string } {
  if (!v || !v.trim()) return { value: null };
  const n = Number(v.replace(",", ".").trim());
  if (!Number.isFinite(n)) return { value: null, error: `número inválido "${v}"` };
  return { value: n };
}

const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, " ");

type RowStatus = "ok" | "warning" | "error" | "skipped";

type PreviewRow = {
  rowNum: number;
  code: string;
  name: string;
  category: string;
  brand: string;
  price: number | null;
  qtd: number | null;
  vlr_compra: number | null;
  status: RowStatus;
  errors: string[];
  warnings: string[];
  payload: any | null;
};

type Step = "upload" | "preview" | "importing";

export default function ImportProductsDialog({
  open,
  onOpenChange,
  catalogId,
  onImported,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [progress, setProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);

  function reset() {
    setStep("upload");
    setFileName("");
    setPreview([]);
    setProgress(0);
  }

  function handleFile(file: File) {
    setFileName(file.name);
    setAnalyzing(true);
    const isXlsx = /\.(xlsx|xls)$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = async () => {
      let parsed: string[][] = [];
      try {
        if (isXlsx) {
          const data = new Uint8Array(reader.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const arr = XLSX.utils.sheet_to_json<any[]>(ws, {
            header: 1, raw: false, defval: "",
          });
          parsed = arr.map((r) => r.map((v) => (v == null ? "" : String(v))));
        } else {
          parsed = parseCSV(String(reader.result ?? ""));
        }
      } catch (err: any) {
        toast.error(`Falha ao ler arquivo: ${err.message ?? err}`);
        setAnalyzing(false);
        return;
      }
      if (parsed.length < 2) {
        toast.error("Arquivo vazio ou inválido");
        setAnalyzing(false);
        return;
      }
      const headers = parsed[0].map(norm);
      const idx: Record<string, number> = {};
      EXPECTED_HEADERS.forEach((h) => {
        const i = headers.indexOf(norm(h));
        if (i !== -1) idx[h] = i;
      });
      if (idx["CÓDIGO"] === undefined || idx["PRODUTO"] === undefined) {
        toast.error("Arquivo precisa ter ao menos as colunas CÓDIGO e PRODUTO");
        setAnalyzing(false);
        return;
      }

      // Buscar códigos já existentes neste catálogo
      const { data: existing } = await supabase
        .from("products")
        .select("code")
        .eq("catalog_id", catalogId);
      const existingCodes = new Set(
        (existing ?? []).map((r: any) => String(r.code).trim().toLowerCase()),
      );

      const get = (row: string[], h: string) =>
        idx[h] !== undefined ? (row[idx[h]] ?? "").trim() : "";

      const seenInFile = new Map<string, number>();
      const dataRows = parsed.slice(1);
      const result: PreviewRow[] = dataRows.map((row, i) => {
        const rowNum = i + 2; // +1 cabeçalho, +1 1-index
        const errors: string[] = [];
        const warnings: string[] = [];

        const code = get(row, "CÓDIGO");
        const name = get(row, "PRODUTO");
        const category = get(row, "CLASSIFICAÇÃO");
        const brand = get(row, "MARCA");
        const unit = get(row, "UND") || "UND";

        if (!code) errors.push("CÓDIGO obrigatório");
        if (!name) errors.push("PRODUTO obrigatório");
        if (code.length > 40) errors.push("CÓDIGO > 40 caracteres");
        if (name.length > 200) errors.push("PRODUTO > 200 caracteres");

        const priceRaw = get(row, "VLR. VENDA");
        const price = parseMoneyStrict(priceRaw);
        if (price.error) errors.push(`VLR. VENDA: ${price.error}`);
        else if (price.value == null) warnings.push("VLR. VENDA vazio (será 0)");

        const qtd = parseNumStrict(get(row, "QTD"));
        if (qtd.error) errors.push(`QTD: ${qtd.error}`);

        const vc = parseMoneyStrict(get(row, "VLR. COMPRA"));
        if (vc.error) errors.push(`VLR. COMPRA: ${vc.error}`);
        const cs = parseMoneyStrict(get(row, "CUSTO S/ ANTECIP"));
        if (cs.error) errors.push(`CUSTO S/ ANTECIP: ${cs.error}`);
        const cc = parseMoneyStrict(get(row, "CUSTO C/ ANTECIP"));
        if (cc.error) errors.push(`CUSTO C/ ANTECIP: ${cc.error}`);
        const vm = parseMoneyStrict(get(row, "VLR MERCADO"));
        if (vm.error) errors.push(`VLR MERCADO: ${vm.error}`);

        const codeKey = code.toLowerCase();
        if (code) {
          if (seenInFile.has(codeKey)) {
            errors.push(`CÓDIGO duplicado no arquivo (linha ${seenInFile.get(codeKey)})`);
          } else {
            seenInFile.set(codeKey, rowNum);
          }
          if (existingCodes.has(codeKey)) {
            warnings.push("CÓDIGO já existe no catálogo");
          }
        }

        const status: RowStatus = errors.length ? "error" : warnings.length ? "warning" : "ok";

        const payload = errors.length ? null : {
          catalog_id: catalogId,
          code,
          name,
          descricao_ativo: get(row, "DESCRIÇÃO ATIVO") || null,
          lista: get(row, "LISTA") || null,
          category: category || null,
          unit,
          qtd: qtd.value,
          vlr_compra: vc.value,
          custo_sem_antecip: cs.value,
          custo_com_antecip: cc.value,
          price: price.value ?? 0,
          fornecedor: get(row, "FORNECEDOR") || null,
          nota_fiscal: get(row, "NOTA FISCAL") || null,
          sugestao_cadastro: get(row, "SUGESTÃO DE CADASTRO") || null,
          brand: brand || null,
          vlr_mercado: vm.value,
          fornecedor_01: get(row, "FORNECEDOR 01") || null,
          is_visible: true,
        };

        return {
          rowNum, code, name, category, brand,
          price: price.value, qtd: qtd.value, vlr_compra: vc.value,
          status, errors, warnings, payload,
        };
      });

      setPreview(result);
      setStep("preview");
      setAnalyzing(false);
    };
    if (isXlsx) reader.readAsArrayBuffer(file);
    else reader.readAsText(file, "utf-8");
  }

  const stats = useMemo(() => {
    const ok = preview.filter((r) => r.status === "ok").length;
    const warn = preview.filter((r) => r.status === "warning").length;
    const err = preview.filter((r) => r.status === "error").length;
    const dup = preview.filter((r) => r.warnings.some((w) => w.includes("já existe"))).length;
    return { ok, warn, err, dup, total: preview.length };
  }, [preview]);

  const toImport = useMemo(() => {
    return preview.filter((r) => {
      if (r.status === "error") return false;
      if (skipDuplicates && r.warnings.some((w) => w.includes("já existe"))) return false;
      return true;
    });
  }, [preview, skipDuplicates]);

  async function handleImport() {
    if (!toImport.length) return;
    setStep("importing");
    setProgress(0);
    const payloads = toImport.map((r) => r.payload).filter(Boolean);
    let inserted = 0;
    let failed = 0;
    const CHUNK = 50;
    try {
      for (let i = 0; i < payloads.length; i += CHUNK) {
        const slice = payloads.slice(i, i + CHUNK);
        const { error } = await supabase.from("products").insert(slice);
        if (error) {
          failed += slice.length;
          console.error("Erro lote", error);
        } else {
          inserted += slice.length;
        }
        setProgress(Math.round(((i + slice.length) / payloads.length) * 100));
      }
      if (failed > 0) toast.warning(`${inserted} importados, ${failed} falharam`);
      else toast.success(`${inserted} produtos importados`);
      onImported();
      onOpenChange(false);
      reset();
    } catch (err: any) {
      toast.error(err.message ?? "Falha na importação");
      setStep("preview");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Importar produtos (CSV ou XLSX)"}
            {step === "preview" && "Prévia da importação"}
            {step === "importing" && "Importando…"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" &&
              "Envie a planilha base (.csv ou .xlsx) para revisão antes de salvar."}
            {step === "preview" &&
              "Revise erros e avisos. Linhas com erro não serão importadas."}
            {step === "importing" && "Salvando produtos no catálogo…"}
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="mt-4 space-y-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={analyzing}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 p-8 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Analisando arquivo…</span>
                </>
              ) : fileName ? (
                <>
                  <FileText className="h-6 w-6" />
                  <span className="font-medium text-foreground">{fileName}</span>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6" />
                  <span>Clique para selecionar o arquivo (CSV ou XLSX)</span>
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <p className="text-xs text-muted-foreground">
              Colunas reconhecidas: CÓDIGO, PRODUTO, DESCRIÇÃO ATIVO, LISTA, CLASSIFICAÇÃO, UND, QTD,
              VLR. COMPRA, CUSTO S/ ANTECIP, CUSTO C/ ANTECIP, VLR. VENDA, FORNECEDOR, NOTA FISCAL,
              SUGESTÃO DE CADASTRO, MARCA, VLR MERCADO, FORNECEDOR 01.
            </p>
          </div>
        )}

        {step === "preview" && (
          <div className="mt-4 flex flex-col gap-4 overflow-hidden">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <StatCard label="Total" value={stats.total} />
              <StatCard label="OK" value={stats.ok} tone="success" />
              <StatCard label="Avisos" value={stats.warn} tone="warning" />
              <StatCard label="Erros" value={stats.err} tone="error" />
              <StatCard label="Duplicados" value={stats.dup} tone="warning" />
            </div>

            {stats.dup > 0 && (
              <label className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3 text-sm">
                <Checkbox
                  checked={skipDuplicates}
                  onCheckedChange={(v) => setSkipDuplicates(!!v)}
                />
                <span>
                  Pular CÓDIGOS já existentes no catálogo ({stats.dup}). Desmarque para criar
                  registros duplicados.
                </span>
              </label>
            )}

            <div className="flex-1 overflow-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted text-left">
                  <tr>
                    <th className="px-2 py-2">Linha</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Código</th>
                    <th className="px-2 py-2">Produto</th>
                    <th className="px-2 py-2">Marca</th>
                    <th className="px-2 py-2 text-right">Preço</th>
                    <th className="px-2 py-2">Mensagens</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r) => (
                    <tr
                      key={r.rowNum}
                      className={
                        r.status === "error"
                          ? "bg-destructive/5"
                          : r.status === "warning"
                          ? "bg-amber-500/5"
                          : ""
                      }
                    >
                      <td className="px-2 py-1.5 text-muted-foreground">{r.rowNum}</td>
                      <td className="px-2 py-1.5">
                        {r.status === "ok" && (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3.5 w-3.5" /> OK
                          </span>
                        )}
                        {r.status === "warning" && (
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="h-3.5 w-3.5" /> Aviso
                          </span>
                        )}
                        {r.status === "error" && (
                          <span className="inline-flex items-center gap-1 text-destructive">
                            <XCircle className="h-3.5 w-3.5" /> Erro
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 font-mono">{r.code || "—"}</td>
                      <td className="px-2 py-1.5 max-w-[260px] truncate" title={r.name}>
                        {r.name || "—"}
                      </td>
                      <td className="px-2 py-1.5">{r.brand || "—"}</td>
                      <td className="px-2 py-1.5 text-right">
                        {r.price != null ? `R$ ${r.price.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-2 py-1.5 text-muted-foreground">
                        {[...r.errors, ...r.warnings].join(" · ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="mt-6 space-y-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-center text-xs text-muted-foreground">{progress}% importado…</p>
          </div>
        )}

        <DialogFooter className="mt-4">
          {step === "preview" && (
            <Button type="button" variant="outline" onClick={reset}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Trocar arquivo
            </Button>
          )}
          {step !== "importing" && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
          )}
          {step === "preview" && (
            <Button
              type="button"
              onClick={handleImport}
              disabled={!toImport.length}
            >
              Importar {toImport.length} produto{toImport.length === 1 ? "" : "s"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  label, value, tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "warning" | "error";
}) {
  const color =
    tone === "success" ? "text-green-600"
    : tone === "warning" ? "text-amber-600"
    : tone === "error" ? "text-destructive"
    : "text-foreground";
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
