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
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalogId: string;
  onImported: () => void;
};

type FieldKey =
  | "code" | "name" | "descricao_ativo" | "lista" | "category" | "unit" | "qtd"
  | "vlr_compra" | "custo_sem_antecip" | "custo_com_antecip" | "price"
  | "fornecedor" | "nota_fiscal" | "sugestao_cadastro" | "brand"
  | "vlr_mercado" | "fornecedor_01";

type FieldDef = {
  key: FieldKey;
  label: string;        // Nome do campo no sistema
  expectedHeader: string; // Cabeçalho esperado no arquivo
  required?: boolean;
  type: "text" | "number" | "money";
};

const FIELDS: FieldDef[] = [
  { key: "code", label: "Código", expectedHeader: "CÓDIGO", required: true, type: "text" },
  { key: "name", label: "Nome do produto", expectedHeader: "PRODUTO", required: true, type: "text" },
  { key: "descricao_ativo", label: "Descrição ativo", expectedHeader: "DESCRIÇÃO ATIVO", type: "text" },
  { key: "lista", label: "Lista", expectedHeader: "LISTA", type: "text" },
  { key: "category", label: "Categoria (Classificação)", expectedHeader: "CLASSIFICAÇÃO", type: "text" },
  { key: "unit", label: "Unidade", expectedHeader: "UND", type: "text" },
  { key: "qtd", label: "Quantidade", expectedHeader: "QTD", type: "number" },
  { key: "vlr_compra", label: "Vlr. compra", expectedHeader: "VLR. COMPRA", type: "money" },
  { key: "custo_sem_antecip", label: "Custo s/ antecip.", expectedHeader: "CUSTO S/ ANTECIP", type: "money" },
  { key: "custo_com_antecip", label: "Custo c/ antecip.", expectedHeader: "CUSTO C/ ANTECIP", type: "money" },
  { key: "price", label: "Preço de venda", expectedHeader: "VLR. VENDA", type: "money" },
  { key: "fornecedor", label: "Fornecedor", expectedHeader: "FORNECEDOR", type: "text" },
  { key: "nota_fiscal", label: "Nota fiscal", expectedHeader: "NOTA FISCAL", type: "text" },
  { key: "sugestao_cadastro", label: "Sugestão de cadastro", expectedHeader: "SUGESTÃO DE CADASTRO", type: "text" },
  { key: "brand", label: "Marca", expectedHeader: "MARCA", type: "text" },
  { key: "vlr_mercado", label: "Vlr. mercado", expectedHeader: "VLR MERCADO", type: "money" },
  { key: "fornecedor_01", label: "Fornecedor 01", expectedHeader: "FORNECEDOR 01", type: "text" },
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
const NONE = "__none__";

type RowStatus = "ok" | "warning" | "error";
type PreviewRow = {
  rowNum: number;
  code: string; name: string; brand: string;
  price: number | null;
  status: RowStatus;
  errors: string[]; warnings: string[];
  payload: any | null;
};

type Step = "upload" | "mapping" | "preview" | "importing";

type DuplicateMode = "block" | "skip" | "update";

export default function ImportProductsDialog({
  open, onOpenChange, catalogId, onImported,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileRows, setFileRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, number | null>>(
    {} as Record<FieldKey, number | null>,
  );
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>("skip");
  const [existingByCode, setExistingByCode] = useState<Map<string, string>>(new Map());
  const [progress, setProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);

  function reset() {
    setStep("upload");
    setFileName(""); setFileHeaders([]); setFileRows([]);
    setMapping({} as any); setPreview([]); setProgress(0);
  }

  function autoDetectMapping(headers: string[]): Record<FieldKey, number | null> {
    const normalized = headers.map(norm);
    const result = {} as Record<FieldKey, number | null>;
    FIELDS.forEach((f) => {
      const i = normalized.indexOf(norm(f.expectedHeader));
      result[f.key] = i === -1 ? null : i;
    });
    return result;
  }

  function handleFile(file: File) {
    setFileName(file.name);
    setAnalyzing(true);
    const isXlsx = /\.(xlsx|xls)$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = () => {
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
        setAnalyzing(false); return;
      }
      if (parsed.length < 2) {
        toast.error("Arquivo vazio ou inválido");
        setAnalyzing(false); return;
      }
      const headers = parsed[0];
      setFileHeaders(headers);
      setFileRows(parsed.slice(1));
      setMapping(autoDetectMapping(headers));
      setStep("mapping");
      setAnalyzing(false);
    };
    if (isXlsx) reader.readAsArrayBuffer(file);
    else reader.readAsText(file, "utf-8");
  }

  const mappingStats = useMemo(() => {
    const mapped = FIELDS.filter((f) => mapping[f.key] != null && mapping[f.key]! >= 0).length;
    const requiredMissing = FIELDS.filter(
      (f) => f.required && (mapping[f.key] == null || mapping[f.key]! < 0),
    );
    return { mapped, total: FIELDS.length, requiredMissing };
  }, [mapping]);

  // Detecta a mesma coluna mapeada em mais de um campo
  const duplicateColumnKeys = useMemo(() => {
    const used = new Map<number, FieldKey[]>();
    FIELDS.forEach((f) => {
      const idx = mapping[f.key];
      if (idx != null && idx >= 0) {
        const arr = used.get(idx) ?? [];
        arr.push(f.key);
        used.set(idx, arr);
      }
    });
    const dup = new Set<FieldKey>();
    used.forEach((keys) => { if (keys.length > 1) keys.forEach((k) => dup.add(k)); });
    return dup;
  }, [mapping]);

  async function buildPreview() {
    setAnalyzing(true);
    const get = (row: string[], key: FieldKey) => {
      const idx = mapping[key];
      if (idx == null || idx < 0) return "";
      return (row[idx] ?? "").trim();
    };

    const { data: existing } = await supabase
      .from("products")
      .select("id, code")
      .eq("catalog_id", catalogId);
    const existingMap = new Map<string, string>(
      (existing ?? []).map((r: any) => [String(r.code).trim().toLowerCase(), r.id]),
    );
    const existingCodes = new Set(existingMap.keys());
    setExistingByCode(existingMap);

    const seenInFile = new Map<string, number>();
    const result: PreviewRow[] = fileRows.map((row, i) => {
      const rowNum = i + 2;
      const errors: string[] = [];
      const warnings: string[] = [];

      const code = get(row, "code");
      const name = get(row, "name");

      if (!code) errors.push("Código obrigatório");
      if (!name) errors.push("Nome obrigatório");
      if (code.length > 40) errors.push("Código > 40 caracteres");
      if (name.length > 200) errors.push("Nome > 200 caracteres");

      const priceRes = parseMoneyStrict(get(row, "price"));
      if (priceRes.error) errors.push(`Preço: ${priceRes.error}`);
      else if (priceRes.value == null) warnings.push("Preço vazio (será 0)");

      const qtd = parseNumStrict(get(row, "qtd"));
      if (qtd.error) errors.push(`Qtd: ${qtd.error}`);

      const vc = parseMoneyStrict(get(row, "vlr_compra"));
      if (vc.error) errors.push(`Vlr. compra: ${vc.error}`);
      const cs = parseMoneyStrict(get(row, "custo_sem_antecip"));
      if (cs.error) errors.push(`Custo s/ antecip.: ${cs.error}`);
      const cc = parseMoneyStrict(get(row, "custo_com_antecip"));
      if (cc.error) errors.push(`Custo c/ antecip.: ${cc.error}`);
      const vm = parseMoneyStrict(get(row, "vlr_mercado"));
      if (vm.error) errors.push(`Vlr. mercado: ${vm.error}`);

      const codeKey = code.toLowerCase();
      if (code) {
        if (seenInFile.has(codeKey)) {
          errors.push(`Código duplicado no arquivo (linha ${seenInFile.get(codeKey)})`);
        } else {
          seenInFile.set(codeKey, rowNum);
        }
        if (existingCodes.has(codeKey)) warnings.push("Código já existe no catálogo");
      }

      const status: RowStatus = errors.length ? "error" : warnings.length ? "warning" : "ok";

      const payload = errors.length ? null : {
        catalog_id: catalogId,
        code, name,
        descricao_ativo: get(row, "descricao_ativo") || null,
        lista: get(row, "lista") || null,
        category: get(row, "category") || null,
        unit: get(row, "unit") || "UND",
        qtd: qtd.value,
        vlr_compra: vc.value,
        custo_sem_antecip: cs.value,
        custo_com_antecip: cc.value,
        price: priceRes.value ?? 0,
        fornecedor: get(row, "fornecedor") || null,
        nota_fiscal: get(row, "nota_fiscal") || null,
        sugestao_cadastro: get(row, "sugestao_cadastro") || null,
        brand: get(row, "brand") || null,
        vlr_mercado: vm.value,
        fornecedor_01: get(row, "fornecedor_01") || null,
        is_visible: true,
      };

      return {
        rowNum, code, name, brand: get(row, "brand"),
        price: priceRes.value, status, errors, warnings, payload,
      };
    });

    setPreview(result);
    setStep("preview");
    setAnalyzing(false);
  }

  const stats = useMemo(() => {
    const ok = preview.filter((r) => r.status === "ok").length;
    const warn = preview.filter((r) => r.status === "warning").length;
    const err = preview.filter((r) => r.status === "error").length;
    const dup = preview.filter((r) => r.warnings.some((w) => w.includes("já existe"))).length;
    return { ok, warn, err, dup, total: preview.length };
  }, [preview]);

  const isDuplicate = (r: PreviewRow) =>
    r.warnings.some((w) => w.includes("já existe"));

  // Aplica regra de duplicados ao status efetivo
  const effectivePreview = useMemo(() => {
    if (duplicateMode !== "block") return preview;
    return preview.map((r) =>
      isDuplicate(r) && r.status !== "error"
        ? {
            ...r,
            status: "error" as RowStatus,
            errors: [...r.errors, "Código duplicado (modo bloquear)"],
          }
        : r,
    );
  }, [preview, duplicateMode]);

  const toImport = useMemo(() => {
    return effectivePreview.filter((r) => {
      if (r.status === "error") return false;
      if (duplicateMode === "skip" && isDuplicate(r)) return false;
      return true; // "update" mantém duplicados, vão por upsert
    });
  }, [effectivePreview, duplicateMode]);

  const counts = useMemo(() => {
    const dups = toImport.filter(isDuplicate).length;
    return { newOnes: toImport.length - dups, updates: dups };
  }, [toImport]);

  async function handleImport() {
    if (!toImport.length) return;
    setStep("importing"); setProgress(0);

    const inserts: any[] = [];
    const updates: { id: string; payload: any }[] = [];
    toImport.forEach((r) => {
      if (!r.payload) return;
      const existingId =
        duplicateMode === "update"
          ? existingByCode.get(r.code.toLowerCase())
          : undefined;
      if (existingId) updates.push({ id: existingId, payload: r.payload });
      else inserts.push(r.payload);
    });

    let insertedCount = 0;
    let updatedCount = 0;
    let failed = 0;
    const total = inserts.length + updates.length;
    let done = 0;
    const CHUNK = 50;

    try {
      // Inserts em lote
      for (let i = 0; i < inserts.length; i += CHUNK) {
        const slice = inserts.slice(i, i + CHUNK);
        const { error } = await supabase.from("products").insert(slice);
        if (error) { failed += slice.length; console.error("Erro insert", error); }
        else insertedCount += slice.length;
        done += slice.length;
        setProgress(Math.round((done / total) * 100));
      }
      // Updates individuais (cada um por id)
      for (const u of updates) {
        const { catalog_id, code, ...rest } = u.payload;
        const { error } = await supabase
          .from("products")
          .update(rest)
          .eq("id", u.id);
        if (error) { failed += 1; console.error("Erro update", error); }
        else updatedCount += 1;
        done += 1;
        setProgress(Math.round((done / total) * 100));
      }
      const parts: string[] = [];
      if (insertedCount) parts.push(`${insertedCount} criado(s)`);
      if (updatedCount) parts.push(`${updatedCount} atualizado(s)`);
      if (failed) parts.push(`${failed} falha(s)`);
      if (failed > 0) toast.warning(parts.join(" · "));
      else toast.success(parts.join(" · ") || "Concluído");
      onImported(); onOpenChange(false); reset();
    } catch (err: any) {
      toast.error(err.message ?? "Falha na importação");
      setStep("preview");
    }
  }

  const canProceedMapping =
    mappingStats.requiredMissing.length === 0 && duplicateColumnKeys.size === 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Importar produtos (CSV ou XLSX)"}
            {step === "mapping" && "Mapear colunas do arquivo"}
            {step === "preview" && "Prévia da importação"}
            {step === "importing" && "Importando…"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Envie a planilha (.csv ou .xlsx)."}
            {step === "mapping" &&
              `Confira para qual campo do sistema cada coluna do arquivo será enviada. ${mappingStats.mapped} de ${mappingStats.total} campos mapeados automaticamente.`}
            {step === "preview" && "Revise erros e avisos. Linhas com erro não serão importadas."}
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
                <><Loader2 className="h-6 w-6 animate-spin" /><span>Analisando…</span></>
              ) : fileName ? (
                <><FileText className="h-6 w-6" /><span className="font-medium text-foreground">{fileName}</span></>
              ) : (
                <><Upload className="h-6 w-6" /><span>Clique para selecionar (CSV ou XLSX)</span></>
              )}
            </button>
            <input
              ref={fileRef} type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {step === "mapping" && (
          <div className="mt-2 flex flex-1 flex-col gap-3 overflow-hidden">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-muted px-2.5 py-1">
                Arquivo: <strong>{fileName}</strong>
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1">
                {fileRows.length} linhas de dados
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1">
                {fileHeaders.length} colunas detectadas
              </span>
            </div>

            {mappingStats.requiredMissing.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  Campos obrigatórios sem coluna mapeada:{" "}
                  <strong>
                    {mappingStats.requiredMissing.map((f) => f.label).join(", ")}
                  </strong>
                </div>
              </div>
            )}

            {duplicateColumnKeys.size > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>A mesma coluna do arquivo foi mapeada para mais de um campo. Ajuste antes de continuar.</div>
              </div>
            )}

            <div className="flex-1 overflow-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted text-left">
                  <tr>
                    <th className="px-3 py-2">Campo do sistema</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Coluna do arquivo</th>
                    <th className="px-3 py-2">Exemplo (linha 2)</th>
                  </tr>
                </thead>
                <tbody>
                  {FIELDS.map((f) => {
                    const idx = mapping[f.key];
                    const isDup = duplicateColumnKeys.has(f.key);
                    const example =
                      idx != null && idx >= 0 && fileRows[0]
                        ? fileRows[0][idx] ?? ""
                        : "";
                    return (
                      <tr key={f.key} className={isDup ? "bg-amber-500/5" : ""}>
                        <td className="px-3 py-2">
                          <span className="font-medium">{f.label}</span>
                          {f.required && (
                            <span className="ml-1 text-destructive">*</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {f.type === "money" ? "R$" : f.type === "number" ? "número" : "texto"}
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={idx == null ? NONE : String(idx)}
                            onValueChange={(v) => {
                              setMapping((prev) => ({
                                ...prev,
                                [f.key]: v === NONE ? null : Number(v),
                              }));
                            }}
                          >
                            <SelectTrigger className="h-8 min-w-[220px]">
                              <SelectValue placeholder="— Não importar —" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE}>— Não importar —</SelectItem>
                              {fileHeaders.map((h, i) => (
                                <SelectItem key={i} value={String(i)}>
                                  {h || `(coluna ${i + 1})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2 max-w-[260px] truncate text-muted-foreground" title={example}>
                          {example || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">*</span> Campos obrigatórios. Os demais são opcionais — selecione "— Não importar —" para ignorar.
            </p>
          </div>
        )}

        {step === "preview" && (
          <div className="mt-2 flex flex-1 flex-col gap-3 overflow-hidden">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <StatCard label="Total" value={stats.total} />
              <StatCard label="OK" value={stats.ok} tone="success" />
              <StatCard label="Avisos" value={stats.warn} tone="warning" />
              <StatCard label="Erros" value={stats.err} tone="error" />
              <StatCard label="Duplicados" value={stats.dup} tone="warning" />
            </div>
            {stats.dup > 0 && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="mb-2 text-sm font-semibold">
                  Como tratar os {stats.dup} CÓDIGO(S) já existente(s) no catálogo?
                </p>
                <RadioGroup
                  value={duplicateMode}
                  onValueChange={(v) => setDuplicateMode(v as DuplicateMode)}
                  className="grid gap-2 sm:grid-cols-3"
                >
                  <label
                    htmlFor="dup-block"
                    className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm transition-colors ${
                      duplicateMode === "block" ? "border-primary bg-accent" : "hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem id="dup-block" value="block" className="mt-0.5" />
                    <div>
                      <div className="font-semibold">Bloquear</div>
                      <p className="text-xs text-muted-foreground">
                        Marca como erro e não importa nenhum duplicado.
                      </p>
                    </div>
                  </label>
                  <label
                    htmlFor="dup-skip"
                    className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm transition-colors ${
                      duplicateMode === "skip" ? "border-primary bg-accent" : "hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem id="dup-skip" value="skip" className="mt-0.5" />
                    <div>
                      <div className="font-semibold">Pular</div>
                      <p className="text-xs text-muted-foreground">
                        Mantém o produto existente como está e ignora a linha.
                      </p>
                    </div>
                  </label>
                  <label
                    htmlFor="dup-update"
                    className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm transition-colors ${
                      duplicateMode === "update" ? "border-primary bg-accent" : "hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem id="dup-update" value="update" className="mt-0.5" />
                    <div>
                      <div className="font-semibold">Atualizar</div>
                      <p className="text-xs text-muted-foreground">
                        Sobrescreve os dados do produto existente com os do arquivo.
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
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
                  {effectivePreview.map((r) => (
                    <tr key={r.rowNum}
                      className={
                        r.status === "error" ? "bg-destructive/5"
                        : r.status === "warning" ? "bg-amber-500/5" : ""
                      }>
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
                      <td className="px-2 py-1.5 max-w-[260px] truncate" title={r.name}>{r.name || "—"}</td>
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

        <DialogFooter className="mt-4 shrink-0">
          {step === "mapping" && (
            <Button type="button" variant="outline" onClick={reset}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Trocar arquivo
            </Button>
          )}
          {step === "preview" && (
            <Button type="button" variant="outline" onClick={() => setStep("mapping")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao mapeamento
            </Button>
          )}
          {step !== "importing" && (
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          )}
          {step === "mapping" && (
            <Button
              type="button"
              onClick={buildPreview}
              disabled={!canProceedMapping || analyzing}
            >
              {analyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar mapeamento <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {step === "preview" && (
            <Button type="button" onClick={handleImport} disabled={!toImport.length}>
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
}: { label: string; value: number; tone?: "success" | "warning" | "error" }) {
  const color =
    tone === "success" ? "text-green-600"
    : tone === "warning" ? "text-amber-600"
    : tone === "error" ? "text-destructive" : "text-foreground";
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
