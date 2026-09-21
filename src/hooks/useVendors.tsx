import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Vendor = {
  id: string;
  name: string;
  phone: string;
  avatar_url: string | null;
  role_title: string | null;
  is_active: boolean;
  sort_order: number;
};

export function useVendors(onlyActive = true) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    let query = supabase
      .from("vendors")
      .select("id, name, phone, avatar_url, role_title, is_active, sort_order")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (onlyActive) query = query.eq("is_active", true);
    const { data } = await query;
    setVendors((data as Vendor[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyActive]);

  return { vendors, loading, reload: load };
}
