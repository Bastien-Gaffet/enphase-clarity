import { Platform, TextStyle } from "react-native";

export const fontFamily = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "system-ui",
});

/** Loaded in `hooks/useAppFonts.ts`. */
export const monoFamily = "SpaceMono";

/**
 * Two faces, each with a job. Prose stays in the system sans; every reading,
 * total and figure is set in the monospace, which is what makes the app read
 * as an instrument rather than as a generic card layout. It also removes the
 * width jitter of proportional digits on values that tick every few seconds.
 *
 * The scale runs to 52 so one figure per screen can dominate — the previous
 * ceiling of 28 left every screen at a single weight.
 */
export const type = {
  /** The single figure a screen is about. */
  hero: {
    fontSize: 52,
    lineHeight: 56,
    fontFamily: monoFamily,
    letterSpacing: -2.5,
  } as TextStyle,
  /** Secondary figure, e.g. a monetary total. */
  display: {
    fontSize: 34,
    lineHeight: 38,
    fontFamily: monoFamily,
    letterSpacing: -1.4,
  } as TextStyle,
  title: { fontSize: 25, lineHeight: 30, fontWeight: "700", letterSpacing: -0.5 } as TextStyle,
  heading: { fontSize: 18, lineHeight: 23, fontWeight: "600", letterSpacing: -0.2 } as TextStyle,
  body: { fontSize: 15, lineHeight: 21, fontWeight: "400" } as TextStyle,
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: "600" } as TextStyle,
  /** All-caps section marker. */
  overline: { fontSize: 10.5, lineHeight: 14, fontWeight: "700", letterSpacing: 1.3 } as TextStyle,
  caption: { fontSize: 12.5, lineHeight: 17, fontWeight: "400" } as TextStyle,
  /**
   * Inline figures inside prose or a table row. SpaceMono is fixed-width by
   * construction, so no tabular-nums feature is needed on top.
   */
  tabular: { fontFamily: monoFamily } as TextStyle,
};

export type TypeToken = keyof typeof type;
