export function buildWhatsAppLink(
  phone: string,
  productName: string,
  imageUrl?: string | null,
): string | null {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  let message = `Olá! Quero saber mais sobre o produto: ${productName}`;
  if (imageUrl) {
    message += `\n\nImagem: ${imageUrl}`;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}