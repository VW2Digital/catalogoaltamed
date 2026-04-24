/**
 * Client-side image optimization using <canvas>.
 *
 * Generates resized variants of an uploaded image without sending it
 * through a backend service. Used to create an optimized logo + thumbnail
 * for the branding settings.
 *
 * SVG is left untouched (already vector / tiny). Raster formats are
 * downscaled to fit within the requested box and re-encoded as WebP
 * (with JPEG fallback) for smaller payloads.
 */

export type OptimizedImage = {
  blob: Blob;
  width: number;
  height: number;
  ext: string;
  mime: string;
};

type ResizeOptions = {
  /** Max width OR height of the longer side, in pixels. */
  maxSize: number;
  /** WebP/JPEG quality between 0 and 1. */
  quality?: number;
  /** Preferred output format. Defaults to "webp". */
  format?: "webp" | "jpeg" | "png";
};

const DEFAULT_QUALITY = 0.9;

/** Decode any browser-supported image (incl. SVG) into an HTMLImageElement. */
function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível decodificar a imagem."));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Falha ao gerar imagem."))),
      mime,
      quality
    );
  });
}

function pickOutput(format: ResizeOptions["format"]): { mime: string; ext: string } {
  switch (format) {
    case "jpeg":
      return { mime: "image/jpeg", ext: "jpg" };
    case "png":
      return { mime: "image/png", ext: "png" };
    case "webp":
    default:
      return { mime: "image/webp", ext: "webp" };
  }
}

/**
 * Resize an image to fit within a maxSize box, preserving aspect ratio
 * and never upscaling. Re-encodes to the requested format.
 */
export async function resizeImage(
  file: File,
  { maxSize, quality = DEFAULT_QUALITY, format = "webp" }: ResizeOptions
): Promise<OptimizedImage> {
  const img = await loadImage(file);

  const ratio = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
  const targetW = Math.max(1, Math.round(img.naturalWidth * ratio));
  const targetH = Math.max(1, Math.round(img.naturalHeight * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível neste navegador.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const { mime, ext } = pickOutput(format);
  const blob = await canvasToBlob(canvas, mime, quality);
  return { blob, width: targetW, height: targetH, ext, mime };
}

/**
 * Build the standard logo variants used by the app:
 *  - "main": optimized version for headers/cards (max 512px)
 *  - "thumb": small square-ish thumbnail for menus/favicons (max 128px)
 *
 * For SVG files we skip canvas processing and reuse the original blob,
 * since rasterizing would lose quality.
 */
export async function buildLogoVariants(
  file: File,
  detectedType: "png" | "jpeg" | "gif" | "webp" | "svg"
): Promise<{ main: OptimizedImage; thumb: OptimizedImage }> {
  if (detectedType === "svg") {
    const blob = file.slice(0, file.size, "image/svg+xml");
    const variant: OptimizedImage = {
      blob,
      width: 0,
      height: 0,
      ext: "svg",
      mime: "image/svg+xml",
    };
    return { main: variant, thumb: variant };
  }

  const main = await resizeImage(file, { maxSize: 512, quality: 0.9, format: "webp" });
  const thumb = await resizeImage(file, { maxSize: 128, quality: 0.85, format: "webp" });
  return { main, thumb };
}

/** Human-readable file size, e.g. "243 KB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}