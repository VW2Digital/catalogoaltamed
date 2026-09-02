import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatBRL, resolveUnitPrice } from "@/lib/format";
import pdfHeaderUrl from "@/assets/pdf-header.jpg";

export type ExportProduct = {
  id: string;
  code: string;
  name: string;
  category: string | null;
  brand: string | null;
  unit: string;
  price: number | string;
  qtd?: number | null;
  preco_unitario?: number | string | null;
  image_url: string | null;
  price_visible?: boolean | null;
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

function unitPriceText(
  price: number | string,
  qtd?: number | null,
  precoUnitario?: number | string | null,
) {
  const value = resolveUnitPrice(price, qtd, precoUnitario);
  return value == null ? "-" : formatBRL(value);
}

const BRAND_DARK: [number, number, number] = [142, 86, 20];
const BRAND_LIGHT: [number, number, number] = [250, 243, 233];
const BORDER: [number, number, number] = [212, 186, 123];
const TABLE_MARGIN_X = 28;
const SECTION_RADIUS = 6;
const TITLE_H = 18;

const GOLD_STOPS: { t: number; rgb: [number, number, number] }[] = [
  { t: 0, rgb: [0xc6, 0x8c, 0x39] },
  { t: 0.5, rgb: [0xd4, 0xba, 0x7b] },
  { t: 1, rgb: [0x8e, 0x56, 0x14] },
];

function goldAt(t: number): [number, number, number] {
  const x = Math.min(1, Math.max(0, t));
  let i = 0;
  while (i < GOLD_STOPS.length - 2 && x > GOLD_STOPS[i + 1].t) i++;
  const a = GOLD_STOPS[i];
  const b = GOLD_STOPS[i + 1];
  const u = (x - a.t) / (b.t - a.t || 1);
  return [
    Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * u),
    Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * u),
    Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * u),
  ];
}

function fillGoldGradient(doc: jsPDF, x: number, y: number, w: number, h: number) {
  const steps = Math.max(48, Math.ceil(w));
  const slice = w / steps;
  for (let i = 0; i < steps; i++) {
    doc.setFillColor(...goldAt(i / (steps - 1)));
    doc.rect(x + i * slice, y, slice + 0.4, h, "F");
  }
}

function fillGoldRounded(doc: jsPDF, x: number, y: number, w: number, h: number, r: number) {
  doc.saveGraphicsState();
  doc.roundedRect(x, y, w, h, r, r, null);
  doc.clip();
  doc.discardPath();
  fillGoldGradient(doc, x - 0.5, y - 0.5, w + 1, h + 1);
  doc.restoreGraphicsState();
}

function tableWidth(doc: jsPDF) {
  return doc.internal.pageSize.getWidth() - TABLE_MARGIN_X * 2;
}

function drawSectionTitleBar(doc: jsPDF, label: string, y: number) {
  const x = TABLE_MARGIN_X;
  const w = tableWidth(doc);
  const r = SECTION_RADIUS;
  doc.saveGraphicsState();
  doc.roundedRect(x, y, w, TITLE_H + r, r, r, null);
  doc.clip();
  doc.discardPath();
  fillGoldGradient(doc, x, y, w, TITLE_H + 0.5);
  doc.restoreGraphicsState();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(label.toUpperCase(), x + w / 2, y + TITLE_H / 2, {
    align: "center",
    baseline: "middle",
  });
  doc.setTextColor(0);
  return y + TITLE_H;
}

function strokeSectionOutline(
  doc: jsPDF,
  y: number,
  h: number,
  roundTop: boolean,
  roundBottom: boolean,
) {
  const x = TABLE_MARGIN_X;
  const w = tableWidth(doc);
  const r = SECTION_RADIUS;
  const k = 0.5522847498;
  const rt = roundTop ? Math.min(r, w / 2, h / 2) : 0;
  const rb = roundBottom ? Math.min(r, w / 2, h / 2) : 0;
  const kt = rt * k;
  const kb = rb * k;

  doc.setFillColor(255, 255, 255);
  if (rt) {
    doc.rect(x - 1.2, y - 1.2, rt + 1.2, rt + 1.2, "F");
    doc.rect(x + w - rt, y - 1.2, rt + 1.2, rt + 1.2, "F");
  }
  if (rb) {
    doc.rect(x - 1.2, y + h - rb, rb + 1.2, rb + 1.2, "F");
    doc.rect(x + w - rb, y + h - rb, rb + 1.2, rb + 1.2, "F");
  }

  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.7);
  doc.moveTo(x + rt, y);
  doc.lineTo(x + w - rt, y);
  if (rt) doc.curveTo(x + w - rt + kt, y, x + w, y + rt - kt, x + w, y + rt);
  else doc.lineTo(x + w, y);
  doc.lineTo(x + w, y + h - rb);
  if (rb) doc.curveTo(x + w, y + h - rb + kb, x + w - rb + kb, y + h, x + w - rb, y + h);
  else doc.lineTo(x + w, y + h);
  doc.lineTo(x + rb, y + h);
  if (rb) doc.curveTo(x + rb - kb, y + h, x, y + h - rb + kb, x, y + h - rb);
  else doc.lineTo(x, y + h);
  doc.lineTo(x, y + rt);
  if (rt) doc.curveTo(x, y + rt - kt, x + rt - kt, y, x + rt, y);
  else doc.lineTo(x, y);
  doc.close();
  doc.stroke();
}

/**
 * Draws the AltaMed banner (logo + commercial info) on the FIRST page only.
 * Returns the Y position right below the header.
 */
async function coverHeader(doc: jsPDF) {
  const pageW = doc.internal.pageSize.getWidth();
  const img = await loadImage(pdfHeaderUrl);
  let y = 0;
  if (img) {
    const h = (pageW * img.h) / img.w;
    const format = img.data.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
    try {
      doc.addImage(img.data, format, 0, 0, pageW, h);
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
    doc.text("TABELA DE PREÇOS", 40, 42);
    doc.setTextColor(0);
    y = 70;
  }
  return y + 6;
}

function categoryPill(doc: jsPDF, label: string, y: number) {
  const pageW = doc.internal.pageSize.getWidth();
  const text = label.toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const w = Math.max(140, doc.getTextWidth(text) + 36);
  const h = 16;
  const x = (pageW - w) / 2;
  fillGoldRounded(doc, x, y, w, h, 5);
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
    doc.setFontSize(7);
    doc.setTextColor(140);
    doc.text(
      `Página ${i} de ${pages}`,
      doc.internal.pageSize.getWidth() - 28,
      doc.internal.pageSize.getHeight() - 14,
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
  let startY = await coverHeader(doc);

  groups.forEach((g) => {
    const pageH = doc.internal.pageSize.getHeight();
    if (startY + 56 > pageH - 36) {
      doc.addPage();
      startY = 28;
    }
    const titleY = startY;
    drawSectionTitleBar(doc, g.category, titleY);

    type Frag = { page: number; top: number; bottom: number; first: boolean };
    const fragments: Frag[] = [];

    autoTable(doc, {
      startY: titleY + TITLE_H,
      head: [["CÓD.", "PRODUTOS", "MARCA", "UND", "VLR. CAIXA", "VLR. UNIT."]],
      body: g.items.map((p) => [
        p.code,
        p.name.toUpperCase(),
        (p.brand ?? "-").toUpperCase(),
        p.unit.toUpperCase(),
        p.price_visible === false ? "Sob consulta" : priceText(p.price),
        p.price_visible === false ? "-" : unitPriceText(p.price, p.qtd, p.preco_unitario),
      ]),
      theme: "grid",
      styles: {
        fontSize: 6.5,
        cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 },
        lineColor: BORDER,
        lineWidth: 0.4,
        textColor: [40, 30, 20],
        valign: "middle",
        minCellHeight: 10,
      },
      headStyles: {
        fillColor: BRAND_LIGHT,
        textColor: BRAND_DARK,
        fontStyle: "bold",
        fontSize: 7,
        cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
        halign: "center",
        lineColor: BORDER,
        lineWidth: 0.4,
      },
      alternateRowStyles: { fillColor: [253, 250, 246] },
      columnStyles: {
        0: { halign: "center", cellWidth: 42, fontSize: 6 },
        1: { fontStyle: "bold" },
        2: { halign: "center", cellWidth: 68, fontStyle: "bold" },
        3: { halign: "center", cellWidth: 32, fontStyle: "bold" },
        4: { halign: "center", cellWidth: 62, fontStyle: "bold" },
        5: { halign: "center", cellWidth: 62, fontStyle: "bold" },
      },
      margin: { left: TABLE_MARGIN_X, right: TABLE_MARGIN_X, top: 28, bottom: 22 },
      didDrawPage: (data) => {
        const first = data.pageNumber === 1;
        fragments.push({
          page: doc.getCurrentPageInfo().pageNumber,
          top: first ? titleY : data.settings.margin.top,
          bottom: data.cursor?.y ?? 0,
          first,
        });
      },
    });

    fragments.forEach((frag, i) => {
      doc.setPage(frag.page);
      const roundTop = i === 0;
      const roundBottom = i === fragments.length - 1;
      const h = Math.max(frag.bottom - frag.top, TITLE_H);
      strokeSectionOutline(doc, frag.top, h, roundTop, roundBottom);
      if (roundTop) drawSectionTitleBar(doc, g.category, frag.top);
    });

    doc.setPage(fragments[fragments.length - 1]?.page ?? doc.getNumberOfPages());
    // @ts-expect-error autotable augments doc
    startY = doc.lastAutoTable.finalY + 8;
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
  const margin = 28;
  const cols = 4;
  const gap = 8;
  const cardW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
  const imgH = cardW * 0.62;
  const cardH = imgH + 42;

  let y = await coverHeader(doc);

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
    y = categoryPill(doc, g.category, y) + 5;

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
        doc.roundedRect(x, y, cardW, cardH, 4, 4, "FD");

        const img = p.image_url ? images.get(p.image_url) : null;
        if (img) {
          const ratio = Math.min(cardW / img.w, imgH / img.h);
          const w = img.w * ratio * 0.92;
          const h = img.h * ratio * 0.92;
          try {
            doc.addImage(img.data, x + (cardW - w) / 2, y + (imgH - h) / 2 + 2, w, h);
          } catch {
            /* ignore */
          }
        }

        let ty = y + imgH + 10;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        const nameLines = doc.splitTextToSize(p.name, cardW - 10).slice(0, 2);
        doc.text(nameLines, x + 5, ty);
        ty += nameLines.length * 7.5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(5.5);
        doc.setTextColor(150, 120, 90);
        doc.text(`${p.code}${p.brand ? " · " + p.brand : ""} · ${p.unit}`, x + 5, ty);
        doc.setTextColor(...BRAND_DARK);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text(p.price_visible === false ? "Sob consulta" : priceText(p.price), x + 5, ty + 10);
        doc.setTextColor(0);
      });
      y += cardH + gap;
    }
    y += 2;
  }

  footer(doc);
  doc.save(opts.fileName);
}
