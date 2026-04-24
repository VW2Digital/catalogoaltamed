/**
 * Validation + normalization helpers used across the settings pages.
 * Each validator returns a normalized value when valid, or an error string.
 */

export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

/** Keep digits only; require 10-15 digits (E.164-ish, country code + number). */
export function validateWhatsApp(input: string): ValidationResult {
  const digits = input.replace(/\D/g, "");
  if (!digits) return { ok: false, error: "Informe o número de WhatsApp." };
  if (digits.length < 10) return { ok: false, error: "Número muito curto. Inclua DDI e DDD." };
  if (digits.length > 15) return { ok: false, error: "Número muito longo (máx. 15 dígitos)." };
  return { ok: true, value: digits };
}

/** Trim + length checks for the store name. */
export function validateStoreName(input: string): ValidationResult {
  const value = input.trim();
  if (!value) return { ok: false, error: "Informe o nome da loja." };
  if (value.length < 2) return { ok: false, error: "Nome muito curto (mín. 2 caracteres)." };
  if (value.length > 60) return { ok: false, error: "Nome muito longo (máx. 60 caracteres)." };
  return { ok: true, value };
}

/** Optional description, capped at 160 chars (SEO). */
export function validateStoreDescription(input: string): ValidationResult {
  const value = input.trim();
  if (value.length > 160)
    return { ok: false, error: "Descrição muito longa (máx. 160 caracteres)." };
  return { ok: true, value };
}

/** Optional URL — must be http(s) when provided. */
export function validateUrl(input: string, { required = false } = {}): ValidationResult {
  const value = input.trim();
  if (!value) {
    if (required) return { ok: false, error: "Informe a URL." };
    return { ok: true, value: "" };
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { ok: false, error: "URL deve começar com http:// ou https://" };
    }
    return { ok: true, value: url.toString() };
  } catch {
    return { ok: false, error: "URL inválida." };
  }
}

/** Accept "H S% L%" with H 0-360, S/L 0-100. Normalizes spacing. */
export function validateHsl(input: string): ValidationResult {
  const value = input.trim().replace(/\s+/g, " ");
  const m = value.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) {
    return {
      ok: false,
      error: "Formato inválido. Use: matiz saturação% luminosidade% (ex.: 36 55% 50%).",
    };
  }
  const h = Number(m[1]);
  const s = Number(m[2]);
  const l = Number(m[3]);
  if (h < 0 || h > 360) return { ok: false, error: "Matiz deve estar entre 0 e 360." };
  if (s < 0 || s > 100) return { ok: false, error: "Saturação deve estar entre 0% e 100%." };
  if (l < 0 || l > 100) return { ok: false, error: "Luminosidade deve estar entre 0% e 100%." };
  return { ok: true, value: `${h} ${s}% ${l}%` };
}

/** Format BR phone number for display only: 55 11 91234-5678 */
export function formatWhatsAppDisplay(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length < 4) return d;
  // try Brazilian pattern
  if (d.length >= 12 && d.startsWith("55")) {
    const ddi = d.slice(0, 2);
    const ddd = d.slice(2, 4);
    const rest = d.slice(4);
    if (rest.length === 9) return `+${ddi} ${ddd} ${rest.slice(0, 5)}-${rest.slice(5)}`;
    if (rest.length === 8) return `+${ddi} ${ddd} ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }
  return `+${d}`;
}