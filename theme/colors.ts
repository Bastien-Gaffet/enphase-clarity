/**
 * Design tokens, one palette per scheme.
 *
 * Both palettes share an identical shape, so a component reads
 * `colors.ink.secondary` without caring which scheme is active. The light
 * palette is designed for paper — it is not the dark one inverted: surfaces
 * get lighter as they come forward (the reverse of dark), and the brand
 * accent and highlight are darkened, since `#3685B5` and especially
 * `#A8F9FF` lose their contrast on white.
 *
 * Data hues follow the validated dataviz palette, taking each scheme's own
 * step rather than reusing one value on both surfaces.
 */

export type Scheme = "light" | "dark";

const dark = {
  page: "#06070E",
  sunken: "#04050A",
  base: "#0E111B",
  raised: "#161A27",
  overlay: "#1D2233",

  brand: {
    night: "#06070E",
    // Darkened from #3685B5: as a fill behind white button and segment
    // labels the brighter tone only reached 4.05:1, short of AA.
    accent: "#30789F",
    highlight: "#A8F9FF",
  },

  ink: {
    primary: "#FFFFFF",
    secondary: "#B7C0D1",
    muted: "#7C8496",
    // Raised from #4A5265, which sat at 2.4:1 — below AA wherever it carried
    // text (tab labels, captions, the hero when production is zero).
    faint: "#79818F",
    onAccent: "#FFFFFF",
  },

  line: {
    hairline: "#1C2130",
    strong: "#2A3142",
    edge: "rgba(168,249,255,0.08)",
  },

  status: {
    good: "#22C55E",
    warning: "#FAB219",
    critical: "#F0564E",
  },

  energy: {
    production: "#E8A317",
    consumption: "#FFFFFF",
    grid: "#3685B5",
    surplus: "#1FB47E",
    evCharging: "#E8743B",
    heuresPleines: "#E8743B",
    heuresCreuses: "#3685B5",
  },
};

const light: typeof dark = {
  // Surfaces run the other way round: the page is the darkest plane and
  // cards lift off it by getting whiter.
  page: "#F4F6FA",
  sunken: "#E7ECF3",
  base: "#FFFFFF",
  raised: "#F0F3F8",
  overlay: "#FFFFFF",

  brand: {
    night: "#06070E",
    // Darkened from #3685B5: white text on the lighter tone only reaches
    // 3.2:1, short of AA for button labels.
    accent: "#2A6A91",
    // #A8F9FF is all but invisible on white, so the highlight role takes a
    // deep cyan of the same family.
    highlight: "#0C6E86",
  },

  ink: {
    primary: "#0B0F18",
    secondary: "#434B5C",
    muted: "#5C6676",
    // Same correction as the dark scale: #8A93A3 only reached 3.1:1 on the page.
    faint: "#616A7A",
    onAccent: "#FFFFFF",
  },

  line: {
    hairline: "#E2E7EF",
    strong: "#C9D1DE",
    edge: "rgba(11,15,24,0.10)",
  },

  status: {
    good: "#0E8F3C",
    // Chip labels paint this colour on a tint of itself over white, so it
    // needs to be darker than it looks in isolation.
    warning: "#86580A",
    critical: "#C62F26",
  },

  energy: {
    production: "#B87A0B",
    consumption: "#0B0F18",
    grid: "#2A6A91",
    surplus: "#0E7F58",
    evCharging: "#A8430F",
    heuresPleines: "#A8430F",
    heuresCreuses: "#2A6A91",
  },
};

export const palettes = { light, dark };

export type Palette = typeof dark;

/** Brand constants that never change with the scheme (app icon, splash). */
export const brand = {
  night: "#06070E",
  accent: "#3685B5",
  highlight: "#A8F9FF",
};
