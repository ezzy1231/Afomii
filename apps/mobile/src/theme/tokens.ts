import { useColorScheme } from "react-native";

// FoodRide brand palette (docs/plan/02 §4.1)
export const brand = {
  navy: "#0B1F3A",
  navy950: "#060F1D",
  ivory: "#F8F5F0",
  gold: "#C2A878",
  danger: "#C0392B",
  success: "#2E7D32",
  warning: "#B7791F",
} as const;

export type Palette = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  mutedText: string;
  border: string;
  primary: string;
  onPrimary: string;
  accent: string;
};

export const light: Palette = {
  bg: brand.ivory,
  surface: "#FFFFFF",
  surfaceAlt: "#F1EDE6",
  text: brand.navy,
  mutedText: "rgba(11,31,58,0.55)",
  border: "rgba(11,31,58,0.12)",
  primary: brand.navy,
  onPrimary: brand.ivory,
  accent: brand.gold,
};

export const dark: Palette = {
  bg: brand.navy950,
  surface: brand.navy,
  surfaceAlt: "rgba(248,245,240,0.06)",
  text: brand.ivory,
  mutedText: "rgba(248,245,240,0.55)",
  border: "rgba(248,245,240,0.14)",
  primary: brand.gold,
  onPrimary: brand.navy,
  accent: brand.gold,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

export const type = {
  display: { fontSize: 28, fontWeight: "700" as const },
  title: { fontSize: 22, fontWeight: "700" as const },
  heading: { fontSize: 17, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  caption: { fontSize: 13, fontWeight: "400" as const },
  micro: { fontSize: 11, fontWeight: "600" as const, letterSpacing: 0.8, textTransform: "uppercase" as const },
};

export function usePalette(): Palette {
  const scheme = useColorScheme();
  return scheme === "dark" ? dark : light;
}
