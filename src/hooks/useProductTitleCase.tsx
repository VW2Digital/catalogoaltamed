import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TitleCase = "none" | "uppercase" | "lowercase" | "capitalize";

export const TITLE_CASE_KEY = "product_title_case";

export function applyTitleCaseToDocument(value: TitleCase) {
  document.documentElement.dataset.productTitleCase = value;
}

/** Loads the saved product title case and applies it globally. */
export function useProductTitleCaseInjector() {
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", TITLE_CASE_KEY)
        .maybeSingle();
      if (!active) return;
      applyTitleCaseToDocument((data?.value as TitleCase) || "none");
    })();
    return () => {
      active = false;
    };
  }, []);
}

/** Read/write helper for the settings screen. */
export function useProductTitleCase() {
  const [value, setValue] = useState<TitleCase>("none");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", TITLE_CASE_KEY)
        .maybeSingle();
      if (!active) return;
      setValue((data?.value as TitleCase) || "none");
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function save(next: TitleCase) {
    const { error } = await supabase
      .from("settings")
      .upsert({ key: TITLE_CASE_KEY, value: next }, { onConflict: "key" });
    if (error) throw error;
    setValue(next);
    applyTitleCaseToDocument(next);
  }

  return { value, setValue, loading, save };
}
