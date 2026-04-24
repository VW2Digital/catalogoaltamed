import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useWhatsAppNumber() {
  const [number, setNumber] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "whatsapp_number")
        .maybeSingle();
      if (active) {
        setNumber(data?.value ?? "");
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { number, loading };
}