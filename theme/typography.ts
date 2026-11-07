import { Platform, TextStyle } from "react-native";

export const fontFamily = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "system-ui",
});

/**
 * The previous scale topped out at 28, so every screen read at a single
 * weight. These hero steps exist so one figure per screen can dominate and
 * everything else recede — the main cause of the old "flat" feel.
 */
export const type = {
  /** The single figure a screen is about. */
  hero: { fontSize: 56, lineHeight: 58, fontWeight: "700", letterSpacing: -2 } as TextStyle,
  /** Secondary hero, e.g. a monetary total. */
  display: { fontSize: 38, lineHeight: 42, fontWeight: "700", letterSpacing: -1.2 } as TextStyle,
  title: { fontSize: 26, lineHeight: 31, fontWeight: "700", letterSpacing: -0.5 } as TextStyle,
  heading: { fontSize: 19, lineHeight: 24, fontWeight: "600", letterSpacing: -0.2 } as TextStyle,
  body: { fontSize: 15, lineHeight: 21, fontWeight: "400" } as TextStyle,
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: "600" } as TextStyle,
  /** All-caps section marker. */
  overline: { fontSize: 11, lineHeight: 14, fontWeight: "700", letterSpacing: 1.1 } as TextStyle,
  caption: { fontSize: 12.5, lineHeight: 17, fontWeight: "400" } as TextStyle,
  /** Figures that must line up in columns. */
  tabular: { fontVariant: ["tabular-nums"] } as TextStyle,
};

export type TypeToken = keyof typeof type;
