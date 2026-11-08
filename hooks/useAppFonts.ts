import { useEffect } from "react";
import { Platform } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFonts, isLoaded } from "expo-font";

/**
 * Every font the app needs, keyed by the family name styles ask for.
 *
 * On Android these are NOT loaded at runtime: they are embedded in the APK by
 * the expo-font config plugin (app.json), under android/app/src/main/assets/
 * fonts/<family>.ttf. Android resolves a font family by FILE NAME, case
 * included, which is why the files are `ionicons.ttf` (the family
 * @expo/vector-icons asks for is lowercase) and `SpaceMono.ttf`.
 *
 * Why embed rather than load: runtime loading through expo-asset rejected on
 * a real phone, and an icon from @expo/vector-icons renders an empty <Text />
 * until its font reports loaded — hence blank badges and a blank tab bar,
 * twice, while every check run in a browser was green. An embedded font is
 * reported loaded by the native module at startup, so the icon never waits
 * on anything. `hooks/__tests__/useAppFonts.test.ts` fails if a family here
 * is not embedded under its exact name.
 *
 * On web the same map still goes through useFonts, which injects @font-face.
 */
export const APP_FONTS = {
  ...Ionicons.font,
  /** Monospace figures — readings should look instrumented, not typeset. */
  SpaceMono: require("../assets/fonts/SpaceMono.ttf"),
};

export const FONT_FAMILIES = Object.keys(APP_FONTS);

/**
 * Returns true once the app may render. A font failure resolves to `true` as
 * well — missing icons beat a permanently blank screen — but it is no longer
 * silent: the outcome is logged once, and the Android smoke test in CI reads
 * that line from logcat.
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts(APP_FONTS);
  const ready = loaded || error != null;

  useEffect(() => {
    if (!ready) return;
    const status = FONT_FAMILIES.map((f) => `${f}=${isLoaded(f) ? "ok" : "MISSING"}`).join(" ");
    const line = `[fonts] ${Platform.OS} ${status}${error ? ` error=${error.message}` : ""}`;
    if (error || status.includes("MISSING")) console.warn(line);
    else console.log(line);
  }, [ready, error]);

  return ready;
}
