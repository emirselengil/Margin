import { useColorScheme } from "react-native";

/** Web'deki (app/globals.css) renk değişkenleriyle birebir aynı palet. */
export type Palette = {
  dark: boolean;
  bg: string;
  surface: string;
  surface2: string;
  sunken: string;
  line: string;
  line2: string;
  ink: string;
  ink2: string;
  muted: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  accentLine: string;
  warn: string;
  warnSoft: string;
  warnText: string;
  warnLine: string;
  ok: string;
};

export const light: Palette = {
  dark: false,
  bg: "#F4F4F1",
  surface: "#FFFFFF",
  surface2: "#FAFAF8",
  sunken: "#F1F1ED",
  line: "#E4E3DE",
  line2: "#D3D1CA",
  ink: "#17171A",
  ink2: "#45454D",
  muted: "#6B6B73",
  accent: "#4F46E5",
  accentSoft: "#ECEBFC",
  accentText: "#3730C4",
  accentLine: "#D6D3FA",
  warn: "#C2410C",
  warnSoft: "#FDF0E7",
  warnText: "#A83A0B",
  warnLine: "#F6D7C3",
  ok: "#15803D",
};

export const dark: Palette = {
  dark: true,
  bg: "#0B0B0E",
  surface: "#141418",
  surface2: "#18181D",
  sunken: "#0F0F12",
  line: "#26262D",
  line2: "#38383F",
  ink: "#EDEDF1",
  ink2: "#BDBDC6",
  muted: "#8E8E99",
  accent: "#5B53EE",
  accentSoft: "#22214A",
  accentText: "#B3AEFF",
  accentLine: "#34326A",
  warn: "#F97316",
  warnSoft: "#2A160C",
  warnText: "#FDBA74",
  warnLine: "#4A2614",
  ok: "#4ADE80",
};

export function usePalette(): Palette {
  return useColorScheme() === "dark" ? dark : light;
}

/** Baş öğretmenleri ayırt eden dönüşümlü avatar renkleri (web ile aynı). */
const AVATARS = {
  light: [
    { bg: "#E0F2FE", fg: "#075985", dot: "#0284C7" },
    { bg: "#FCE7F3", fg: "#9D174D", dot: "#DB2777" },
    { bg: "#D1FAE5", fg: "#065F46", dot: "#059669" },
    { bg: "#FEF3C7", fg: "#92400E", dot: "#D97706" },
    { bg: "#EDE9FE", fg: "#5B21B6", dot: "#7C3AED" },
    { bg: "#CCFBF1", fg: "#115E59", dot: "#0D9488" },
  ],
  dark: [
    { bg: "#0C2A3D", fg: "#7DD3FC", dot: "#38BDF8" },
    { bg: "#3B0F24", fg: "#F9A8D4", dot: "#F472B6" },
    { bg: "#0B2E22", fg: "#6EE7B7", dot: "#34D399" },
    { bg: "#2E1D07", fg: "#FCD34D", dot: "#FBBF24" },
    { bg: "#241A3D", fg: "#C4B5FD", dot: "#A78BFA" },
    { bg: "#072A26", fg: "#5EEAD4", dot: "#2DD4BF" },
  ],
};

export function avatarColors(id: string, isDark: boolean) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATARS[isDark ? "dark" : "light"][hash % 6];
}

export function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase("tr");
  return (parts[0][0] + parts[parts.length - 1][0]).toLocaleUpperCase("tr");
}

export const fonts = {
  regular: "Geist_400Regular",
  medium: "Geist_500Medium",
  semibold: "Geist_600SemiBold",
  mono: "GeistMono_400Regular",
  monoMedium: "GeistMono_500Medium",
} as const;
