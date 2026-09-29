// Design tokens for Malaeb — "Dark-First Utility" personality.
// Dark palette applied as the app's single scheme (dark-first). Values come
// from /app/design_guidelines.json.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const palette = {
  // Surfaces
  surface: "#0B120F",
  onSurface: "#F0FDF4",
  surfaceSecondary: "#15231C",
  onSurfaceSecondary: "#E0F2E9",
  surfaceTertiary: "#1E3127",
  onSurfaceTertiary: "#A7D4B6",
  surfaceInverse: "#D4FF00",
  onSurfaceInverse: "#061A0C",
  muted: "#7E9F8B",

  // Brand
  brand: "#D4FF00",
  onBrand: "#061A0C",
  brandPrimary: "#D4FF00",
  onBrandPrimary: "#061A0C",
  brandSecondary: "#00AB4E",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#004B23",
  onBrandTertiary: "#D4FF00",

  // Status
  success: "#00E065",
  onSuccess: "#001A09",
  warning: "#FFB700",
  onWarning: "#1A1200",
  error: "#FF3333",
  onError: "#2B0000",
  info: "#00D4FF",
  onInfo: "#001A22",

  // Lines
  border: "#20362A",
  borderStrong: "#324D3E",
  divider: "#1A2B21",
};

export type ThemeColors = typeof palette;

export const defaultScheme = "dark" satisfies ColorScheme;

// Both schemes use the same dark-first palette so the app always renders dark.
export const themes: { light: ThemeColors; dark?: ThemeColors } = { light: palette, dark: palette };

export const fonts = {
  display: "BarlowCondensed-Bold",
  displaySemi: "BarlowCondensed-SemiBold",
  text: "Manrope",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48 };
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
