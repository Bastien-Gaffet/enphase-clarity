/**
 * Design tokens — derived from the validated dataviz reference palette
 * (categorical hues pass CVD ΔE ≥ 8 / normal-vision ΔE ≥ 15 adjacent gates
 * in both light and dark, see dataviz skill references/palette.md).
 * App is dark-first; light mode uses the same steps mirrored.
 *
 * Dark-mode chrome and the `brand` accent/highlight pair are the app's own
 * palette (background #06070E, accent #3685B5, highlight #A8F9FF — 17.5:1
 * and 6.3:1 contrast on that background respectively). Light mode keeps a
 * deepened highlight (#A8F9FF has near-zero contrast on white) and reuses
 * the accent as-is (3.2:1 on white — fine for icons/large UI, not body text).
 */

export type ColorScheme = "light" | "dark";

const brand = {
  light: {
    accent: "#3685B5",
    highlight: "#0E7490", // deepened cyan — #A8F9FF has ~1:1 contrast on white
  },
  dark: {
    accent: "#3685B5",
    highlight: "#A8F9FF",
  },
};

const chrome = {
  light: {
    page: "#f9f9f7",
    surface: "#fcfcfb",
    surfaceRaised: "#ffffff",
    textPrimary: "#0b0b0b",
    textSecondary: "#52514e",
    textMuted: "#898781",
    hairline: "#e1e0d9",
    border: "rgba(11,11,11,0.10)",
    baseline: "#c3c2b7",
  },
  dark: {
    page: "#06070E",
    surface: "#10121C",
    surfaceRaised: "#171A28",
    textPrimary: "#ffffff",
    textSecondary: "#B7C0D1",
    textMuted: "#7C8496",
    hairline: "#232739",
    border: "rgba(168,249,255,0.10)",
    baseline: "#2E3346",
  },
};

// Categorical slots, fixed order — never reassigned per-chart.
const series = {
  light: {
    blue: "#2a78d6",
    orange: "#eb6834",
    aqua: "#1baf7a",
    yellow: "#eda100",
    magenta: "#e87ba4",
    green: "#008300",
    violet: "#4a3aa7",
    red: "#e34948",
  },
  dark: {
    blue: "#3987e5",
    orange: "#d95926",
    aqua: "#199e70",
    yellow: "#c98500",
    magenta: "#d55181",
    green: "#008300",
    violet: "#9085e9",
    red: "#e66767",
  },
};

const status = {
  good: { light: "#0ca30c", dark: "#0ca30c" },
  warning: { light: "#fab219", dark: "#fab219" },
  serious: { light: "#ec835a", dark: "#ec835a" },
  critical: { light: "#d03b3b", dark: "#d03b3b" },
};

/** Domain semantics — energy flows always keep the same hue across the app. */
const energy = {
  light: {
    production: series.light.yellow, // solar
    grid: brand.light.accent, // import from grid — ties to the brand accent
    consumption: chrome.light.textPrimary, // load, drawn in ink, not a category
    battery: series.light.aqua,
    surplus: series.light.aqua, // resold / exported
    evCharging: series.light.orange,
    heuresPleines: series.light.orange,
    heuresCreuses: series.light.blue,
  },
  dark: {
    production: series.dark.yellow,
    grid: brand.dark.accent,
    consumption: chrome.dark.textPrimary,
    battery: series.dark.aqua,
    surplus: series.dark.aqua,
    evCharging: series.dark.orange,
    heuresPleines: series.dark.orange,
    heuresCreuses: series.dark.blue,
  },
};

export const palette = { chrome, series, status, energy, brand };

function statusFor(scheme: ColorScheme) {
  return {
    good: status.good[scheme],
    warning: status.warning[scheme],
    serious: status.serious[scheme],
    critical: status.critical[scheme],
  };
}

export function tokens(scheme: ColorScheme) {
  return {
    ...chrome[scheme],
    series: series[scheme],
    status: statusFor(scheme),
    energy: energy[scheme],
    brand: brand[scheme],
  };
}

export type Tokens = ReturnType<typeof tokens>;
