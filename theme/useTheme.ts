import { useColorScheme } from "react-native";
import { tokens } from "./colors";
import { type, fontFamily } from "./typography";
import { space, radius } from "./spacing";

export function useTheme() {
  const scheme = useColorScheme() === "light" ? "light" : "dark";
  return {
    scheme,
    colors: tokens(scheme),
    type,
    fontFamily,
    space,
    radius,
  };
}

export type Theme = ReturnType<typeof useTheme>;
