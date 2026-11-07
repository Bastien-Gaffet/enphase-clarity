import { colors } from "./colors";
import { type, fontFamily } from "./typography";
import { space, radius, gutter, tabBarHeight } from "./spacing";

/**
 * The theme is a constant now that the app is dark-only, but it stays behind a
 * hook so call sites keep working unchanged if a light scale is reintroduced.
 */
export function useTheme() {
  return { colors, type, fontFamily, space, radius, gutter, tabBarHeight };
}

export type Theme = ReturnType<typeof useTheme>;
