/**
 * Validates image files by inspecting their actual binary signature
 * ("magic bytes") instead of trusting only the MIME type, which can
 * be spoofed by renaming the file extension.
 *
 * Supported formats: PNG, JPEG, GIF, WebP, SVG.
 */

export type DetectedImageType = "png" | "jpeg" | "gif" | "webp" | "svg" | null;

const TEXT_DECODER = new TextDecoder("utf-8", { fatal: false });

/** Read the first N bytes from a File without loading it entirely. */
async function readHead(file: File, byteCount: number): Promise<Uint8Array> {
  const slice = file.slice(0, Math.min(byteCount, file.size));
  const buffer = await slice.arrayBuffer();
  return new Uint8Array(buffer);
}

/** Compare a Uint8Array prefix against an expected sequence of bytes. */
function startsWith(bytes: Uint8Array, prefix: number[], offset = 0): boolean {
  if (bytes.length < offset + prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (bytes[offset + i] !== prefix[i]) return false;
  }
  return true;
}

/** Detect the image type from the first bytes of the file. */
export async function detectImageType(file: File): Promise<DetectedImageType> {
  // 16 bytes is enough for every signature we care about.
  const head = await readHead(file, 32);

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "png";
  }
  // JPEG: FF D8 FF
  if (startsWith(head, [0xff, 0xd8, 0xff])) {
    return "jpeg";
  }
  // GIF: "GIF87a" or "GIF89a"
  if (
    startsWith(head, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    startsWith(head, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return "gif";
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    startsWith(head, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(head, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return "webp";
  }
  // SVG: text-based; allow optional UTF-8 BOM and leading whitespace/<?xml ...>
  // Reject if the head contains binary control bytes that wouldn't appear in XML.
  const looksTextual = head.every(
    (b) => b === 0x09 || b === 0x0a || b === 0x0d || (b >= 0x20 && b <= 0x7e) || b >= 0x80
  );
  if (looksTextual) {
    const text = TEXT_DECODER.decode(head).replace(/^\uFEFF/, "").trimStart().toLowerCase();
    if (text.startsWith("<?xml") || text.startsWith("<svg")) {
      // For SVG specifically, peek a bit further to make sure <svg appears.
      // Keep bounded to avoid reading huge files just for validation.
      return text.includes("<svg") ? "svg" : null;
    }
  }

  return null;
}

const MIME_BY_TYPE: Record<NonNullable<DetectedImageType>, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

const EXT_BY_TYPE: Record<NonNullable<DetectedImageType>, string> = {
  png: "png",
  jpeg: "jpg",
  gif: "gif",
  webp: "webp",
  svg: "svg",
};

export type ImageValidationResult = {
  ok: boolean;
  type?: NonNullable<DetectedImageType>;
  mime?: string;
  ext?: string;
  error?: string;
};

export type ValidateImageOptions = {
  /** Allowed detected types. Defaults to all supported formats. */
  allowed?: NonNullable<DetectedImageType>[];
  /** Max file size in bytes. Defaults to 5 MB. */
  maxBytes?: number;
};

const DEFAULT_ALLOWED: NonNullable<DetectedImageType>[] = [
  "png",
  "jpeg",
  "gif",
  "webp",
  "svg",
];

/**
 * Validate an image file by its actual binary content.
 * Rejects spoofed extensions (e.g. a `.png` that is actually a PDF or HTML).
 */
export async function validateImageFile(
  file: File,
  options: ValidateImageOptions = {}
): Promise<ImageValidationResult> {
  const { allowed = DEFAULT_ALLOWED, maxBytes = 5 * 1024 * 1024 } = options;

  if (file.size === 0) {
    return { ok: false, error: "Arquivo vazio." };
  }
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `A imagem deve ter no máximo ${mb}MB.` };
  }

  const detected = await detectImageType(file);
  if (!detected) {
    return {
      ok: false,
      error:
        "Formato não reconhecido. Envie um arquivo PNG, JPG, GIF, WebP ou SVG válido.",
    };
  }
  if (!allowed.includes(detected)) {
    return {
      ok: false,
      error: `Formato ${detected.toUpperCase()} não é permitido aqui.`,
    };
  }

  // Optional sanity check: warn-style mismatch between declared MIME and actual content
  // is treated as a hard rejection — this is exactly the spoofing case we want to catch.
  if (file.type && file.type !== MIME_BY_TYPE[detected]) {
    // Tolerate generic/empty types (some browsers omit MIME for SVG/drag-drops).
    const generic = file.type === "application/octet-stream";
    if (!generic) {
      return {
        ok: false,
        error: `O conteúdo do arquivo não corresponde ao tipo declarado (${file.type}).`,
      };
    }
  }

  return {
    ok: true,
    type: detected,
    mime: MIME_BY_TYPE[detected],
    ext: EXT_BY_TYPE[detected],
  };
}