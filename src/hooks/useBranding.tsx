import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export type Branding = {
  storeName: string;
  logoUrl: string;
  logoThumbUrl: string;
};

const KEYS = ["store_name", "logo_url", "logo_thumb_url"] as const;

/**
 * Tailwind classes shared by every place that renders the store logo
 * (public header, admin sidebar, etc). Keeps height, width and spacing
 * consistent across the app.
 */
export const LOGO_IMG_CLASS = "h-10 w-auto max-w-[160px] object-contain";

/** Smaller variant used when a sidebar/menu is collapsed. */
export const LOGO_IMG_CLASS_COMPACT = "h-8 w-8 object-contain";

/**
 * Reads branding settings (store name + logo URLs) from the database.
 * Re-fetches whenever the route changes so updates from the branding
 * settings page are reflected immediately throughout the app.
 */
export function useBranding(): Branding {
  const location = useLocation();
  const [branding, setBranding] = useState<Branding>({
    storeName: "",
    logoUrl: "",
    logoThumbUrl: "",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", KEYS as unknown as string[]);
      if (cancelled) return;
      const map: Record<string, string> = {};
      data?.forEach((row) => {
        if (row.value) map[row.key] = row.value;
      });
      setBranding({
        storeName: map.store_name ?? "",
        logoUrl: map.logo_url ?? "",
        logoThumbUrl: map.logo_thumb_url ?? map.logo_url ?? "",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  return branding;
}