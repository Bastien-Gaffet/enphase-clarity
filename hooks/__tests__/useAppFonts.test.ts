import { APP_FONTS } from "../useAppFonts";

jest.mock("expo-font", () => ({ useFonts: () => [true, null] }));

/**
 * Regression guard. The Ionicons font has been dropped from app startup twice
 * during UI rewrites; both times the web build looked perfect (the icon font
 * arrives there through an injected @font-face) while the release APK drew
 * blank glyphs for every icon.
 */
describe("APP_FONTS", () => {
  it("registers the Ionicons font", () => {
    const names = Object.keys(APP_FONTS);
    expect(names.some((n) => /ionicons/i.test(n))).toBe(true);
  });

  it("registers the monospace face used for figures", () => {
    expect(APP_FONTS).toHaveProperty("SpaceMono");
  });

  it("points every entry at something loadable", () => {
    const empty = Object.entries(APP_FONTS)
      .filter(([, source]) => !source)
      .map(([name]) => name);
    expect(empty).toEqual([]);
  });
});
