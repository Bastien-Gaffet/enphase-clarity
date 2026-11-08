import fs from "fs";
import path from "path";
import { APP_FONTS, FONT_FAMILIES } from "../useAppFonts";

jest.mock("expo-font", () => ({ useFonts: () => [true, null], isLoaded: () => true }));

const root = path.resolve(__dirname, "../..");
const appJson = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));

/** The font files the expo-font config plugin copies into the APK. */
function embeddedFonts(): string[] {
  const entry = (appJson.expo.plugins as unknown[]).find(
    (p) => Array.isArray(p) && p[0] === "expo-font"
  ) as [string, { fonts: string[] }] | undefined;
  return entry ? entry[1].fonts : [];
}

/**
 * The icons were blank on a real phone three times while every browser check
 * passed. A first guard only asserted that Ionicons was in the font map —
 * true all along, and useless: the font was registered, it just never reached
 * Android. These tests check what Android actually needs.
 */
describe("fonts embedded in the APK", () => {
  it("registers the icon font and the monospace face", () => {
    expect(FONT_FAMILIES).toEqual(expect.arrayContaining(["ionicons", "SpaceMono"]));
  });

  // Android finds a font family by file name, case included: a style asking
  // for "ionicons" will not match a file called Ionicons.ttf.
  it("embeds every family under a file named exactly after it", () => {
    const embeddedFamilies = embeddedFonts().map((f) => path.basename(f, path.extname(f)));
    const missing = FONT_FAMILIES.filter((family) => !embeddedFamilies.includes(family));
    expect(missing).toEqual([]);
  });

  it("points the plugin at files that exist", () => {
    const absent = embeddedFonts().filter((f) => !fs.existsSync(path.join(root, f)));
    expect(absent).toEqual([]);
  });

  // The glyph map lives in the installed @expo/vector-icons. If that package
  // is upgraded and the embedded copy is not, every icon shows the wrong glyph.
  it("ships the same icon font as the installed @expo/vector-icons", () => {
    const vendored = fs.readFileSync(
      require.resolve("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf")
    );
    const embedded = fs.readFileSync(path.join(root, "assets/fonts/ionicons.ttf"));
    expect(embedded.equals(vendored)).toBe(true);
  });

  it("keeps a web source for every family", () => {
    const empty = Object.entries(APP_FONTS).filter(([, s]) => !s).map(([n]) => n);
    expect(empty).toEqual([]);
  });
});
