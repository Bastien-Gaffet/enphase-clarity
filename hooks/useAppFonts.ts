import Ionicons from "@expo/vector-icons/Ionicons";
import { useFonts } from "expo-font";

/**
 * Every font the app needs at runtime.
 *
 * `Ionicons.font` is the one that bites: on web the icon font arrives through
 * an injected @font-face and everything looks fine, but a release APK renders
 * blank glyphs unless the font is registered here. It has been dropped from
 * the root layout twice during rewrites, so the map lives in its own module
 * with a test asserting the icon entry is present.
 */
export const APP_FONTS = {
  ...Ionicons.font,
  /** Monospace figures — readings should look instrumented, not typeset. */
  SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
};

/**
 * Returns true once the app may render. A font failure resolves to `true` as
 * well: missing icons are a far better outcome than a permanently blank
 * screen, which is what a hard gate here would produce.
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts(APP_FONTS);
  return loaded || error != null;
}
