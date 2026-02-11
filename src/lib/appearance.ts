export type BrandPalette = {
  key: string;
  label: string;
  primary: string;
  primarySoft: string;
  primaryForeground: string;
  accent: string;
};

export const BRAND_THEMES: BrandPalette[] = [
  {
    key: "petpro",
    label: "Pet Pro",
    primary: "180 60% 45%",
    primarySoft: "180 70% 55%",
    primaryForeground: "0 0% 100%",
    accent: "15 75% 60%",
  },
  {
    key: "ocean",
    label: "Oceano",
    primary: "205 85% 50%",
    primarySoft: "194 90% 62%",
    primaryForeground: "0 0% 100%",
    accent: "28 90% 60%",
  },
  {
    key: "indigo",
    label: "Índigo",
    primary: "231 78% 56%",
    primarySoft: "244 82% 68%",
    primaryForeground: "0 0% 100%",
    accent: "24 95% 60%",
  },
  {
    key: "emerald",
    label: "Esmeralda",
    primary: "152 65% 42%",
    primarySoft: "146 70% 52%",
    primaryForeground: "0 0% 100%",
    accent: "33 90% 58%",
  },
  {
    key: "sunset",
    label: "Pôr do Sol",
    primary: "18 90% 55%",
    primarySoft: "30 95% 60%",
    primaryForeground: "0 0% 100%",
    accent: "212 90% 56%",
  },
  {
    key: "plum",
    label: "Ameixa",
    primary: "280 70% 55%",
    primarySoft: "300 72% 65%",
    primaryForeground: "0 0% 100%",
    accent: "24 90% 60%",
  },
];

const LEGACY_COLOR_MAP: Record<string, string> = {
  "bg-blue-500": "ocean",
  "bg-teal-500": "petpro",
  "bg-green-500": "emerald",
  "bg-purple-500": "plum",
  "bg-pink-500": "sunset",
  "bg-orange-500": "sunset",
};

export function resolveBrandPalette(key?: string | null): BrandPalette {
  const normalized = (key ?? "").trim();
  const mapped = LEGACY_COLOR_MAP[normalized] ?? normalized;
  return BRAND_THEMES.find((t) => t.key === mapped) ?? BRAND_THEMES[0];
}

export function applyBrandPalette(palette: BrandPalette) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--primary", palette.primary);
  root.style.setProperty("--primary-soft", palette.primarySoft);
  root.style.setProperty("--primary-foreground", palette.primaryForeground);
  root.style.setProperty("--accent", palette.accent);
  root.style.setProperty("--ring", palette.primary);
  root.style.setProperty("--shadow-primary", `0 12px 24px -12px hsl(${palette.primary} / 0.35)`);
  root.style.setProperty("--sidebar-primary", palette.primary);
  root.style.setProperty("--sidebar-primary-foreground", palette.primaryForeground);
  root.style.setProperty("--sidebar-ring", palette.primary);
}
