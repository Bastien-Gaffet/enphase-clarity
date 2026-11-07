import { useColorScheme } from "react-native";
import { palettes, Scheme } from "./colors";
import { type, fontFamily } from "./typography";
import { space, radius, gutter, tabBarHeight } from "./spacing";
import { useSettingsStore } from "../store/useSettingsStore";

export type ThemePreference = "system" | "light" | "dark";

/**
 * Resolves the active scheme from the OS setting and the user's override.
 *
 * Components must read colours through this hook rather than importing a
 * palette: a module-level import freezes one scheme at load time, which is
 * how the first attempt at a light theme silently rotted.
 */
export function useTheme() {
  const system = useColorScheme();
  const preference = useSettingsStore((s) => s.themePreference);

  const scheme: Scheme =
    preference === "system" ? (system === "light" ? "light" : "dark") : preference;

  return {
    scheme,
    colors: palettes[scheme],
    type,
    fontFamily,
    space,
    radius,
    gutter,
    tabBarHeight,
  };
}

export type Theme = ReturnType<typeof useTheme>;
