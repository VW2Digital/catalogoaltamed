import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatBRL } from "@/lib/format";
import pdfHeaderAsset from "@/assets/pdf-header.png.asset.json";

export type ExportProduct = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  brand: string | null;
  unit: string;
  price: number | string;
  qtd?: number | null;
  image_url: string | null;
};

export type ExportGroup = { category: string; items: ExportProduct[] };

async function loadImage(url: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const data = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = reject;
      img.src = data;
    });
    return { data, ...dims };
  } catch {
    return null;
  }
}

function priceText(price: number | string) {
  return Number(price) > 0 ? formatBRL(price) : "-";
}

function unitPriceText(price: number | string, qtd?: number | null) {
  const total = Number(price);
  const q = Number(qtd);
  if (!(total > 0) || !(q > 0)) return "-";
  return formatBRL(total / q);
}

const BRAND: [number, number, number] = [166, 106, 46];
const BRAND_DARK: [number, number, number] = [92, 56, 22];
const BRAND_LIGHT: [number, number, number] = [250, 243, 233];
const BORDER: [number, number, number] = [223, 186, 145];

/**
 * Draws the AltaMed banner (logo + commercial info) on the FIRST page only.
 * Returns the Y position right below the header.
 */
async function coverHeader(doc: jsPDF, title: string, subtitle?: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const img = await loadImage(pdfHeaderAsset.url);
  let y = 0;
  if (img) {
    const h = (pageW * img.h) / img.w;
    try {
      doc.addImage(img.data, 0, 0, pageW, h);
      y = h;
    } catch {
      y = 0;
    }
  }
  if (!y) {
    doc.setFillColor(...BRAND_LIGHT);
    doc.rect(0, 0, pageW, 70, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...BRAND_DARK);
    doc.text(title.toUpperCase(), 40, 42);
    doc.setTextColor(0);
    y = 70;
  }
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(150, 120, 90);
    doc.text(subtitle, pageW - 40, y + 14, { align: "right" });
    doc.setTextColor(0);
    y += 18;
  }
  return y + 10;
}

function categoryPill(doc: jsPDF, label: string, y: number) {
  const pageW = doc.internal.pageSize.getWidth();
  const text = label.toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  const w = Math.max(180, doc.getTextWidth(text) + 60);
  const h = 26;
  const x = (pageW - w) / 2;
  doc.setFillColor(...BRAND);
  doc.roundedRect(x, y, w, h, 8, 8, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(text, pageW / 2, y + h / 2, { align: "center", baseline: "middle" });
  doc.setTextColor(0);
  return y + h;
}

function footer(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(140);
    doc.text(
      `Página ${i} de ${pages}`,
      doc.internal.pageSize.getWidth() - 40,
      doc.internal.pageSize.getHeight() - 20,
      { align: "right" },
    );
    doc.setTextColor(0);
  }
}

export async function exportCatalogTablePdf(
  groups: ExportGroup[],
  opts: { catalogName: string; fileName: string },
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let startY = await coverHeader(doc, opts.catalogName, new Date().toLocaleDateString("pt-BR"));

  groups.forEach((g) => {
    const pageH = doc.internal.pageSize.getHeight();
    if (startY + 90 > pageH - 50) {
      doc.addPage();
      startY = 60;
    }
    const afterPill = categoryPill(doc, g.category, startY);

    autoTable(doc, {
      startY: afterPill - 6,
      head: [["CÓD.", "PRODUTOS", "MARCA", "UND", "VLR. CAIXA", "VLR. UNIT."]],
      body: g.items.map((p) => [
        p.code,
        p.name.toUpperCase(),
        (p.brand ?? "-").toUpperCase(),
        p.unit.toUpperCase(),
        priceText(p.price),
        unitPriceText(p.price, p.qtd),
      ]),
      theme: "grid",
      styles: {
        fontSize: 8,
        cellPadding: 5,
        lineColor: BORDER,
        lineWidth: 0.6,
        textColor: [40, 30, 20],
        valign: "middle",
      },
      headStyles: {
        fillColor: BRAND_LIGHT,
        textColor: BRAND_DARK,
        fontStyle: "bold",
        fontSize: 10,
        halign: "center",
        lineColor: BORDER,
        lineWidth: 0.6,
      },
      alternateRowStyles: { fillColor: [253, 250, 246] },
      columnStyles: {
        0: { halign: "center", cellWidth: 46, fontSize: 7 },
        1: { fontStyle: "bold" },
        2: { halign: "center", cellWidth: 75, fontStyle: "bold" },
        3: { halign: "center", cellWidth: 45, fontStyle: "bold" },
        4: { halign: "center", cellWidth: 72, fontStyle: "bold" },
        5: { halign: "center", cellWidth: 72, fontStyle: "bold" },
      },
      margin: { left: 40, right: 40, top: 60 },
    });
    // @ts-expect-error autotable augments doc
    startY = doc.lastAutoTable.finalY + 26;
  });

  footer(doc);
  doc.save(opts.fileName);
}

export async function exportCatalogGridPdf(
  groups: ExportGroup[],
  opts: { catalogName: string; fileName: string },
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const cols = 3;
  const gap = 14;
  const cardW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
  const imgH = cardW * 0.75;
  const cardH = imgH + 62;

  let y = await coverHeader(doc, opts.catalogName, new Date().toLocaleDateString("pt-BR"));

  const all = groups.flatMap((g) => g.items);
  const images = new Map<string, { data: string; w: number; h: number } | null>();
  await Promise.all(
    all.map(async (p) => {
      if (p.image_url && !images.has(p.image_url)) {
        images.set(p.image_url, await loadImage(p.image_url));
      }
    }),
  );

  for (const g of groups) {
    if (y + 30 + cardH > pageH - margin) {
      doc.addPage();
      y = margin;
    }
    y = categoryPill(doc, g.category, y) + 12;

    for (let i = 0; i < g.items.length; i += cols) {
      if (y + cardH > pageH - margin) {
        doc.addPage();
        y = margin;
      }
      const row = g.items.slice(i, i + cols);
      row.forEach((p, idx) => {
        const x = margin + idx * (cardW + gap);
        doc.setDrawColor(...BORDER);
        doc.setFillColor(255, 253, 250);
        doc.roundedRect(x, y, cardW, cardH, 6, 6, "FD");

        const img = p.image_url ? images.get(p.image_url) : null;
        if (img) {
          const ratio = Math.min(cardW / img.w, imgH / img.h);
          const w = img.w * ratio * 0.92;
          const h = img.h * ratio * 0.92;
          try {
            doc.addImage(img.data, x + (cardW - w) / 2, y + (imgH - h) / 2 + 4, w, h);
          } catch {
            /* ignore */
          }
        }

        let ty = y + imgH + 16;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        const nameLines = doc.splitTextToSize(p.name, cardW - 16).slice(0, 2);
        doc.text(nameLines, x + 8, ty);
        ty += nameLines.length * 10;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(150, 120, 90);
        doc.text(`${p.code}${p.brand ? " · " + p.brand : ""} · ${p.unit}`, x + 8, ty);
        doc.setTextColor(...BRAND_DARK);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(priceText(p.price), x + 8, ty + 14);
        doc.setTextColor(0);
      });
      y += cardH + gap;
    }
    y += 4;
  }

  footer(doc);
  doc.save(opts.fileName);
}
