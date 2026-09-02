import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatBRL, resolveUnitPrice } from "@/lib/format";
import pdfBgPage1Url from "@/assets/FUNDO-PAG-01.png";
import pdfBgPage2Url from "@/assets/FUNDO-PAG-02.png";

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
const TABLE_MARGIN_X = 16;
const SECTION_GAP = 4;
const SECTION_RADIUS = 4;
const TITLE_H = 11;

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

function drawSectionTitleBar(
  doc: jsPDF,
  label: string,
  y: number,
  x = TABLE_MARGIN_X,
  w = tableWidth(doc),
) {
  const r = SECTION_RADIUS;
  doc.saveGraphicsState();
  doc.roundedRect(x, y, w, TITLE_H + r, r, r, null);
  doc.clip();
  doc.discardPath();
  fillGoldGradient(doc, x, y, w, TITLE_H + 0.5);
  doc.restoreGraphicsState();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
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
  x = TABLE_MARGIN_X,
  w = tableWidth(doc),
) {
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

const PAGE1_CONTENT_TOP = 132;
const PAGE2_CONTENT_TOP = 36;
const PAGE1_CONTENT_BOTTOM = 48;
const PAGE2_CONTENT_BOTTOM = 112;

function imageFormat(data: string) {
  return data.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
}

function drawFullPageBackground(
  doc: jsPDF,
  img: { data: string; w: number; h: number } | null,
  alias: string,
) {
  if (!img) return;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  try {
    doc.addImage(img.data, imageFormat(img.data), 0, 0, pageW, pageH, alias, "NONE");
  } catch {
    /* ignore */
  }
}

function contentTop(page: number) {
  return page <= 1 ? PAGE1_CONTENT_TOP : PAGE2_CONTENT_TOP;
}

function contentBottomPad(page: number) {
  return page <= 1 ? PAGE1_CONTENT_BOTTOM : PAGE2_CONTENT_BOTTOM;
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

export async function exportCatalogTablePdf(
  groups: ExportGroup[],
  opts: { catalogName: string; fileName: string },
) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const colW = (pageW - TABLE_MARGIN_X * 2 - SECTION_GAP) / 2;
  const colX = [TABLE_MARGIN_X, TABLE_MARGIN_X + colW + SECTION_GAP];
  const colCode = 24;
  const colBrand = 38;
  const colUnit = 28;
  const colPrice = 36;
  const fixedCols = colCode + colBrand + colUnit + colPrice + colPrice;
  const estimateHeight = (count: number) => TITLE_H + 10 + count * 12.2 + 4;

  const [bg1, bg2] = await Promise.all([
    loadImage(pdfBgPage1Url),
    loadImage(pdfBgPage2Url),
  ]);
  drawFullPageBackground(doc, bg1, "pdf-bg-1");

  const pageNo = () => doc.getNumberOfPages();
  let colY = [contentTop(1), contentTop(1)];

  const pageBottom = () => pageH - contentBottomPad(pageNo());
  const remaining = (col: number) => pageBottom() - colY[col];

  const newPage = () => {
    doc.addPage();
    const p = pageNo();
    drawFullPageBackground(doc, p === 1 ? bg1 : bg2, p === 1 ? "pdf-bg-1" : "pdf-bg-2");
    const top = contentTop(p);
    colY = [top, top];
  };

  const pickColumn = (estH: number) => {
    const shorter = colY[0] <= colY[1] ? 0 : 1;
    const other = 1 - shorter;
    if (remaining(shorter) >= estH) return shorter;
    if (remaining(other) >= estH) return other;
    return -1;
  };

  const drawGroup = (g: ExportGroup, col: number) => {
    const x = colX[col];
    const y = colY[col];
    const prodW = Math.max(48, colW - fixedCols);
    drawSectionTitleBar(doc, g.category, y, x, colW);

    autoTable(doc, {
      startY: y + TITLE_H,
      tableWidth: colW,
      pageBreak: "avoid",
      showHead: "everyPage",
      head: [["CÓD.", "PRODUTOS", "MARCA", "UND", "VLR. CX", "VLR. UN"]],
      body: g.items.map((p) => [
        p.code,
        p.name.toUpperCase(),
        (p.brand ?? "-").toUpperCase(),
        (p.unit || "-").toUpperCase(),
        p.price_visible === false ? "Consulta" : priceText(p.price),
        p.price_visible === false ? "-" : unitPriceText(p.price, p.qtd, p.preco_unitario),
      ]),
      theme: "grid",
      styles: {
        fontSize: 5,
        cellPadding: { top: 1.8, bottom: 1.8, left: 1.2, right: 1.2 },
        lineColor: BORDER,
        lineWidth: 0.3,
        textColor: [40, 30, 20],
        valign: "middle",
        minCellHeight: 12,
        overflow: "ellipsize",
      },
      headStyles: {
        fillColor: BRAND_LIGHT,
        textColor: BRAND_DARK,
        fontStyle: "bold",
        fontSize: 5,
        cellPadding: { top: 1.8, bottom: 1.8, left: 1.2, right: 1.2 },
        halign: "center",
        lineColor: BORDER,
        lineWidth: 0.3,
        minCellHeight: 10,
      },
      alternateRowStyles: { fillColor: [253, 250, 246] },
      columnStyles: {
        0: { halign: "center", cellWidth: colCode, fontSize: 4.5 },
        1: { fontStyle: "bold", cellWidth: prodW, overflow: "ellipsize" },
        2: { halign: "center", cellWidth: colBrand, fontStyle: "bold", fontSize: 4.5 },
        3: {
          halign: "center",
          valign: "middle",
          cellWidth: colUnit,
          fontStyle: "bold",
          fontSize: 4.5,
          overflow: "ellipsize",
        },
        4: { halign: "center", cellWidth: colPrice, fontStyle: "bold", fontSize: 4.5 },
        5: { halign: "center", cellWidth: colPrice, fontStyle: "bold", fontSize: 4.5 },
      },
      margin: {
        left: x,
        right: pageW - x - colW,
        top: contentTop(pageNo()),
        bottom: contentBottomPad(pageNo()),
      },
    });

    // @ts-expect-error autotable augments doc
    const finalY = doc.lastAutoTable.finalY as number;
    const h = Math.max(finalY - y, TITLE_H);
    strokeSectionOutline(doc, y, h, true, true, x, colW);
    drawSectionTitleBar(doc, g.category, y, x, colW);
    colY[col] = finalY + SECTION_GAP;
  };

  groups.forEach((g) => {
    const estH = estimateHeight(g.items.length);
    let col = pickColumn(estH);
    if (col < 0) {
      newPage();
      col = 0;
    }
    drawGroup(g, col);
  });

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

  const [bg1, bg2] = await Promise.all([
    loadImage(pdfBgPage1Url),
    loadImage(pdfBgPage2Url),
  ]);
  drawFullPageBackground(doc, bg1, "pdf-bg-1");
  let y = contentTop(1);

  const all = groups.flatMap((g) => g.items);
  const images = new Map<string, { data: string; w: number; h: number } | null>();
  await Promise.all(
    all.map(async (p) => {
      if (p.image_url && !images.has(p.image_url)) {
        images.set(p.image_url, await loadImage(p.image_url));
      }
    }),
  );

  const goToNextPage = () => {
    doc.addPage();
    const p = doc.getNumberOfPages();
    drawFullPageBackground(doc, p === 1 ? bg1 : bg2, p === 1 ? "pdf-bg-1" : "pdf-bg-2");
    y = contentTop(p);
  };

  for (const g of groups) {
    const bottom = pageH - contentBottomPad(doc.getNumberOfPages());
    if (y + 30 + cardH > bottom) {
      goToNextPage();
    }
    y = categoryPill(doc, g.category, y) + 5;

    for (let i = 0; i < g.items.length; i += cols) {
      const pageBottom = pageH - contentBottomPad(doc.getNumberOfPages());
      if (y + cardH > pageBottom) {
        goToNextPage();
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

  doc.save(opts.fileName);
}
