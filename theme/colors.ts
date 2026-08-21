/**
 * Design tokens — derived from the validated dataviz reference palette
 * (categorical hues pass CVD ΔE ≥ 8 / normal-vision ΔE ≥ 15 adjacent gates
 * in both light and dark, see dataviz skill references/palette.md).
 * App is dark-first; light mode uses the same steps mirrored.
 */

export type ColorScheme = "light" | "dark";

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
    page: "#0d0d0d",
    surface: "#1a1a19",
    surfaceRaised: "#232322",
    textPrimary: "#ffffff",
    textSecondary: "#c3c2b7",
    textMuted: "#898781",
    hairline: "#2c2c2a",
    border: "rgba(255,255,255,0.10)",
    baseline: "#383835",
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
    grid: series.light.blue, // import from grid
    consumption: chrome.light.textPrimary, // load, drawn in ink, not a category
    battery: series.light.aqua,
    surplus: series.light.aqua, // resold / exported
    evCharging: series.light.orange,
    heuresPleines: series.light.orange,
    heuresCreuses: series.light.blue,
  },
  dark: {
    production: series.dark.yellow,
    grid: series.dark.blue,
    consumption: chrome.dark.textPrimary,
    battery: series.dark.aqua,
    surplus: series.dark.aqua,
    evCharging: series.dark.orange,
    heuresPleines: series.dark.orange,
    heuresCreuses: series.dark.blue,
  },
};

export const palette = { chrome, series, status, energy };

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
  };
}

export type Tokens = ReturnType<typeof tokens>;
