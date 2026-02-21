export type BrandPalette = {
  key: string;
  label: string;
  primary: string;
  primarySoft: string;
  primaryForeground: string;
  accent: string;
  swatchClassName: string;
};

export const BRAND_THEMES: BrandPalette[] = [
  {
    key: "petpro",
    label: "FourPet Pro (Padrão)",
    primary: "32 66% 37%",
    primarySoft: "35 100% 70%",
    primaryForeground: "0 0% 100%",
    accent: "31 56% 46%",
    swatchClassName: "bg-gradient-to-br from-amber-700 to-amber-300",
  },
];

const LEGACY_COLOR_MAP: Record<string, string> = {
  "bg-blue-500": "petpro",
  "bg-teal-500": "petpro",
  "bg-green-500": "petpro",
  "bg-purple-500": "petpro",
  "bg-pink-500": "petpro",
  "bg-orange-500": "petpro",
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
  root.style.setProperty("--gradient-primary", `linear-gradient(135deg, hsl(${palette.primary}) 0%, hsl(${palette.primarySoft}) 100%)`);
  root.style.setProperty("--gradient-accent", `linear-gradient(135deg, hsl(${palette.accent}) 0%, hsl(${palette.primarySoft}) 100%)`);
  root.style.setProperty("--shadow-primary", `0 12px 24px -12px hsl(${palette.primary} / 0.35)`);
  root.style.setProperty("--sidebar-primary", palette.primary);
  root.style.setProperty("--sidebar-primary-foreground", palette.primaryForeground);
  root.style.setProperty("--sidebar-ring", palette.primary);
}
