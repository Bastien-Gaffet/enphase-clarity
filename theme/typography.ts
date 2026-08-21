import { Platform } from "react-native";

/** System sans everywhere — no display/serif face, per dataviz type guidance. */
export const fontFamily = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "system-ui",
});

export const type = {
  hero: { fontSize: 44, lineHeight: 48, fontWeight: "700" as const, letterSpacing: -0.5 },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: "700" as const, letterSpacing: -0.3 },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: "600" as const, letterSpacing: -0.1 },
  body: { fontSize: 15, lineHeight: 21, fontWeight: "400" as const },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: "600" as const },
  label: { fontSize: 12, lineHeight: 16, fontWeight: "600" as const, letterSpacing: 0.4 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: "400" as const },
  tabular: { fontVariant: ["tabular-nums"] as const },
};
