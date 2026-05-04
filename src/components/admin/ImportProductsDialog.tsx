import { useRef, useState } from "react";
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
import { Loader2, Upload, FileText } from "lucide-react";
import { toast } from "sonner";

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

// Parse CSV respecting quoted values that may contain commas/newlines
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

function parseMoney(v: string): number | null {
  if (!v || !v.trim()) return null;
  const cleaned = v.replace(/R\$\s?/gi, "").replace(/\./g, "").replace(",", ".").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseNum(v: string): number | null {
  if (!v || !v.trim()) return null;
  const n = Number(v.replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, " ");

export default function ImportProductsDialog({
  open,
  onOpenChange,
  catalogId,
  onImported,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<string[][]>([]);
  const [headerIdx, setHeaderIdx] = useState<Record<string, number>>({});
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  function handleFile(file: File) {
    setFileName(file.name);
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
            header: 1,
            raw: false,
            defval: "",
          });
          parsed = arr.map((r) => r.map((v) => (v == null ? "" : String(v))));
        } else {
          const text = String(reader.result ?? "");
          parsed = parseCSV(text);
        }
      } catch (err: any) {
        toast.error(`Falha ao ler arquivo: ${err.message ?? err}`);
        return;
      }
      if (parsed.length < 2) {
        toast.error("Arquivo vazio ou inválido");
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
        return;
      }
      setHeaderIdx(idx);
      setRows(parsed.slice(1));
      toast.success(`${parsed.length - 1} linhas detectadas`);
    };
    if (isXlsx) reader.readAsArrayBuffer(file);
    else reader.readAsText(file, "utf-8");
  }

  async function handleImport() {
    if (!rows.length) return;
    setImporting(true);
    setProgress(0);
    const get = (row: string[], h: string) =>
      headerIdx[h] !== undefined ? (row[headerIdx[h]] ?? "").trim() : "";

    const payloads = rows
      .map((row) => {
        const code = get(row, "CÓDIGO");
        const name = get(row, "PRODUTO");
        if (!code || !name) return null;
        return {
          catalog_id: catalogId,
          code,
          name,
          descricao_ativo: get(row, "DESCRIÇÃO ATIVO") || null,
          lista: get(row, "LISTA") || null,
          category: get(row, "CLASSIFICAÇÃO") || null,
          unit: get(row, "UND") || "UND",
          qtd: parseNum(get(row, "QTD")),
          vlr_compra: parseMoney(get(row, "VLR. COMPRA")),
          custo_sem_antecip: parseMoney(get(row, "CUSTO S/ ANTECIP")),
          custo_com_antecip: parseMoney(get(row, "CUSTO C/ ANTECIP")),
          price: parseMoney(get(row, "VLR. VENDA")) ?? 0,
          fornecedor: get(row, "FORNECEDOR") || null,
          nota_fiscal: get(row, "NOTA FISCAL") || null,
          sugestao_cadastro: get(row, "SUGESTÃO DE CADASTRO") || null,
          brand: get(row, "MARCA") || null,
          vlr_mercado: parseMoney(get(row, "VLR MERCADO")),
          fornecedor_01: get(row, "FORNECEDOR 01") || null,
          is_visible: true,
        };
      })
      .filter(Boolean) as any[];

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
      if (failed > 0) {
        toast.warning(`${inserted} importados, ${failed} falharam`);
      } else {
        toast.success(`${inserted} produtos importados`);
      }
      onImported();
      onOpenChange(false);
      setRows([]);
      setFileName("");
    } catch (err: any) {
      toast.error(err.message ?? "Falha na importação");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Importar produtos (CSV ou XLSX)</DialogTitle>
          <DialogDescription>
            Envie a planilha base (.csv ou .xlsx). Colunas reconhecidas: CÓDIGO, PRODUTO, DESCRIÇÃO ATIVO, LISTA,
            CLASSIFICAÇÃO, UND, QTD, VLR. COMPRA, CUSTO S/ ANTECIP, CUSTO C/ ANTECIP, VLR. VENDA,
            FORNECEDOR, NOTA FISCAL, SUGESTÃO DE CADASTRO, MARCA, VLR MERCADO, FORNECEDOR 01.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 p-8 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-accent-foreground"
          >
            {fileName ? (
              <>
                <FileText className="h-6 w-6" />
                <span className="font-medium text-foreground">{fileName}</span>
                <span className="text-xs">{rows.length} linhas detectadas — clique para trocar</span>
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

          {importing && (
            <div className="space-y-2">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-center text-xs text-muted-foreground">{progress}% importado…</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Dica: salve sua planilha como CSV (UTF-8) antes de importar. Linhas sem CÓDIGO ou PRODUTO são ignoradas.
            Não há detecção de duplicados — se reimportar, os produtos serão criados novamente.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleImport} disabled={!rows.length || importing}>
            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Importar {rows.length > 0 ? `(${rows.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
