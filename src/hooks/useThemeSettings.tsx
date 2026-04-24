import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ThemeSettings = {
  primary_hsl: string; // e.g. "36 55% 50%"
  font_heading: string; // e.g. "Inter"
  font_body: string;
};

const DEFAULTS: ThemeSettings = {
  primary_hsl: "36 55% 50%",
  font_heading: "Inter",
  font_body: "Inter",
};

const KEYS = ["primary_hsl", "font_heading", "font_body"] as const;

type Ctx = {
  settings: ThemeSettings;
  loading: boolean;
  /** Live-preview only (does not persist) */
  preview: (partial: Partial<ThemeSettings>) => void;
  /** Reset preview back to last saved settings */
  resetPreview: () => void;
  /** Persist + apply */
  save: (partial: Partial<ThemeSettings>) => Promise<void>;
};

const ThemeSettingsContext = createContext<Ctx | null>(null);

/** Build a Google Fonts <link> with families currently in use. */
function ensureGoogleFont(family: string) {
  if (!family || family === "system-ui") return;
  const id = `gf-${family.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

function applyToDocument(s: ThemeSettings) {
  const root = document.documentElement;
  root.style.setProperty("--primary", s.primary_hsl);
  root.style.setProperty("--ring", s.primary_hsl);
  root.style.setProperty("--font-heading", `'${s.font_heading}', ui-sans-serif, system-ui, sans-serif`);
  root.style.setProperty("--font-body", `'${s.font_body}', ui-sans-serif, system-ui, sans-serif`);
  ensureGoogleFont(s.font_heading);
  ensureGoogleFont(s.font_body);
}

export function ThemeSettingsProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<ThemeSettings>(DEFAULTS);
  const [current, setCurrent] = useState<ThemeSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", KEYS as unknown as string[]);
      const next: ThemeSettings = { ...DEFAULTS };
      data?.forEach((row) => {
        if ((KEYS as readonly string[]).includes(row.key) && row.value) {
          (next as Record<string, string>)[row.key] = row.value;
        }
      });
      setSaved(next);
      setCurrent(next);
      applyToDocument(next);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    applyToDocument(current);
  }, [current]);

  const preview = useCallback((partial: Partial<ThemeSettings>) => {
    setCurrent((c) => ({ ...c, ...partial }));
  }, []);

  const resetPreview = useCallback(() => {
    setCurrent(saved);
  }, [saved]);

  const save = useCallback(
    async (partial: Partial<ThemeSettings>) => {
      const merged = { ...saved, ...partial };
      const rows = (Object.keys(partial) as Array<keyof ThemeSettings>).map((k) => ({
        key: k,
        value: merged[k],
      }));
      const { error } = await supabase
        .from("settings")
        .upsert(rows, { onConflict: "key" });
      if (error) throw error;
      setSaved(merged);
      setCurrent(merged);
    },
    [saved]
  );

  const value = useMemo<Ctx>(
    () => ({ settings: current, loading, preview, resetPreview, save }),
    [current, loading, preview, resetPreview, save]
  );

  return (
    <ThemeSettingsContext.Provider value={value}>{children}</ThemeSettingsContext.Provider>
  );
}

export function useThemeSettings() {
  const ctx = useContext(ThemeSettingsContext);
  if (!ctx) throw new Error("useThemeSettings must be used within ThemeSettingsProvider");
  return ctx;
}

export const FONT_OPTIONS = [
  "Inter",
  "Poppins",
  "Montserrat",
  "Roboto",
  "Open Sans",
  "Lato",
  "Playfair Display",
  "Merriweather",
  "DM Sans",
  "Space Grotesk",
] as const;

export const COLOR_PRESETS: { name: string; hsl: string }[] = [
  { name: "Dourado", hsl: "36 55% 50%" },
  { name: "Azul", hsl: "217 91% 55%" },
  { name: "Roxo", hsl: "262 80% 58%" },
  { name: "Verde", hsl: "152 60% 42%" },
  { name: "Rosa", hsl: "340 82% 58%" },
  { name: "Vermelho", hsl: "0 72% 50%" },
  { name: "Laranja", hsl: "24 90% 55%" },
  { name: "Grafite", hsl: "220 20% 25%" },
];

/** Convert "H S% L%" → "#RRGGBB" */
export function hslToHex(hsl: string): string {
  const m = hsl.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) return "#000000";
  const h = Number(m[1]);
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const v = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Convert "#RRGGBB" → "H S% L%" */
export function hexToHsl(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "0 0% 0%";
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}