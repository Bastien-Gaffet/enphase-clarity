/**
 * Design tokens.
 *
 * Dark-only by choice: the brand is anchored on a near-black (#06070E) and the
 * previous light theme was a leftover warm-neutral scale that clashed with it.
 * A half-maintained second theme is worse than one committed to, so the app
 * declares `userInterfaceStyle: "dark"`. The shape below still separates brand
 * / surface / ink / data, so a light scale can be added later without
 * rewriting call sites.
 *
 * Data colours keep the validated dataviz hues (CVD ΔE ≥ 8 between adjacent
 * slots); brand colours are the three the owner chose.
 */

export const brand = {
  /** Page backdrop. */
  night: "#06070E",
  /** Interactive / structural accent. */
  accent: "#3685B5",
  /** Highlight for active icons and key figures. Used sparingly — it shouts. */
  highlight: "#A8F9FF",
};

/** Surfaces, tinted toward the brand night rather than neutral grey. */
const surface = {
  page: "#06070E",
  sunken: "#04050A",
  base: "#0E111B",
  raised: "#161A27",
  overlay: "#1D2233",
};

const ink = {
  primary: "#FFFFFF",
  secondary: "#B7C0D1",
  muted: "#7C8496",
  faint: "#4A5265",
  /** Text sitting on an accent fill. */
  onAccent: "#FFFFFF",
};

const line = {
  hairline: "#1C2130",
  strong: "#2A3142",
  /** Card edge: a whisper of the highlight keeps the chrome on-brand. */
  edge: "rgba(168,249,255,0.08)",
};

/** Reserved state colours — never reused as a data series. */
const status = {
  good: "#22C55E",
  warning: "#FAB219",
  critical: "#F0564E",
};

/** Energy semantics — each flow keeps one hue everywhere in the app. */
const energy = {
  production: "#E8A317",
  consumption: "#FFFFFF",
  grid: "#3685B5",
  surplus: "#1FB47E",
  evCharging: "#E8743B",
  heuresPleines: "#E8743B",
  heuresCreuses: "#3685B5",
};

export const colors = {
  ...surface,
  brand,
  ink,
  line,
  status,
  energy,
};

export type Colors = typeof colors;
