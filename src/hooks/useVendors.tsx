import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Vendor = {
  id: string;
  name: string;
  phone?: string | null;
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
    // Public listing never exposes phone numbers; admins read the full table.
    const query = onlyActive
      ? supabase
          .from("vendors_public")
          .select("id, name, avatar_url, role_title, is_active, sort_order")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true })
      : supabase
          .from("vendors")
          .select("id, name, phone, avatar_url, role_title, is_active, sort_order")
          .order("sort_order", { ascending: true })
          .order("name", { ascending: true });

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

export async function fetchVendorPhone(vendorId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_vendor_phone", { _vendor_id: vendorId });
  if (error) return null;
  return (data as string | null) ?? null;
}
