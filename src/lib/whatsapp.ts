export function buildWhatsAppLink(phone: string, productName: string): string | null {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  const message = `Olá! Quero saber mais sobre o produto: ${productName}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}