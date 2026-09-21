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

export type CartLineItem = {
  code: string;
  name: string;
  quantity: number;
  price?: number;
};

export function buildCartWhatsAppLink(
  phone: string | null | undefined,
  items: CartLineItem[],
): string | null {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits || items.length === 0) return null;
  const lines = items.map(
    (i, idx) =>
      `${idx + 1}. ${i.name} (Cód. ${i.code}) — Qtd: ${i.quantity}`,
  );
  const total = items.reduce(
    (sum, i) => sum + (Number(i.price) || 0) * i.quantity,
    0,
  );
  let message = `Olá! Gostaria de fazer um pedido com os itens abaixo:\n\n${lines.join("\n")}`;
  if (total > 0) {
    message += `\n\nTotal estimado: ${new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(total)}`;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}