import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BarChart3, FolderOpen, Package, Tag } from "lucide-react";

type Stats = {
  catalogs: number;
  products: number;
  categories: number;
};

export default function Reports() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const [c, p, cat] = await Promise.all([
        supabase.from("catalogs").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("*", { count: "exact", head: true }),
      ]);
      setStats({
        catalogs: c.count ?? 0,
        products: p.count ?? 0,
        categories: cat.count ?? 0,
      });
    })();
  }, []);

  if (!stats) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cards = [
    { label: "Catálogos", value: stats.catalogs, icon: FolderOpen },
    { label: "Produtos", value: stats.products, icon: Package },
    { label: "Categorias", value: stats.categories, icon: Tag },
  ];

  return (
    <section>
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Visão geral do conteúdo cadastrado.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border bg-card p-6 shadow-card"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{c.label}</span>
              <c.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-4xl font-bold tracking-tight">{c.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}