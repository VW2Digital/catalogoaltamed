export function groupByCategory<T extends { category?: string | null }>(
  items: T[],
  fallback = "Sem categoria",
): Array<{ category: string; items: T[] }> {
  const map = new Map<string, T[]>();
  const order: string[] = [];
  for (const item of items) {
    const key = (item.category?.trim() || fallback) as string;
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(item);
  }
  return order.map((category) => ({ category, items: map.get(category)! }));
}